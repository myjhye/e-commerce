import axios from 'axios'
import { USER_LOGIN_FAIL, USER_LOGIN_REQUEST, USER_LOGIN_SUCCESS, USER_LOGOUT } from "../constants/userConstants"


// 로그인 액션
export const login = (email, password) => async (dispatch) => {
    try {
        dispatch({
            type: USER_LOGIN_REQUEST
        })

        const config = {
            headers: {
                'Content-type': 'application/json'
            }
        }

        const { data } = await axios.post(
            '/api/users/login/',
            { 
                'username': email, 
                'password': password 
            },
            config
        )

        dispatch({
            type: USER_LOGIN_SUCCESS,
            payload: data
        })

        // 로그인 성공 시 localStorage에 사용자 정보 저장
        localStorage.setItem('userInfo', JSON.stringify(data))

    }
    catch (error) {
        dispatch({
            type: USER_LOGIN_FAIL,
            payload: error.response && error.response.data.detail
                ? error.response.data.detail
                : error.message,
        })
    }
}

// 로그아웃 액션
export const logout = () => (dispatch) => {
    localStorage.removeItem('userInfo');
    dispatch({ 
        type: USER_LOGOUT 
    });
};