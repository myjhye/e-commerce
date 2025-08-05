import {
    PRODUCT_REVIEW_LIST_REQUEST,
    PRODUCT_REVIEW_LIST_SUCCESS,
    PRODUCT_REVIEW_LIST_FAIL,
    
    PRODUCT_REVIEW_DELETE_REQUEST,
    PRODUCT_REVIEW_DELETE_SUCCESS,
    PRODUCT_REVIEW_DELETE_FAIL,
    PRODUCT_REVIEW_DELETE_RESET,
    
    PRODUCT_REVIEW_UPDATE_REQUEST,
    PRODUCT_REVIEW_UPDATE_SUCCESS,
    PRODUCT_REVIEW_UPDATE_FAIL,
    PRODUCT_REVIEW_UPDATE_RESET
} from '../constants/reviewConstants'

export const productReviewListReducer = (state = { reviews: [] }, action) => {
    switch (action.type) {
        case PRODUCT_REVIEW_LIST_REQUEST:
            return { 
                loading: true, 
                reviews: [] 
            }
            
        case PRODUCT_REVIEW_LIST_SUCCESS:
            return { 
                loading: false,
                reviews: action.payload.reviews,
                page: action.payload.page,
                pages: action.payload.pages,
            }

        case PRODUCT_REVIEW_LIST_FAIL:
            return { 
                loading: false, 
                error: action.payload 
            }
        default:
            return state
    }
}

export const productReviewDeleteReducer = (state = {}, action) => {
    switch (action.type) {
        case PRODUCT_REVIEW_DELETE_REQUEST:
            return { 
                loading: true 
            }
            
        case PRODUCT_REVIEW_DELETE_SUCCESS:
            return { 
                loading: false,
                success: true 
            }

        case PRODUCT_REVIEW_DELETE_FAIL:
            return { 
                loading: false, 
                error: action.payload 
            }

        case PRODUCT_REVIEW_DELETE_RESET:
            return {}

        default:
            return state
    }
}

export const productReviewUpdateReducer = (state = {}, action) => {
    switch (action.type) {
        case PRODUCT_REVIEW_UPDATE_REQUEST:
            return { 
                loading: true 
            }
            
        case PRODUCT_REVIEW_UPDATE_SUCCESS:
            return { 
                loading: false,
                success: true,
                review: action.payload 
            }

        case PRODUCT_REVIEW_UPDATE_FAIL:
            return { 
                loading: false, 
                error: action.payload 
            }

        case PRODUCT_REVIEW_UPDATE_RESET:
            return {}

        default:
            return state
    }
}