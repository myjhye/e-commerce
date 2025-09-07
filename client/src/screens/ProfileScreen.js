import { useEffect, useState } from 'react'
import { Card, Image, Container, Row, Col } from 'react-bootstrap'
import moment from 'moment'
import ProfileSidebar from '../components/ProfileSidebar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../utils/axiosConfig'

export default function ProfileScreen() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await api.get('/api/products/orders/')
                setOrders(data)
                setLoading(false)
            } catch (err) {
                setError('구매 내역을 불러오는 데 실패했습니다.')
                setLoading(false)
            }
        }

        fetchOrders()
    }, [])

    // 카테고리별 상품 개수
    const categoryData = (() => {
        const categoryMap = {}
        orders.forEach(order => {
            order.items.forEach(item => {
                const cat = item.category || '기타'
                if (!categoryMap[cat]) {
                    categoryMap[cat] = 0
                }
                categoryMap[cat] += 1
            })
        })
        return Object.keys(categoryMap).map(cat => ({
            category: cat,
            count: categoryMap[cat],
        }))
    })()

    // 가격대별 상품 개수
    const priceData = (() => {
        const bins = [
            { range: '0~100', min: 0, max: 100 },
            { range: '101~500', min: 101, max: 500 },
            { range: '501~1000', min: 501, max: 1000 },
            { range: '1001+', min: 1001, max: Infinity },
        ]
        const result = bins.map(b => ({ range: b.range, count: 0 }))
        orders.forEach(order => {
            order.items.forEach(item => {
                const price = item.price
                for (let i = 0; i < bins.length; i++) {
                    if (price >= bins[i].min && price <= bins[i].max) {
                        result[i].count += 1
                        break
                    }
                }
            })
        })
        return result
    })()

    return (
        <Container className="py-4">
            <Row>
                <Col md={3}>
                    <ProfileSidebar />
                </Col>
                <Col md={9}>
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
                            <Row className="mb-4">
                                <Col md={6}>
                                    <Card className="shadow-sm">
                                        <Card.Body>
                                            <h4 className="mb-3">카테고리별 구매 상품 수</h4>
                                            <div style={{ width: '100%', height: 300 }}>
                                                <ResponsiveContainer>
                                                    <BarChart data={categoryData}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="category" />
                                                        <YAxis />
                                                        <Tooltip formatter={(v) => `${v}개`} />
                                                        <Bar dataKey="count" fill="#8884d8" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>

                                <Col md={6}>
                                    <Card className="shadow-sm">
                                        <Card.Body>
                                            <h4 className="mb-3">가격대별 구매 상품 수</h4>
                                            <div style={{ width: '100%', height: 300 }}>
                                                <ResponsiveContainer>
                                                    <BarChart data={priceData}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="range" />
                                                        <YAxis />
                                                        <Tooltip formatter={(v) => `${v}개`} />
                                                        <Bar dataKey="count" fill="#82ca9d" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                            {orders.map((order) => (

                                <Card key={order.orderId} className="mb-4 shadow-sm">


                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <div>
                                                <h5 className="mb-1">{moment(order.createdAt).format('YYYY.MM.DD')}</h5>
                                            </div>
                                            <h5 className="mb-0">{order.isPaid ? '결제 완료' : '미결제'}</h5>
                                        </div>

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
                </Col>
            </Row>
        </Container>
    )
}