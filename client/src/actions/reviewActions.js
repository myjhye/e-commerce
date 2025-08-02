import axios from 'axios'
import {
    PRODUCT_REVIEW_LIST_REQUEST,
    PRODUCT_REVIEW_LIST_SUCCESS,
    PRODUCT_REVIEW_LIST_FAIL
} from '../constants/reviewConstants'

export const listProductReviews = (productId, page = 1) => async (dispatch) => {
    try {
        dispatch({ type: PRODUCT_REVIEW_LIST_REQUEST })

        const { data } = await axios.get(`/api/reviews/${productId}/?page=${page}`)

        dispatch({
            type: PRODUCT_REVIEW_LIST_SUCCESS,
            payload: {
                reviews: data.results, // results만 담음
                page: data.page,
                pages: data.pages
            }
        })
    } catch (error) {
        dispatch({
            type: PRODUCT_REVIEW_LIST_FAIL,
            payload:
                error.response && error.response.data.detail
                    ? error.response.data.detail
                    : error.message,
        })
    }
}