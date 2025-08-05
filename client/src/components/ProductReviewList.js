import { ListGroup, Alert, Spinner, Button, ButtonGroup } from 'react-bootstrap'
import Rating from './Rating'
import { useSelector } from 'react-redux'

export default function ProductReviewList({ 
  loading, 
  error, 
  reviews, 
  onEditReview, 
  onDeleteReview 
}) {

  // 현재 로그인한 사용자 정보 가져오기
  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  if (loading) return <Spinner animation="border" />
  if (error) return <Alert variant="danger">{error}</Alert>

  // reviews가 pagination 객체일 경우 results 꺼내서 사용
  const reviewArray = Array.isArray(reviews) ? reviews : reviews?.results || []

  if (reviewArray.length === 0) {
    return <Alert variant="info">아직 작성된 리뷰가 없습니다.</Alert>
  }

  return (
    <ListGroup variant="flush" className="mt-4">
      {reviewArray.map((review) => (
        <ListGroup.Item key={review._id}>
          <div className="d-flex justify-content-between align-items-start">
            <div className="flex-grow-1">
              <div className="d-flex align-items-center mb-2">
                <strong>{review.name}</strong>
                <span className="text-muted ms-2" style={{ fontSize: '0.85rem' }}>
                  ({new Date(review.createdAt).toLocaleDateString()})
                </span>
              </div>
              <div className="mb-2">
                <Rating value={review.rating} color="#f8e825" />
              </div>
              <p className="mb-0">{review.comment}</p>
            </div>

            {/* 작성자만 볼 수 있는 수정/삭제 버튼 */}
            {userInfo && userInfo._id === review.user && (
              <ButtonGroup size="sm" className="ms-3">
                <Button
                  variant="outline-primary"
                  onClick={() => onEditReview && onEditReview(review)}
                  style={{ fontSize: '0.75rem' }}
                >
                  수정
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={() => onDeleteReview && onDeleteReview(review._id)}
                  style={{ fontSize: '0.75rem' }}
                >
                  삭제
                </Button>
              </ButtonGroup>
            )}
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  )
}