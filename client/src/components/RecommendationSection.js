import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Rating from './Rating';

export default function RecommendationSection() {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 로그인 상태 확인
    const userLogin = useSelector(state => state.userLogin);
    const { userInfo } = userLogin;

    useEffect(() => {
        // 로그인한 사용자에게만 추천 표시
        if (userInfo) {
            fetchRecommendations();
        }
    }, [userInfo]);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await axios.get('/api/recommendations/');
            setRecommendations(response.data.recommendations || []);
        } catch (err) {
            console.error('추천 API 에러:', err);
            setError(err.response?.data?.error || '추천을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 로그인하지 않은 사용자에게는 표시하지 않음
    if (!userInfo) {
        return null;
    }

    return (
        <div className="recommendation-section mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">
                    <span style={{ fontWeight: 'bold', color: '#007bff' }}>👋{userInfo.name}</span>님을 위한 맞춤 추천
                </h2>
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
                <>
                    <Row>
                        {recommendations.map((rec, index) => (
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
                </>
            )}
        </div>
    );
};