import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, Row, Col, Alert, Spinner, Card, Badge } from 'react-bootstrap';

export default function ProductCreateScreen() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [countInStock, setCountInStock] = useState(0);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [errorCreate, setErrorCreate] = useState('');
  
  // LangGraph 상태 관리
  const [langGraphAvailable, setLangGraphAvailable] = useState(false);
  const [checkingLangGraph, setCheckingLangGraph] = useState(true);
  const [useLangGraph, setUseLangGraph] = useState(false);
  const [aiDebugInfo, setAiDebugInfo] = useState(null);

  // LangGraph 상태 확인
  useEffect(() => {
    checkLangGraphStatus();
  }, []);

  const checkLangGraphStatus = async () => {
    try {
      const { data } = await axios.get('/api/ai/check-langgraph-status/');
      setLangGraphAvailable(data.langgraph_available);
      console.log('LangGraph 상태:', data);
    } catch (error) {
      console.error('LangGraph 상태 확인 실패:', error);
      setLangGraphAvailable(false);
    } finally {
      setCheckingLangGraph(false);
    }
  };

  // 상품 등록 API 호출
  const submitHandler = async (e) => {
    e.preventDefault();
    setLoadingCreate(true);

    try {
      const { data } = await axios.post('/api/products/create/', {
        name,
        price,
        image,
        brand,
        category,
        description,
        countInStock
      });

      alert('상품 등록 성공!');
      console.log('등록된 상품:', data);

      // 폼 리셋
      setName('');
      setPrice(0);
      setImage('');
      setBrand('');
      setCategory('');
      setDescription('');
      setCountInStock(0);
      setAiDebugInfo(null);
    } catch (error) {
      console.error('상품 등록 실패:', error);
      setErrorCreate('상품 등록에 실패했습니다.');
    } finally {
      setLoadingCreate(false);
    }
  };

  // 이미지 업로드 API 호출
  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);

    try {
      const { data } = await axios.post('/api/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImage(data.image_name);  // 파일 이름만 저장
    } catch (error) {
      console.error('이미지 업로드 에러:', error.response ? error.response.data : error.message);
    } finally {
      setUploading(false);
    }
  };

  // 업데이트된 AI 자동 생성 함수
  const generateAIInfo = async () => {
    if (!name.trim()) {
      alert('상품명을 먼저 입력해주세요!');
      return;
    }
    if (!image) {
      alert('상품 이미지를 업로드해주세요!');
      return;
    }

    setLoadingAI(true);
    setAiDebugInfo(null);

    try {
      // LangGraph 사용 여부에 따라 엔드포인트 선택
      const endpoint = useLangGraph && langGraphAvailable 
        ? '/api/ai/generate-product-info-langgraph/'
        : '/api/ai/generate-product-info/';
      
      const debugParam = useLangGraph ? '?debug=true' : '';
      
      const { data } = await axios.post(`${endpoint}${debugParam}`, {
        name,
        image_url: `/media/${image}`
      });

      setBrand(data.brand);
      setCategory(data.category);
      setDescription(data.description);
      
      // 디버그 정보 저장 (LangGraph 사용시)
      if (data.debug_info) {
        setAiDebugInfo(data.debug_info);
      }
      
      console.log('AI 생성 결과:', data);
      
    } catch (error) {
      console.error('AI 생성 실패:', error.response ? error.response.data : error.message);
      
      // LangGraph 실패시 기본 API로 폴백
      if (useLangGraph && error.response?.status === 501) {
        alert('LangGraph 처리 실패. 기본 AI로 재시도합니다.');
        setUseLangGraph(false);
        // 재귀 호출로 기본 API 시도
        setTimeout(() => generateAIInfo(), 500);
        return;
      }
      
      alert('AI 생성에 실패했습니다.');
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '10px', paddingBottom: '30px' }}>
      {/* 돌아가기 버튼 */}
      <Link to="/" className="btn btn-light my-3">
        <i className="fas fa-arrow-left"></i> Go Back
      </Link>

      <h1>상품 등록</h1>

      {loadingCreate && (
        <div className="text-center my-3">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {errorCreate && <Alert variant="danger">{errorCreate}</Alert>}

      <Form onSubmit={submitHandler} style={{ paddingTop: '20px' }}>
        {/* 이미지 업로드 */}
        <Card className="mb-4">
          <Card.Header>상품 이미지</Card.Header>
          <Card.Body>
            <Form.Group controlId="formFile">
              <Form.Control
                type="file"
                accept="image/*"
                onChange={uploadFileHandler}
              />
            </Form.Group>

            {uploading && (
              <div className="text-center mt-2">
                <Spinner animation="border" size="sm" />
                <span className="ms-2">Uploading...</span>
              </div>
            )}

            {image && !uploading && (
              <div className="mt-3">
                <p className="mb-2"><strong>Preview:</strong></p>
                <img
                  src={`/media/${image}`}
                  alt="Product preview"
                  className="img-thumbnail"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
              </div>
            )}
          </Card.Body>
        </Card>

        {/* 상품명 */}
        <Card className="mb-4">
          <Card.Header>상품명</Card.Header>
          <Card.Body>
            <Form.Group controlId='name'>
              <Form.Control
                type="text"
                placeholder="예: 애플 에어팟 프로 2세대"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
          </Card.Body>
        </Card>

        {/* AI 자동 생성 버튼 */}
        <Card className="mb-4 border-success">
          <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
            <span>
              <i className="fas fa-robot me-2"></i> AI 자동 생성
            </span>
            
            {/* LangGraph 상태 표시 */}
            {checkingLangGraph ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <div>
                {langGraphAvailable ? (
                  <Badge bg="light" text="dark">
                    <i className="fas fa-check me-1"></i> LangGraph 사용 가능
                  </Badge>
                ) : (
                  <Badge bg="warning">
                    <i className="fas fa-exclamation-triangle me-1"></i> 기본 모드
                  </Badge>
                )}
              </div>
            )}
          </Card.Header>
          
          <Card.Body>
            <p className="text-muted mb-3">
              상품명과 이미지를 기반으로 <br />AI가 브랜드, 카테고리, 상품 설명을 자동 작성해드립니다.
            </p>
            
            {/* LangGraph 옵션 */}
            {langGraphAvailable && (
              <Form.Check
                type="switch"
                id="use-langgraph"
                label="고급 AI 처리 (LangGraph) 사용"
                checked={useLangGraph}
                onChange={(e) => setUseLangGraph(e.target.checked)}
                className="mb-3"
              />
            )}
            
            <Button
              variant="success"
              onClick={generateAIInfo}
              disabled={loadingAI || !name.trim() || !image || checkingLangGraph}
              size="lg"
              className="w-100"
            >
              {loadingAI ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {useLangGraph ? 'LangGraph 분석중...' : 'AI 분석중...'}
                </>
              ) : (
                <>
                  <i className="fas fa-magic me-2"></i> 
                  {useLangGraph ? '고급 AI 설명 생성' : 'AI 설명 생성'}
                </>
              )}
            </Button>
            
            {/* AI 디버그 정보 표시 */}
            {aiDebugInfo && (
              <Alert variant="info" className="mt-3">
                <Alert.Heading className="h6">
                  <i className="fas fa-info-circle me-2"></i>AI 처리 상세정보
                </Alert.Heading>
                
                <div className="small">
                  <strong>신뢰도 점수:</strong>
                  <ul className="mb-2">
                    {Object.entries(aiDebugInfo.confidence_scores).map(([key, value]) => (
                      <li key={key}>{key}: {(value * 100).toFixed(1)}%</li>
                    ))}
                  </ul>
                  
                  <strong>처리 단계:</strong>
                  <ul className="mb-0">
                    {aiDebugInfo.processing_steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                  
                  {aiDebugInfo.errors && aiDebugInfo.errors.length > 0 && (
                    <>
                      <strong className="text-warning">경고:</strong>
                      <ul className="mb-0 text-warning">
                        {aiDebugInfo.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </Alert>
            )}
          </Card.Body>
        </Card>

        {/* 브랜드 & 카테고리 */}
        <Row>
          <Col md={6}>
            <Form.Group controlId='brand' className='my-3'>
              <Form.Label>브랜드</Form.Label>
              <Form.Control
                type="text"
                placeholder="브랜드 입력"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId='category' className='my-3'>
              <Form.Label>카테고리</Form.Label>
              <Form.Control
                type="text"
                placeholder="카테고리 입력"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        {/* 상품 설명 */}
        <Form.Group controlId='description' className='my-3'>
          <Form.Label>상품 설명</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder="상품 설명 입력"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Form.Group>

        {/* 가격 */}
        <Form.Group controlId='price' className='my-3'>
          <Form.Label>가격</Form.Label>
          <Form.Control
            type="number"
            placeholder="예: 359000"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            min="0"
            step="0.01"
            required
          />
        </Form.Group>

        {/* 재고 */}
        <Form.Group controlId='stock' className='my-3'>
          <Form.Label>재고 수</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter stock count"
            value={countInStock}
            onChange={(e) => setCountInStock(Number(e.target.value))}
            min="0"
            required
          />
        </Form.Group>

        {/* 등록 버튼 */}
        <Button
          type="submit"
          variant="primary"
          className="w-100"
          size="lg"
          disabled={loadingCreate || uploading}
        >
          {loadingCreate ? '등록 중...' : '상품 등록'}
        </Button>
      </Form>
    </div>
  );
}