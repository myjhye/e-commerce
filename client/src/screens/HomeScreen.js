import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useLocation } from "react-router-dom";
import { Row, Col, Card } from "react-bootstrap";
import { Link } from "react-router-dom";

import Rating from "../components/Rating";
import Paginate from "../components/Paginate";
import { listProducts } from "../actions/productActions";

export default function HomeScreen() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Redux 스토어에서 상태 읽어오기
  const productList = useSelector((state) => state.productList)
  const { 
    loading, 
    error, 
    products = [],
    page, // 현재 페이지
    pages, // 총 페이지 수
  } = productList

  // URL에서 검색 파라미터 추출 (개별적으로 처리)
  const currentPage = searchParams.get('page') || '1';
  const searchKeyword = searchParams.get('keyword') || '';

  // 컴포넌트가 처음 렌더링될 때 상품 목록 요청
  useEffect(() => {
    // API 호출 시 개별 파라미터로 전달
    const params = new URLSearchParams();
    if (searchKeyword) params.append('keyword', searchKeyword);
    if (currentPage && currentPage !== '1') params.append('page', currentPage);
    
    const queryString = params.toString();
    console.log('🚀 Dispatching listProducts with:', queryString);
    dispatch(listProducts(queryString));
  }, [dispatch, currentPage, searchKeyword]);

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
        page={page} 
        pages={pages} 
        keyword={searchKeyword} 
      />
    </div>
  );
}