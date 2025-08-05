import { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, Image, Container } from 'react-bootstrap'
import moment from 'moment'

export default function ProfileScreen() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await axios.get('/api/orders/')
                setOrders(data)
                setLoading(false)
            } catch (err) {
                setError('구매 내역을 불러오는 데 실패했습니다.')
                setLoading(false)
            }
        }

        fetchOrders()
    }, [])

    return (
        <Container className="py-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h2 className="mb-0">구매 내역 ({orders.length}건)</h2>
            </div>
            
            {orders.length === 0 ? (
                <Card className="text-center py-5">
                    <Card.Body>
                        <div className="text-muted mb-3">
                            <i className="fas fa-shopping-cart fa-3x"></i>
                        </div>
                        <h5 className="text-muted">구매한 상품이 없습니다</h5>
                        <p className="text-muted mb-0">첫 구매를 시작해보세요!</p>
                    </Card.Body>
                </Card>
            ) : (
                <div className="order-list">
                    {orders.map((order) => (
                        <Card key={order.orderId} className="mb-4 shadow-sm">
                            <Card.Body>
                                {/* 주문 헤더 */}
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <div>
                                        <h5 className="mb-1">{moment(order.createdAt).format('YYYY.MM.DD')}</h5>
                                    </div>
                                    {order.isPaid ? (
                                        <h5 className="mb-0">결제 완료</h5>
                                    ) : (
                                        <h5 className="mb-0">미결제</h5>
                                    )}
                                </div>

                                {/* 상품 목록 */}
                                {order.items.map((item, index) => (
                                    <div key={index} className="d-flex align-items-center py-3 border-bottom">
                                        <Image 
                                            src={item.image} 
                                            alt={item.name} 
                                            rounded 
                                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                            className="me-3"
                                        />
                                        <div className="flex-grow-1">
                                            <div className="fs-5 mb-1">{item.name}</div>
                                        </div>
                                        <div className="fs-5 fw-bold">₩{item.price.toLocaleString()}</div>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )}
        </Container>
    )
}