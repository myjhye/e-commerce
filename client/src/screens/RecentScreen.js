import { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, Image, Container, Row, Col } from 'react-bootstrap'
import ProfileSidebar from '../components/ProfileSidebar'
import moment from 'moment'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function RecentScreen() {
    const [recentProducts, setRecentProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const { data } = await axios.get('/api/products/recent/')
                setRecentProducts(data)
                setLoading(false)
            } catch (err) {
                setError('최근 본 상품을 불러오는 데 실패했습니다.')
                setLoading(false)
            }
        }

        fetchRecent()
    }, [])

    // 카테고리별 상품 개수
    const categoryData = (() => {
        const categoryMap = {}
        recentProducts.forEach(view => {
            const cat = view.product.category || '기타'
            if (!categoryMap[cat]) {
                categoryMap[cat] = 0
            }
            categoryMap[cat] += 1
        })
        return Object.keys(categoryMap).map(cat => ({
            category: cat,
            count: categoryMap[cat],
        }))
    })()

    // 가격대별 상품 개수 (예: 0~100, 101~500, 501~1000 …)
    const priceData = (() => {
        const bins = [
            { range: '0~100', min: 0, max: 100 },
            { range: '101~500', min: 101, max: 500 },
            { range: '501~1000', min: 501, max: 1000 },
            { range: '1001+', min: 1001, max: Infinity },
        ]
        const result = bins.map(b => ({ range: b.range, count: 0 }))
        recentProducts.forEach(view => {
            const price = view.product.price
            for (let i = 0; i < bins.length; i++) {
                if (price >= bins[i].min && price <= bins[i].max) {
                    result[i].count += 1
                    break
                }
            }
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
                        <h2 className="mb-0">최근 본 상품 ({recentProducts.length}건)</h2>
                    </div>

                    {recentProducts.length === 0 ? (
                        <Card className="text-center py-5">
                            <Card.Body>
                                <div className="text-muted mb-3">
                                    <i className="fas fa-eye fa-3x"></i>
                                </div>
                                <h5 className="text-muted">최근 본 상품이 없습니다</h5>
                                <p className="text-muted mb-0">상품을 둘러보세요!</p>
                            </Card.Body>
                        </Card>
                    ) : (
                        <>
                            {/* 차트 섹션 */}
                            <Row className="mb-4">
                                <Col md={6}>
                                    <Card className="shadow-sm">
                                        <Card.Body>
                                            <h4 className="mb-3">카테고리별 상품 개수</h4>
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
                                            <h4 className="mb-3">가격대별 상품 개수</h4>
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


                            {/* 최근 본 상품 리스트 */}
                            <div className="recent-list">
                                {recentProducts.map((view, index) => (
                                    <Card key={index} className="mb-4 shadow-sm">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="text-muted fs-5">
                                                    마지막 조회: {moment(view.last_viewed).format('YYYY.MM.DD HH:mm')}
                                                </div>
                                                <div className="text-muted fs-5">
                                                    조회수: {view.view_count}
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center py-3 border-top">
                                                <Image
                                                    src={view.product.image}
                                                    alt={view.product.name}
                                                    rounded
                                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                    className="me-3"
                                                />
                                                <div className="flex-grow-1">
                                                    <div className="fs-5 mb-1">{view.product.name}</div>
                                                </div>
                                                <div className="fs-5 fw-bold">₩{view.product.price.toLocaleString()}</div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </Col>
            </Row>
        </Container>
    )
}