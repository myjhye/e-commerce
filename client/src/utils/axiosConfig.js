import axios from 'axios';
import store from '../store';
import { logout } from '../actions/userActions';

// axios 인스턴스 (백엔드 API 주소로 baseURL 지정)
export const api = axios.create({
  baseURL: 'http://localhost:8000', // Django 서버 주소
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor → 항상 access token 붙이기
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (userInfo?.access) {
      config.headers.Authorization = `Bearer ${userInfo.access}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor → access 만료 시 refresh 요청
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { userInfo } = store.getState().userLogin;
      if (userInfo?.refresh) {
        try {
          const { data } = await api.post(
            '/api/users/refresh/',
            { refresh: userInfo.refresh },
            { headers: { Authorization: '' } } // refresh 요청은 access 토큰 필요 없음
          );

          const newUserInfo = {
            ...userInfo,
            access: data.access,
            refresh: data.refresh || userInfo.refresh,
          };
          localStorage.setItem('userInfo', JSON.stringify(newUserInfo));

          // 원래 요청에 새 access token 적용 후 재요청
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          store.dispatch(logout());
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;