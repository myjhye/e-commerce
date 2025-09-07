import axios from 'axios';
import store from '../store';
import { logout } from '../actions/userActions';
import { USER_LOGIN_SUCCESS } from '../constants/userConstants';

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor (항상 Authorization 헤더 추가)
api.interceptors.request.use(
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
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      let userInfo = store.getState().userLogin?.userInfo;
      if (!userInfo) {
        userInfo = localStorage.getItem('userInfo')
          ? JSON.parse(localStorage.getItem('userInfo'))
          : null;
      }

      if (userInfo && userInfo.refresh) {
        try {
          const { data } = await api.post(
            '/api/users/refresh/',
            { refresh: userInfo.refresh },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const newUserInfo = { ...userInfo, access: data.access };

          // localStorage 갱신
          localStorage.setItem('userInfo', JSON.stringify(newUserInfo));

          // Redux store 갱신
          store.dispatch({
            type: USER_LOGIN_SUCCESS,
            payload: newUserInfo,
          });

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