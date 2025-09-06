import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { thunk } from 'redux-thunk';

import { productDetailsReducer, productListReducer } from './reducers/productReducers';
import { userLoginReducer, userRegisterReducer } from './reducers/userReducers';
import {
  productReviewDeleteReducer,
  productReviewListReducer,
  productReviewUpdateReducer,
} from './reducers/reviewReducers';

const reducer = combineReducers({
  productList: productListReducer,
  productDetails: productDetailsReducer,

  productReviewList: productReviewListReducer,
  productReviewDelete: productReviewDeleteReducer,
  productReviewUpdate: productReviewUpdateReducer,

  userLogin: userLoginReducer,
  userRegister: userRegisterReducer,
});

const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

const initialState = {
  userLogin: {
    userInfo: userInfoFromStorage,
  },
};

const middleware = [thunk];

// Redux 5에서는 composeWithDevTools 대신 이렇게 처리
const composeEnhancers =
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducer,
  initialState,
  composeEnhancers(applyMiddleware(...middleware))
);

export default store;
