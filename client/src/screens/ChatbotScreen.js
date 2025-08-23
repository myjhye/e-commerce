import { useState, useEffect, useRef } from 'react'
import { Card, Button, Form, Badge, Alert, Spinner } from 'react-bootstrap'
import axios from 'axios'

export default function ChatbotScreen() {
    const [messages, setMessages] = useState([
        { role: "bot", text: "안녕하세요! 무엇을 도와드릴까요? 환불, 배송, 결제 등에 대해 물어보세요.", timestamp: new Date() }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [systemStatus, setSystemStatus] = useState(null)
    const [showSources, setShowSources] = useState({})
    const messagesEndRef = useRef(null)

    // 자동 스크롤
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // 시스템 상태 확인 (컴포넌트 마운트 시)
    useEffect(() => {
        checkSystemStatus()
    }, [])

    const checkSystemStatus = async () => {
        try {
            const { data } = await axios.get("/api/ai/chatbot/status/")
            setSystemStatus(data)
        } catch (err) {
            console.error("시스템 상태 확인 실패:", err)
        }
    }

    const sendMessage = async (e) => {
        e.preventDefault()
        if (!input.trim()) return

        // 사용자 메시지 추가
        const userMessage = { role: "user", text: input, timestamp: new Date() }
        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        setInput("")
        setLoading(true)

        try {
            const { data } = await axios.post("/api/ai/chatbot/", { question: input })

            // 봇 응답 추가 (sources 포함)
            setMessages([...newMessages, { 
                role: "bot", 
                text: data.answer,
                sources: data.sources || [],
                timestamp: new Date()
            }])
        } 
        catch (err) {
            console.error("챗봇 에러:", err)
            setMessages([...newMessages, { 
                role: "bot", 
                text: "⚠️ 죄송합니다. 서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
                error: true,
                timestamp: new Date()
            }])
        } 
        finally {
            setLoading(false)
        }
    }

    // 예시 질문 클릭 핸들러
    const handleExampleQuestion = (question) => {
        setInput(question)
    }

    // 출처 토글
    const toggleSources = (idx) => {
        setShowSources(prev => ({ ...prev, [idx]: !prev[idx] }))
    }

    return (
        <div className="container-fluid p-3">
            {/* 시스템 상태 표시 */}
            {systemStatus && systemStatus.status === "error" && (
                <Alert variant="warning" className="mb-3">
                    ⚠️ 챗봇 시스템이 준비 중입니다. 일부 기능이 제한될 수 있습니다.
                </Alert>
            )}

            <Card className="shadow" style={{ maxHeight: "85vh" }}>
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <div>
                        <h3 className="mb-0">🤖 고객 상담 챗봇 (환불, 배송, 결제 관련 문의)</h3>
                    </div>
                    {systemStatus && (
                        <Badge bg={systemStatus.status === "ok" ? "success" : "warning"} style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}>
                            {systemStatus.status === "ok" ? "정상 작동" : "점검 필요"}
                        </Badge>
                    )}
                </Card.Header>

                <Card.Body style={{ 
                    height: "50vh", 
                    overflowY: "auto",
                    backgroundColor: "#f8f9fa"
                }}>
                    {messages.map((m, idx) => (
                        <div key={idx} className={`mb-3 ${m.role === "user" ? "text-end" : "text-start"}`}>
                            {/* 메시지 레이블 */}
                            <span className="text-muted d-block mb-1" style={{ fontSize: "1.3rem" }}>
                                {m.role === "user" ? "나" : "상담봇"}
                                {m.timestamp && ` · ${new Date(m.timestamp).toLocaleTimeString()}`}
                            </span>
                            
                            {/* 메시지 내용 */}
                            <div
                                className={`d-inline-block px-4 py-3 rounded-3 ${
                                    m.role === "user" 
                                        ? "bg-primary text-white" 
                                        : m.error 
                                            ? "bg-danger text-white"
                                            : "bg-white border shadow-sm"
                                }`}
                                style={{ maxWidth: "75%", fontSize: "1.4rem", lineHeight: "1.6" }}
                            >
                                <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                                
                                {/* 출처 정보 (봇 메시지만) */}
                                {m.sources && m.sources.length > 0 && (
                                    <div className="mt-3 pt-3 border-top">
                                        <span 
                                            className="text-primary" 
                                            style={{ cursor: "pointer", fontSize: "1.3rem" }}
                                            onClick={() => toggleSources(idx)}
                                        >
                                            📚 참고 문서 ({m.sources.length}개) 
                                            {showSources[idx] ? "▼" : "▶"}
                                        </span>
                                        
                                        {showSources[idx] && (
                                            <div className="mt-2">
                                                {m.sources.map((src, i) => (
                                                    <div key={i} className="mb-2">
                                                        <Badge bg="secondary" className="me-1" style={{ fontSize: "1.2rem", padding: "0.4rem 0.8rem" }}>
                                                            {src.source}
                                                        </Badge>
                                                        <span className="text-muted d-block mt-1" style={{ fontSize: "1.2rem" }}>
                                                            {src.content_preview}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {/* 로딩 표시 */}
                    {loading && (
                        <div className="text-start mb-3">
                            <div className="d-inline-block px-4 py-3 bg-white border rounded-3 shadow-sm">
                                <Spinner animation="border" size="sm" className="me-2" />
                                <span className="text-muted" style={{ fontSize: "1.1rem" }}>답변을 작성하고 있습니다...</span>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </Card.Body>

                {/* 예시 질문들 */}
                <Card.Footer className="bg-light">
                    <div className="mb-3">
                        <span className="text-muted" style={{ fontSize: "1.3rem" }}>자주 묻는 질문:</span>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            {[
                                "환불 정책이 어떻게 되나요?",
                                "배송은 얼마나 걸리나요?",
                                "결제 방법은 무엇이 있나요?",
                                "교환은 어떻게 하나요?"
                            ].map((q, i) => (
                                <Badge 
                                    key={i}
                                    bg="outline-primary" 
                                    className="border border-primary text-primary"
                                    style={{ 
                                        cursor: "pointer", 
                                        fontSize: "1.3rem", 
                                        padding: "0.6rem 1rem",
                                        fontWeight: "normal"
                                    }}
                                    onClick={() => handleExampleQuestion(q)}
                                >
                                    {q}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* 입력 폼 */}
                    <Form onSubmit={sendMessage} className="d-flex">
                        <Form.Control
                            type="text"
                            placeholder="질문을 입력하세요... (예: 환불은 어떻게 하나요?)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                            className="me-2"
                            style={{ fontSize: "1.2rem", padding: "0.75rem" }}
                        />
                        <Button 
                            type="submit" 
                            variant="primary"
                            disabled={loading || !input.trim()}
                            style={{ fontSize: "1.2rem", padding: "0.75rem 1.5rem" }}
                        >
                            {loading ? (
                                <>
                                    <Spinner size="sm" className="me-1" />
                                    전송 중
                                </>
                            ) : (
                                "전송"
                            )}
                        </Button>
                    </Form>
                </Card.Footer>
            </Card>
        </div>
    )
}