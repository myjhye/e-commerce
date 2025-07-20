import {
    PRODUCT_LIST_REQUEST,
    PRODUCT_LIST_SUCCESS,
    PRODUCT_LIST_FAIL,
    PRODUCT_DETAILS_REQUEST,
    PRODUCT_DETAILS_SUCCESS,
    PRODUCT_DETAILS_FAIL
} from '../constants/productConstants'

// 상품 목록 조회 reducer 정의
export const productListReducer = (state = { products: [] }, action) => {
    switch (action.type) {

        // 상품 목록 요청 시작 (로딩 중 상태로 변경)
        case PRODUCT_LIST_REQUEST:
            return {
                loading: true,
                products: [],
            }

        // 상품 목록 요청 성공 (서버에서 데이터 받아옴)
        case PRODUCT_LIST_SUCCESS:
            return {
                loading: false,
                products: action.payload.results, // 받아온 상품 목록 저장
                page: action.payload.page, // 현재 페이지 번호
                pages: action.payload.pages, // 전체 페이지 수
            }
        
        // 상품 목록 요청 실패 (에러 메시지 저장)
        case PRODUCT_LIST_FAIL:
            return {
                loading: false,
                error: action.payload,
            }

        default:
            return state
    }
}


// 상품 상세 조회 reducer 정의
export const productDetailsReducer = (state = { product: {} }, action) => {
    switch (action.type) {
        case PRODUCT_DETAILS_REQUEST:
            return { 
                loading: true 
            }

        case PRODUCT_DETAILS_SUCCESS:
            return { 
                loading: false, 
                product: action.payload 
            }

        case PRODUCT_DETAILS_FAIL:
            return { 
                loading: false, 
                error: action.payload 
            }

        default:
            return state
    }
}