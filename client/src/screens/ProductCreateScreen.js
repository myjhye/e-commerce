import axios from 'axios';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, Row, Col, Alert, Spinner, Card } from 'react-bootstrap';

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
  const [errorCreate, setErrorCreate] = useState('');

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
    } 
    catch (error) {
      console.error('상품 등록 실패:', error);
      setErrorCreate('상품 등록에 실패했습니다.');
    } 
    finally {
      setLoadingCreate(false);
    }
  };

  // 이미지 파일 업로드 API 호출
  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);

    try {
      const { data } = await axios.post('/api/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }  // 중요!
    });
      setImage(data.image_name);
    } 
    catch (error) {
      console.error('이미지 업로드 에러:', error.response ? error.response.data : error.message);
    } 
    finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '10px', paddingBottom: '30px' }}>
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
