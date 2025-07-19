import axios from 'axios'
import {
  PRODUCT_LIST_REQUEST,
  PRODUCT_LIST_SUCCESS,
  PRODUCT_LIST_FAIL,
} from '../constants/productConstants'


// 상품 목록 조회 액션 (검색어 포함 가능)
export const listProducts = (keyword = '') => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_LIST_REQUEST })

    const url = keyword ? `/api/products/?keyword=${keyword}` : '/api/products/'
    const { data } = await axios.get(url)

    dispatch({
      type: PRODUCT_LIST_SUCCESS,
      payload: data,
    })
  } 
  
  catch (error) {
    dispatch({
      type: PRODUCT_LIST_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    })
  }
}