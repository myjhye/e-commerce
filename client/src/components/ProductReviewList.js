import { ListGroup, Alert, Spinner } from 'react-bootstrap'
import Rating from './Rating'

export default function ProductReviewList({ loading, error, reviews }) {
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
          <strong>{review.name}</strong>{' '}
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
            ({new Date(review.createdAt).toLocaleDateString()})
          </span>
          <div>
            <Rating value={review.rating} color="#f8e825" />
          </div>
          <p className="mt-2 mb-0">{review.comment}</p>
        </ListGroup.Item>
      ))}
    </ListGroup>
  )
}
