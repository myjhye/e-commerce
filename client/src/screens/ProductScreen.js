import { Link, useParams } from 'react-router-dom'
import { Row, Col, Image, ListGroup, Button, Card, Form } from 'react-bootstrap'
import Rating from '../components/Rating'
import { useDispatch, useSelector } from 'react-redux'
import { listProductDetails } from '../actions/productActions';
import { deleteProductReview, listProductReviews } from '../actions/reviewActions'
import { useEffect, useState } from 'react';
import ProductReviewForm from '../components/ProductReviewForm'
import ProductReviewList from '../components/ProductReviewList'
import ReviewAIAnalysis from '../components/ReviewAIAnalysis'
import Paginate from '../components/Paginate'
import api from '../utils/axiosConfig';

export default function ProductScreen() {
    const { id } = useParams();
    const dispatch = useDispatch();

    const productDetails = useSelector((state) => state.productDetails); // 상품 상세 리덕스 상태 가져오기
    const { 
        loading,
        error, 
        product 
    } = productDetails;

    const productReviewList = useSelector((state) => state.productReviewList)
    const { 
        loading: loadingReviews, 
        error: errorReviews, 
        reviews, 
        pages, 
        page 
    } = productReviewList

    const productReviewUpdate = useSelector((state) => state.productReviewUpdate)
    const { 
        loading: loadingUpdate, 
        error: errorUpdate, 
        success: successUpdate 
    } = productReviewUpdate
    

    const productReviewDelete = useSelector((state) => state.productReviewDelete)
    const { 
        loading: loadingDelete, 
        error: errorDelete, 
        success: successDelete 
    } = productReviewDelete

    const [reviewPage, setReviewPage] = useState(1);
    const [editingReview, setEditingReview] = useState(null); // 수정 중인 리뷰

    // 상품 상세 데이터 요청
    useEffect(() => {
        dispatch(listProductDetails(id))
        dispatch(listProductReviews(id, reviewPage))
    }, [dispatch, id, reviewPage]);

    // 상품 조회수 트래킹
    useEffect(() => {
        if (!loading && product?._id) {
            api.post('/api/products/view/', { product_id: id })
                .catch(() => { /* 실패해도 무시 */ })
        }
    }, [id, loading, product?._id]);

    // 삭제/수정 성공 시 리뷰 목록 새로고침
    useEffect(() => {
        if (successDelete || successUpdate) {
            dispatch(listProductReviews(id, reviewPage));
            dispatch(listProductDetails(id)); // 상품 평점 업데이트
            setEditingReview(null); // 편집 모드 해제
        }
    }, [dispatch, id, reviewPage, successDelete, successUpdate]);

    // 리뷰 수정 핸들러
    const handleEditReview = (review) => {
        setEditingReview(review); // ProductReviewForm에 편집 모드로 전환하도록 신호
    }

    // 리뷰 삭제 핸들러
    const handleDeleteReview = (reviewId) => {
        if (window.confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
            dispatch(deleteProductReview(id, reviewId));
        }
    }

    // 리뷰 수정 완료 핸들러
    const handleEditComplete = () => {
        setEditingReview(null);
        // useEffect에서 successUpdate를 감지하여 자동으로 새로고침됨
    }

    const handlePurchase = async () => {
        try {
            await api.post(`/api/products/${id}/purchase/`)
            alert('구매가 완료되었습니다!')
            dispatch(listProductDetails(id)) // 상품 상세 정보 새로고침 (재고 수량 반영)
        } 
        catch (error) {
            alert(error.response?.data?.detail || '구매에 실패했습니다.')
        }
    }

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            {/* [수정] 영문 -> 한글 */}
            <Link to="/" className="btn btn-light my-3">
                뒤로 가기
            </Link>

            <Row>
                <Col md={6}>
                    <Image src={product.image} alt={product.name} fluid />
                </Col>

                <Col md={3}>
                    <ListGroup variant="flush">
                        <ListGroup.Item>
                            <h3>{product.name}</h3>
                        </ListGroup.Item>

                        <ListGroup.Item>
                            <Rating
                                value={product.rating}
                                // [수정] 영문 -> 한글
                                text={`${product.numReviews}개 리뷰`}
                                color="#f8e825"
                            />
                        </ListGroup.Item>

                        <ListGroup.Item>
                            {product.price ? `${new Intl.NumberFormat('ko-KR').format(product.price)}원` : '가격 정보 없음'}
                        </ListGroup.Item>

                        <ListGroup.Item>
                            설명: {product.description}
                        </ListGroup.Item>
                    </ListGroup>
                </Col>

                <Col md={3}>
                    <Card>
                        <ListGroup variant="flush">
                            <ListGroup.Item>
                                <Row>
                                    <Col>가격:</Col>
                                    <Col>
                                        <strong>{product.price ? `${new Intl.NumberFormat('ko-KR').format(product.price)}원` : '가격 정보 없음'}</strong>
                                    </Col>
                                </Row>
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <Row>
                                    {/* [수정] 영문 -> 한글 */}
                                    <Col>재고 상태:</Col>
                                    <Col>
                                        {/* [수정] 영문 -> 한글 */}
                                        {product.countInStock > 0 ? '재고 있음' : '재고 없음'}
                                    </Col>
                                </Row>
                            </ListGroup.Item>

                            {product.countInStock > 0 && (
                                <ListGroup.Item>
                                    <Row>
                                        {/* [수정] 영문 -> 한글 */}
                                        <Col>남은 수량</Col>
                                        <Col className='my-1'>
                                            <span>
                                                <span style={{ fontWeight: 'bold', color: '#d9534f' }}>{product.countInStock}</span>개 남음
                                            </span>
                                        </Col>
                                    </Row>
                                </ListGroup.Item>
                            )}

                            <ListGroup.Item>
                                <Button
                                    className="btn-block w-100"
                                    type="button"
                                    disabled={product.countInStock === 0}
                                >
                                    장바구니에 추가
                                </Button>
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <Button
                                    className="btn-block w-100 btn-primary"
                                    type="button"
                                    disabled={product.countInStock === 0}
                                    onClick={handlePurchase}
                                >
                                    구매하기
                                </Button>
                            </ListGroup.Item>
                        </ListGroup>
                    </Card>
                </Col>
            </Row>
            
            {/* 리뷰 작성/수정 */}
            <Row className="mt-5">
                <Col md={12}>
                    <ListGroup variant="flush">
                        <ListGroup.Item className="p-4">
                            <ProductReviewForm 
                                productId={id} 
                                editingReview={editingReview}
                                onEditComplete={handleEditComplete}
                            />
                        </ListGroup.Item>
                    </ListGroup>
                </Col>
            </Row>

            {/* AI 리뷰 분석 */}
            <Row className="mt-4">
                <Col md={12}>
                    <ReviewAIAnalysis productId={id} />
                </Col>
            </Row>

            {/* 리뷰 목록 */}
            <Row className="md-2">
                <Col md={12}>
                    <ProductReviewList
                        loading={loadingReviews}
                        error={errorReviews}
                        reviews={reviews}
                        onEditReview={handleEditReview}
                        onDeleteReview={handleDeleteReview}
                    />

                    <Paginate 
                        pages={pages} 
                        page={page} 
                        onPageChange={(num) => setReviewPage(num)}   // 페이지 변경 함수
                    />
                </Col>
            </Row>
        </div>
    )
}