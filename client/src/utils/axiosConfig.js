import axios from 'axios';
import store from '../store';
import { logout } from '../actions/userActions';

// Request interceptor (모든 요청에 토큰 자동 추가)
axios.interceptors.request.use(
    (config) => {
        const { userInfo } = store.getState().userLogin; // 현재 로그인된 사용자 정보
        if (userInfo && userInfo.access) { // 사용자가 로그인되어 있고 access token이 있다면
            config.headers.Authorization = `Bearer ${userInfo.access}`; // 모든 요청 헤더에 Bearer 토큰 자동 추가
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Response interceptor (401 에러 시 토큰 갱신 시도)
axios.interceptors.response.use(
    (response) => response, // 정상 응답은 그대로 반환
    async (error) => {
        const originalRequest = error.config; // 실패한 원본 요청 정보 저장

        if (error.response?.status === 401 && !originalRequest._retry) { // 401 에러이고 아직 재시도하지 않은 요청인 경우
            originalRequest._retry = true; // 무한 루프 방지를 위한 플래그 설정

            const { userInfo } = store.getState().userLogin;
            if (userInfo && userInfo.refresh) {
                try {
                    const { data } = await axios.post('/api/users/refresh/', { // refresh token으로 새로운 access token 요청
                        refresh: userInfo.refresh
                    });

                    // 새 access token으로 사용자 정보 업데이트
                    const newUserInfo = { 
                        ...userInfo,  // 기존 사용자 정보 유지
                        access: data.access  // 새로운 access token으로 교체
                    };
                    localStorage.setItem('userInfo', JSON.stringify(newUserInfo)); // localStorage에 업데이트된 사용자 정보 저장 (새로고침 시에도 유지)

                    // 실패했던 원본 요청에 새로운 토큰을 추가하여 재시도
                    originalRequest.headers.Authorization = `Bearer ${data.access}`;
                    return axios(originalRequest); // 업데이트된 토큰으로 요청 재실행

                }
                catch (refreshError) {
                    // refresh token도 만료되었거나 갱신 실패 (더 이상 유효한 토큰이 없으므로 로그아웃 처리)
                    store.dispatch(logout());
                    window.location.href = '/login';
                }
            }
        }
    }
);