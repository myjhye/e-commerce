import {
    PRODUCT_REVIEW_LIST_REQUEST,
    PRODUCT_REVIEW_LIST_SUCCESS,
    PRODUCT_REVIEW_LIST_FAIL
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