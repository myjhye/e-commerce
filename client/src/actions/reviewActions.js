import {
    PRODUCT_REVIEW_LIST_REQUEST,
    PRODUCT_REVIEW_LIST_SUCCESS,
    PRODUCT_REVIEW_LIST_FAIL,
    
    PRODUCT_REVIEW_DELETE_REQUEST,
    PRODUCT_REVIEW_DELETE_SUCCESS,
    PRODUCT_REVIEW_DELETE_FAIL,
    
    PRODUCT_REVIEW_UPDATE_REQUEST,
    PRODUCT_REVIEW_UPDATE_SUCCESS,
    PRODUCT_REVIEW_UPDATE_FAIL
} from '../constants/reviewConstants'
import api from '../utils/axiosConfig'

export const listProductReviews = (productId, page = 1) => async (dispatch) => {
    try {
        dispatch({ type: PRODUCT_REVIEW_LIST_REQUEST })

        const { data } = await api.get(`/api/reviews/${productId}/?page=${page}`)

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


export const updateProductReview = (productId, reviewId, reviewData) => async (dispatch) => {
    try {
        dispatch({ type: PRODUCT_REVIEW_UPDATE_REQUEST })

        const { data } = await api.put(
            `/api/reviews/${productId}/${reviewId}/update/`,
            reviewData
        )

        dispatch({ 
            type: PRODUCT_REVIEW_UPDATE_SUCCESS,
            payload: data
        })

    } catch (error) {
        dispatch({
            type: PRODUCT_REVIEW_UPDATE_FAIL,
            payload:
                error.response && error.response.data.detail
                    ? error.response.data.detail
                    : error.message,
        })
    }
}


export const deleteProductReview = (productId, reviewId) => async (dispatch) => {
    try {
        dispatch({ type: PRODUCT_REVIEW_DELETE_REQUEST })

        await api.delete(`/api/reviews/${productId}/${reviewId}/delete/`)

        dispatch({ type: PRODUCT_REVIEW_DELETE_SUCCESS })

    } catch (error) {
        dispatch({
            type: PRODUCT_REVIEW_DELETE_FAIL,
            payload:
                error.response && error.response.data.detail
                    ? error.response.data.detail
                    : error.message,
        })
    }
}
