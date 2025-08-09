import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useLocation } from "react-router-dom";
import { Row, Col, Card } from "react-bootstrap";
import { Link } from "react-router-dom";

import Rating from "../components/Rating";
import Paginate from "../components/Paginate";
import { listProducts } from "../actions/productActions";

export default function HomeScreen() {
  const dispatch = useDispatch();

  const { 
    loading, 
    error, 
    products = [], 
    pages = 1 
  } = useSelector((state) => state.productList);

  const [currentPage, setCurrentPage] = useState(1); // URL 대신 로컬 상태로 페이지 관리

  // 컴포넌트가 처음 렌더링될 때 상품 목록 요청
  useEffect(() => {
    dispatch(listProducts({ page: currentPage }));
  }, [dispatch, currentPage]);


  const handlePageChange = (p) => {
    setCurrentPage(p); // URL 안 바뀜
    window.scrollTo(0, 0); // 페이지 이동 시 상단으로
  };


  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Latest Products</h1>
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
        page={currentPage}     // ✅ 로컬 상태로 활성 페이지 표시
        pages={pages}          // 서버에서 받은 총 페이지 수
        onPageChange={handlePageChange}
      />
    </div>
  );
}