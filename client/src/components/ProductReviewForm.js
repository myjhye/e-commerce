import { useEffect, useState } from 'react'
import { Form, Button } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { listProductReviews, updateProductReview } from '../actions/reviewActions'
import api from '../utils/axiosConfig'

// 별점 컴포넌트
function StarRating({ rating, onRatingChange, interactive = false }) {
    const [hoverRating, setHoverRating] = useState(0)

    const handleStarClick = (starValue) => {
        if (interactive && onRatingChange) {
            onRatingChange(starValue)
        }
    }

    const handleStarHover = (starValue) => {
        if (interactive) {
            setHoverRating(starValue)
        }
    }

    const handleMouseLeave = () => {
        if (interactive) {
            setHoverRating(0)
        }
    }

    const displayRating = interactive ? (hoverRating || rating) : rating

    return (
        <div className="d-flex align-items-center" onMouseLeave={handleMouseLeave}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`btn btn-link p-0 me-1 ${interactive ? '' : 'pe-none'}`}
                    style={{
                        fontSize: '1.2rem',
                        textDecoration: 'none',
                        color: displayRating >= star ? '#f8e825' : '#dee2e6',
                        transition: 'all 0.2s ease',
                        border: 'none'
                    }}
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleStarHover(star)}
                    disabled={!interactive}
                >
                    ★
                </button>
            ))}
            {interactive && rating > 0 && (
                <small className="text-muted ms-2">
                    {rating === 1 && '별로예요'}
                    {rating === 2 && '아쉬워요'}
                    {rating === 3 && '보통이에요'}
                    {rating === 4 && '좋아요'}
                    {rating === 5 && '최고예요!'}
                </small>
            )}
        </div>
    )
}

export default function ProductReviewForm({ 
    productId, 
    editingReview = null,  // 수정할 리뷰 데이터
    onEditComplete = null  // 수정 완료 콜백
}) {
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isEditing, setIsEditing] = useState(false)

    const userLogin = useSelector((state) => state.userLogin)
    const { userInfo } = userLogin

    const dispatch = useDispatch()

    // 수정 모드일 때 폼에 기존 데이터 채우기
    useEffect(() => {
        if (editingReview) {
            setRating(editingReview.rating)
            setComment(editingReview.comment)
            setIsEditing(true)
        } 
        else {
            setRating(0)
            setComment('')
            setIsEditing(false)
        }
    }, [editingReview])

    const resetForm = () => {
        setRating(0)
        setComment('')
        setIsEditing(false)
        if (onEditComplete) {
            onEditComplete()
        }
    }

    const submitHandler = async (e) => {
        e.preventDefault()

        if (rating === 0) {
            alert('별점을 선택해주세요.')
            return
        }

        if (comment.trim().length < 10) {
            alert('리뷰는 최소 10자 이상 작성해주세요.')
            return
        }

        try {

            // 수정 모드
            if (isEditing && editingReview) {
                dispatch(updateProductReview(productId, editingReview._id, { rating, comment }))
                alert('리뷰가 수정되었습니다.')
                resetForm()
            }
            
            // 등록 모드
            else {
                const { data } = await api.post(
                    `/api/reviews/${productId}/create/`,
                    { rating, comment }
                )

                alert(data.detail) // 서버에서 내려주는 메시지 ("리뷰가 등록되었습니다.")
                console.log('리뷰 등록 성공:', data)

                // 폼 초기화
                setRating(0)
                setComment('')

                // 리뷰 등록 성공 후 목록 다시 불러오기 (첫 페이지 기준)
                dispatch(listProductReviews(productId, 1))
            }
        } 
        
        catch (error) {
            console.error('리뷰 등록 실패:', error.response?.data || error.message)
            alert(error.response?.data?.detail || '리뷰 등록 중 오류가 발생했습니다.')
        }
    }

    const cancelEdit = () => {
        resetForm()
    }

    return (
        <div className="mt-4">
            {userInfo ? (
                <Form onSubmit={submitHandler}>
                    {/* 수정 모드 표시 */}
                    {isEditing && (
                        <div className="alert alert-info mb-3">
                            <strong>리뷰 수정 모드</strong> - 기존 리뷰를 수정하고 있습니다.
                        </div>
                    )}

                    {/* 별점 */}
                    <Form.Group controlId="rating" className="mb-3">
                        <Form.Label>별점 평가 <span className="text-danger">*</span></Form.Label>
                        <StarRating
                            rating={rating}
                            onRatingChange={setRating}
                            interactive={true}
                        />
                    </Form.Group>

                    {/* 리뷰 내용 */}
                    <Form.Group controlId="comment" className="mb-3">
                        <Form.Label>리뷰 내용 <span className="text-danger">*</span></Form.Label>

                        {/* textarea + 버튼 flex */}
                        <div className="d-flex gap-2">
                            {/* textarea */}
                            <div className="flex-grow-1">
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="상품을 사용해보신 솔직한 후기를 작성해주세요. (최소 10자 이상)"
                                    maxLength={500}
                                    style={{ resize: 'none' }}
                                />
                            </div>

                            {/* 버튼 */}
                            <div>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={rating === 0}
                                    style={{
                                        minWidth: '100px',
                                        height: '100%',           
                                        paddingTop: '0.75rem',    
                                        paddingBottom: '0.75rem',
                                        lineHeight: '1.5',        
                                    }}
                                >
                                    리뷰 등록
                                </Button>

                                {/* 수정 모드일 때만 취소 버튼 표시 */}
                                {isEditing && (
                                    <Button
                                        type="button"
                                        variant="outline-secondary"
                                        onClick={cancelEdit}
                                        style={{
                                            minWidth: '100px',
                                            height: '100%',           
                                            paddingTop: '0.75rem',    
                                            paddingBottom: '0.75rem',
                                            lineHeight: '1.5',    
                                        }}
                                    >
                                        취소
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Form.Group>
                </Form>
            ) : (
                <div className="text-center py-4">
                    <div className="bg-light rounded p-4">
                        <p className="text-muted mb-3">로그인 후 리뷰를 작성할 수 있습니다.</p>
                        {/* 로그인 페이지로 이동 */}
                        <Link to="/login">
                            <Button variant="primary">
                                로그인하기
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}