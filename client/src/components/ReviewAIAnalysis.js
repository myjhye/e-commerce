import { useState } from 'react';
import { Card, Row, Col, Badge, Spinner, Alert, Button, ProgressBar } from 'react-bootstrap';
import api from '../utils/axiosConfig'

const ReviewAIAnalysis = ({ productId }) => {
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAnalysis, setShowAnalysis] = useState(false);

    // AI 분석 데이터 가져오기
    const fetchAnalysis = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const { data } = await api.get(`/api/ai/review-analysis/${productId}/`);

            setAnalysisData(data);
            setShowAnalysis(true);
        } catch (err) {
            console.error('❌ AI 분석 오류:', err);
            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                err.message
            );
        } finally {
            setLoading(false);
        }
    };

    // 감정에 따른 색상 가져오기
    const getSentimentColor = (type) => {
        switch (type) {
            case 'positive': return 'success';
            case 'negative': return 'danger';
            case 'neutral': return 'secondary';
            default: return 'primary';
        }
    };

    // 감정에 따른 이모지 가져오기
    const getSentimentEmoji = (type) => {
        switch (type) {
            case 'positive': return '😊';
            case 'negative': return '😞';
            case 'neutral': return '😐';
            default: return '🤔';
        }
    };

    return (
        <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-light">
                <Row className="align-items-center">
                    <Col>
                        <h5 className="mb-0">
                            🤖 AI 리뷰 분석
                            {analysisData && (
                                <Badge bg="info" className="ms-2">
                                    {analysisData.total_reviews}개 리뷰 분석
                                </Badge>
                            )}
                        </h5>
                        <small className="text-muted">Hugging Face 모델을 활용한 감정 분석</small>
                    </Col>
                    <Col xs="auto">
                        {!showAnalysis ? (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={fetchAnalysis}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                            className="me-2"
                                        />
                                        분석중...
                                    </>
                                ) : (
                                    '🚀 AI 분석 시작'
                                )}
                            </Button>
                        ) : (
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setShowAnalysis(false)}
                            >
                                ✕ 닫기
                            </Button>
                        )}
                    </Col>
                </Row>
            </Card.Header>

            {error && (
                <Card.Body>
                    <Alert variant="danger" className="mb-0">
                        <Alert.Heading>분석 실패</Alert.Heading>
                        {error}
                    </Alert>
                </Card.Body>
            )}

            {showAnalysis && analysisData && (
                <Card.Body>
                    <Row>
                        {/* 감정 분석 결과 */}
                        <Col md={6}>
                            <h6 className="mb-3">📊 감정 분석 결과</h6>
                            
                            {/* 긍정 */}
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span>{getSentimentEmoji('positive')} 긍정적</span>
                                    <Badge bg={getSentimentColor('positive')} pill>
                                        {analysisData.sentiment_analysis.positive}%
                                    </Badge>
                                </div>
                                <ProgressBar 
                                    variant={getSentimentColor('positive')} 
                                    now={analysisData.sentiment_analysis.positive} 
                                    style={{ height: '8px' }}
                                />
                            </div>

                            {/* 중립 */}
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span>{getSentimentEmoji('neutral')} 중립적</span>
                                    <Badge bg={getSentimentColor('neutral')} pill>
                                        {analysisData.sentiment_analysis.neutral}%
                                    </Badge>
                                </div>
                                <ProgressBar 
                                    variant={getSentimentColor('neutral')} 
                                    now={analysisData.sentiment_analysis.neutral} 
                                    style={{ height: '8px' }}
                                />
                            </div>

                            {/* 부정 */}
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span>{getSentimentEmoji('negative')} 부정적</span>
                                    <Badge bg={getSentimentColor('negative')} pill>
                                        {analysisData.sentiment_analysis.negative}%
                                    </Badge>
                                </div>
                                <ProgressBar 
                                    variant={getSentimentColor('negative')} 
                                    now={analysisData.sentiment_analysis.negative} 
                                    style={{ height: '8px' }}
                                />
                            </div>

                            {/* 종합 평가 */}
                            <Card className="mt-3" style={{ backgroundColor: '#f8f9fa' }}>
                                <Card.Body className="py-2">
                                    <div className="text-center">
                                        <h6 className="mb-1">종합 평가</h6>
                                        {analysisData.sentiment_analysis.positive > 60 ? (
                                            <Badge bg="success" style={{ fontSize: '0.9rem' }}>
                                                🎉 고객 만족도 높음
                                            </Badge>
                                        ) : analysisData.sentiment_analysis.negative > 30 ? (
                                            <Badge bg="warning" style={{ fontSize: '0.9rem' }}>
                                                ⚠️ 개선 필요
                                            </Badge>
                                        ) : (
                                            <Badge bg="info" style={{ fontSize: '0.9rem' }}>
                                                📊 의견 다양함
                                            </Badge>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* 주요 키워드 */}
                        <Col md={6}>
                            <h6 className="mb-3">🔑 주요 키워드</h6>
                            <div className="mb-4">
                                {analysisData.keywords.slice(0, 10).map(([keyword, count], index) => (
                                    <Badge
                                        key={keyword}
                                        bg={index < 3 ? "primary" : index < 6 ? "secondary" : "light"}
                                        text={index >= 6 ? "dark" : ""}
                                        className="me-2 mb-2 p-2"
                                        style={{ 
                                            fontSize: index < 3 ? '1rem' : '0.9rem',
                                            fontWeight: index < 3 ? 'bold' : 'normal'
                                        }}
                                    >
                                        {keyword} ({count})
                                    </Badge>
                                ))}
                            </div>

                            {/* 키워드 분석 */}
                            <Card style={{ backgroundColor: '#f8f9fa' }}>
                                <Card.Body className="py-2">
                                    <small className="text-muted">
                                        💡 <strong>분석 팁:</strong> 숫자가 클수록 자주 언급된 키워드입니다. 
                                        고객들이 가장 관심있어 하는 부분을 확인해보세요!
                                    </small>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* AI 요약 */}
                    <Row className="mt-4">
                        <Col>
                            <h6 className="mb-3">📝 AI 요약</h6>
                            <Card className="border-0" style={{ backgroundColor: '#fff3cd' }}>
                                <Card.Body>
                                    <div style={{ 
                                        whiteSpace: 'pre-line', 
                                        lineHeight: '1.7',
                                        fontSize: '1.05rem'
                                    }}>
                                        고객들이 가장 많이 언급한 키워드는 <strong style={{ color: '#0066cc', fontSize: '1.1rem' }}>"{analysisData.keywords[0]?.[0] || '품질'}"</strong> 입니다.
                                        <br />
                                        전체 {analysisData.total_reviews}개 리뷰 중 <strong style={{ color: '#28a745', fontSize: '1.1rem' }}>{analysisData.sentiment_analysis.positive}%가 긍정적</strong>인 반응을 보이고 있습니다.
                                        <br />
                                        <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Hugging Face AI 모델이 분석한 종합 의견</span>: {analysisData.sentiment_analysis.positive > 60 ? 
                                            <strong style={{ color: '#28a745' }}>고객 만족도가 높은 우수한 상품</strong> : 
                                            analysisData.sentiment_analysis.negative > 30 ? 
                                            <strong style={{ color: '#ffc107' }}>개선이 필요한 부분이 있는 상품</strong> : 
                                            <strong style={{ color: '#6c757d' }}>고객 의견이 다양한 상품</strong>
                                        }으로 평가됩니다.
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* 기술 정보 */}
                    <Row className="mt-3">
                        <Col>
                            <small className="text-muted">
                                🤗 Powered by Hugging Face Transformers | 
                                한국어 감정분석 모델 사용 |
                                분석된 리뷰: {analysisData.total_reviews}개
                            </small>
                        </Col>
                    </Row>
                </Card.Body>
            )}
        </Card>
    );
};

export default ReviewAIAnalysis;