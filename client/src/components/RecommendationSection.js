import { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Rating from './Rating';
import api from '../utils/axiosConfig';

export default function RecommendationSection() {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    // 로그인 상태 확인
    const userLogin = useSelector(state => state.userLogin);
    const { userInfo } = userLogin;

    // 한 번에 보여줄 상품 개수
    const itemsPerPage = 4;
    
    // 총 페이지 수 계산
    const totalPages = Math.ceil(recommendations.length / itemsPerPage);
    
    // 현재 페이지에서 보여줄 상품들
    const currentItems = recommendations.slice(
        currentIndex * itemsPerPage,
        (currentIndex + 1) * itemsPerPage
    );

    useEffect(() => {
        if (userInfo) {
            fetchRecommendations();
        }
    }, [userInfo]);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/api/recommendations/', { timeout: 60000 });
            setRecommendations(response.data.recommendations || []);
        } catch (err) {
            console.error('추천 API 에러:', err);
            if (err.code === 'ECONNABORTED') {
            setError('AI 추천을 생성하는 중입니다. 잠시만 기다려주세요...');
            } else {
            setError(err.response?.data?.error || '추천을 불러오는 중 오류가 발생했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    // 이전 페이지로 이동
    const goToPrevious = () => {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : totalPages - 1));
    };

    // 다음 페이지로 이동
    const goToNext = () => {
        setCurrentIndex(prev => (prev < totalPages - 1 ? prev + 1 : 0));
    };

    // 로그인하지 않은 사용자에게는 표시하지 않음
    if (!userInfo) {
        return null;
    }

    return (
        <div className="recommendation-section mb-5">
            {/* 헤더 */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">
                    <span style={{ fontWeight: 'bold', color: '#007bff' }}>👋{userInfo.name}</span>님을 위한 맞춤 추천
                </h2>
                
                {/* 네비게이션 버튼 (추천이 4개 이상일 때만 표시) */}
                {!loading && !error && recommendations.length > itemsPerPage && (
                    <div className="d-flex align-items-center">
                        <span className="text-muted me-3">
                            {currentIndex + 1} / {totalPages}
                        </span>
                        <div className="btn-group">
                            <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={goToPrevious}
                                style={{ borderRadius: '20px 0 0 20px' }}
                            >
                                ‹
                            </Button>
                            <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={goToNext}
                                style={{ borderRadius: '0 20px 20px 0' }}
                            >
                                ›
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {loading && (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                    <p className="mt-3 text-muted" style={{ fontSize: '1.3rem' }}>AI가 맞춤 추천을 생성하고 있습니다...</p>
                </div>
            )}

            {error && (
                <Alert variant="warning" className="text-center">
                    <Alert.Heading style={{ fontSize: '1.5rem' }}>추천을 불러올 수 없습니다</Alert.Heading>
                    <p className="mb-2" style={{ fontSize: '1.1rem' }}>{error}</p>
                    <Button variant="outline-warning" onClick={fetchRecommendations} style={{ fontSize: '1.1rem' }}>
                        다시 시도
                    </Button>
                </Alert>
            )}

            {!loading && !error && recommendations.length === 0 && (
                <Alert variant="info" className="text-center">
                    <Alert.Heading style={{ fontSize: '1.5rem' }}>아직 추천할 상품이 없어요</Alert.Heading>
                    <p style={{ fontSize: '1.1rem' }}>더 많은 상품을 둘러보시면 개인 맞춤 추천을 받을 수 있습니다!</p>
                </Alert>
            )}

            {!loading && !error && recommendations.length > 0 && (
                <div className="position-relative">
                    {/* 왼쪽 화살표 (큰 화면에서만) */}
                    {recommendations.length > itemsPerPage && (
                        <>
                            <Button
                                variant="light"
                                className="position-absolute start-0 top-50 translate-middle-y bg-white shadow-sm border d-none d-lg-flex"
                                style={{ 
                                    zIndex: 10, 
                                    borderRadius: '50%', 
                                    width: '50px', 
                                    height: '50px',
                                    left: '-25px',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                                onClick={goToPrevious}
                            >
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>‹</span>
                            </Button>

                            {/* 오른쪽 화살표 */}
                            <Button
                                variant="light"
                                className="position-absolute end-0 top-50 translate-middle-y bg-white shadow-sm border d-none d-lg-flex"
                                style={{ 
                                    zIndex: 10, 
                                    borderRadius: '50%', 
                                    width: '50px', 
                                    height: '50px',
                                    right: '-25px',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                                onClick={goToNext}
                            >
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>›</span>
                            </Button>
                        </>
                    )}

                    {/* 상품 그리드 */}
                    <Row className="g-3">
                        {currentItems.map((rec, index) => (
                            <Col key={rec.product.id} sm={12} md={6} lg={4} xl={3} className="mb-4">
                                <Card className="h-100 recommendation-card" style={{ border: '2px solid #e3f2fd', position: 'relative' }}>
                                    {/* 추천 배지 */}
                                    <div 
                                        className="position-absolute"
                                        style={{
                                            top: '10px',
                                            right: '10px',
                                            background: 'linear-gradient(45deg, #007bff, #0056b3)',
                                            color: 'white',
                                            padding: '6px 12px',
                                            borderRadius: '12px',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                            zIndex: 1
                                        }}
                                    >
                                        AI 추천
                                    </div>

                                    <Link to={`/product/${rec.product.id}`} className="text-decoration-none">
                                        <Card.Img
                                            variant="top"
                                            src={rec.product.image}
                                            alt={rec.product.name}
                                            style={{ 
                                                height: '200px', 
                                                objectFit: 'cover',
                                                transition: 'transform 0.2s'
                                            }}
                                            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                        />
                                    </Link>
                                    
                                    <Card.Body className="d-flex flex-column">
                                        <Link to={`/product/${rec.product.id}`} className="text-decoration-none">
                                            <Card.Title className="h5 text-dark" style={{ fontSize: '1.2rem' }}>
                                                {rec.product.name}
                                            </Card.Title>
                                        </Link>
                                        
                                        <div className="mb-2">
                                            <Rating
                                                value={rec.product.rating}
                                                text={`${rec.product.num_reviews} reviews`}
                                                color="#f8e825"
                                            />
                                        </div>
                                        
                                        <div className="mb-2">
                                            <span className="text-muted" style={{ fontSize: '1rem' }}>
                                                {rec.product.category} • {rec.product.brand}
                                            </span>
                                        </div>
                                        
                                        <Card.Text className="h4 text-primary mb-2" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            ${rec.product.price.toLocaleString()}
                                        </Card.Text>
                                        
                                        {/* 추천 이유 */}
                                        <Card.Text className="text-muted mb-3 flex-grow-1 fs-5" style={{ lineHeight: '1.6' }}>
                                            <strong className="fs-5">💡 추천 이유:</strong><br />
                                            {rec.reason}
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* 하단 인디케이터 (모바일에서 표시) */}
                    {recommendations.length > itemsPerPage && (
                        <div className="d-flex justify-content-center mt-4 d-lg-none">
                            <div className="d-flex align-items-center">
                                <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={goToPrevious}
                                    className="me-2"
                                >
                                    이전
                                </Button>
                                <span className="mx-3 text-muted">
                                    {currentIndex + 1} / {totalPages}
                                </span>
                                <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={goToNext}
                                    className="ms-2"
                                >
                                    다음
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};