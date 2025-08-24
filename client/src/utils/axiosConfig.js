import axios from 'axios';
import store from '../store';
import { logout } from '../actions/userActions';

// Request interceptor (항상 Authorization 헤더 추가)
axios.interceptors.request.use(
  (config) => {
    try {
      const userInfo = localStorage.getItem("userInfo")
        ? JSON.parse(localStorage.getItem("userInfo"))
        : null;

      if (userInfo && userInfo.access) {
        config.headers.Authorization = `Bearer ${userInfo.access}`;
      }
    } catch (err) {
      console.error("토큰 로드 실패:", err);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (401 → refresh 시도)
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { userInfo } = store.getState().userLogin;
      if (userInfo && userInfo.refresh) {
        try {
          const { data } = await axios.post('/api/users/refresh/', {
            refresh: userInfo.refresh,
          });

          const newUserInfo = {
            ...userInfo,
            access: data.access,
          };
          localStorage.setItem('userInfo', JSON.stringify(newUserInfo));

          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return axios(originalRequest);
        } catch (refreshError) {
          store.dispatch(logout());
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);
