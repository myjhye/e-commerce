import { Container, Row, Col } from 'react-bootstrap'

export default function Footer() {
    return (
        <footer>
            <Container>
                <Row>
                    <Col className="text-center py-3">Copyright &copy; Ecommerce Web App</Col>
                </Row>
            </Container>
        </footer>
    )
}