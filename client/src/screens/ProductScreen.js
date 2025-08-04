import { Link, useParams } from 'react-router-dom'
import { Row, Col, Image, ListGroup, Button, Card, Form } from 'react-bootstrap'
import Rating from '../components/Rating'
import { useDispatch, useSelector } from 'react-redux'
import { listProductDetails } from '../actions/productActions';
import { listProductReviews } from '../actions/reviewActions'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductReviewForm from '../components/ProductReviewForm'
import ProductReviewList from '../components/ProductReviewList'
import ReviewAIAnalysis from '../components/ReviewAIAnalysis'
import Paginate from '../components/Paginate'

export default function ProductScreen() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

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

    const [qty, setQty] = useState(1);
    const [reviewPage, setReviewPage] = useState(1);

    // 상품 상세 데이터 요청
    useEffect(() => {
        dispatch(listProductDetails(id))
        dispatch(listProductReviews(id, reviewPage))
    }, [dispatch, id, reviewPage]);

    const addToCartHandler = () => {
        navigate(`/cart/${id}?qty=${qty}`);
    }

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <Link to="/" className="btn btn-light my-3">
                Go Back
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
                                text={`${product.numReviews} reviews`}
                                color="#f8e825"
                            />
                        </ListGroup.Item>

                        <ListGroup.Item>
                            ${product.price}
                        </ListGroup.Item>

                        <ListGroup.Item>
                            {product.description}
                        </ListGroup.Item>
                    </ListGroup>
                </Col>

                <Col md={3}>
                    <Card>
                        <ListGroup variant="flush">
                            <ListGroup.Item>
                                <Row>
                                    <Col>Price:</Col>
                                    <Col>
                                        <strong>${product.price}</strong>
                                    </Col>
                                </Row>
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <Row>
                                    <Col>Status:</Col>
                                    <Col>
                                        {product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}
                                    </Col>
                                </Row>
                            </ListGroup.Item>

                            {product.countInStock > 0 && (
                                <ListGroup.Item>
                                    <Row>
                                        <Col>Qty</Col>
                                        <Col xs='auto' className='my-1'>
                                            <Form.Control
                                                as="select"
                                                value={qty}
                                                onChange={(e) => setQty(e.target.value)}
                                            >
                                                {

                                                    [...Array(product.countInStock).keys()].map((x) => (
                                                        <option key={x + 1} value={x + 1}>
                                                            {x + 1}
                                                        </option>
                                                    ))
                                                }

                                            </Form.Control>
                                        </Col>
                                    </Row>
                                </ListGroup.Item>
                            )}

                            <ListGroup.Item>
                                <Button
                                    className="btn-block w-100"
                                    type="button"
                                    disabled={product.countInStock === 0}
                                    onClick={addToCartHandler}
                                >
                                    Add to Cart
                                </Button>
                            </ListGroup.Item>
                        </ListGroup>
                    </Card>
                </Col>
            </Row>
            
            {/* 리뷰 작성 */}
            <Row className="mt-5">
                <Col md={12}>
                    <ListGroup variant="flush">
                        <ListGroup.Item className="p-4">
                            <ProductReviewForm productId={id} />
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