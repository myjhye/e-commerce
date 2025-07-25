import { createStore, combineReducers, applyMiddleware } from 'redux'
import { thunk } from 'redux-thunk'
import { composeWithDevTools } from 'redux-devtools-extension'

import { productDetailsReducer, productListReducer } from './reducers/productReducers'
import { userLoginReducer } from './reducers/userReducers'

const reducer = combineReducers({
    productList: productListReducer, // 상품 목록 조회
    productDetails: productDetailsReducer, // 상품 상세 조회

    userLogin: userLoginReducer,
})

const userInfoFromStorage = localStorage.getItem('userInfo') 
                                            ? JSON.parse(localStorage.getItem('userInfo')) 
                                            : null

const initialState = {
  userLogin: { 
    userInfo: userInfoFromStorage 
  },
}

const middleware = [thunk]

const store = createStore(
  reducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middleware))
)

export default store