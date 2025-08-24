import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useLocation } from "react-router-dom";
import { Row, Col, Card, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

import Rating from "../components/Rating";
import Paginate from "../components/Paginate";
import RecommendationSection from "../components/RecommendationSection";
import { listProducts } from "../actions/productActions";

export default function HomeScreen() {
  const dispatch = useDispatch();

  const { 
    loading, 
    error, 
    products = [], 
    pages = 1 
  } = useSelector((state) => state.productList);

  // 로그인 상태 확인 (추천 섹션 표시용)
  const userLogin = useSelector(state => state.userLogin);
  const { userInfo } = userLogin;

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(listProducts({ page: currentPage }));
  }, [dispatch, currentPage]);

  const handlePageChange = (p) => {
    setCurrentPage(p);
    window.scrollTo(0, 0);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container>
      {/* 개인 맞춤 추천 섹션 (로그인 시에만 표시) */}
      {userInfo && <RecommendationSection />}
      
      {/* 구분선 */}
      {userInfo && <hr className="my-5" style={{ border: '2px solid #dee2e6' }} />}
      
      {/* 전체 상품 목록 섹션 */}
      <div>
        <h1>전체 상품</h1>
        <Row>
          {products.map((product) => (
            <Col key={product._id} sm={12} md={6} lg={4} xl={3}>
              <Card className="my-3 p-3 rounded">
                <Link to={`/product/${product._id}`}>
                  <Card.Img src={product.image} variant="top" />
                </Link>
                <Card.Body>
                  <Link to={`/product/${product._id}`}>
                    <Card.Title as="div">
                      <strong>{product.name}</strong>
                    </Card.Title>
                  </Link>
                  <Card.Text as="div">
                    <Rating
                      value={product.rating}
                      text={`${product.numReviews} reviews`}
                      color="#f8e825"
                    />
                  </Card.Text>
                  <Card.Text as="h3">${product.price}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        
        {/* 페이지네이션 */}
        <Paginate
          page={currentPage}
          pages={pages}
          onPageChange={handlePageChange}
        />
      </div>
    </Container>
  );
}