import { ListGroup } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

export default function ProfileSidebar() {
    return (
        <ListGroup className="mb-4">
            <LinkContainer to="/profile/buy">
                <ListGroup.Item action>구매 내역</ListGroup.Item>
            </LinkContainer>

            <LinkContainer to="/profile/recent">
                <ListGroup.Item action>최근 조회한 상품</ListGroup.Item>
            </LinkContainer>
        </ListGroup>
    )
}
