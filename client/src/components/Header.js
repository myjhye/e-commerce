import { Navbar, Nav, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../actions/userActions';

export default function Header() {

    const dispatch = useDispatch();

    const userLogin = useSelector(state => state.userLogin);
    const userRegister = useSelector(state => state.userRegister);

    // 로그인 또는 회원가입에서 사용자 정보 가져오기
    const { userInfo } = userLogin;
    const { userInfo: registerUserInfo } = userRegister;

    // 둘 중 하나라도 있으면 로그인된 상태로 처리
    const currentUser = userInfo || registerUserInfo;

    const logoutHandler = () => {
        dispatch(logout());
    };

    return (
        <header>
           <Navbar bg="dark" variant="dark" expand="lg" collapseOnSelect>
                <Container>
                    <LinkContainer to="/">
                        <Navbar.Brand>Pro Shop</Navbar.Brand>
                    </LinkContainer>

                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        {/* 로그인 상태에서만 메뉴 보이기 */}
                        {currentUser ? (
                            <>
                                <Nav className="me-auto">
                                    <LinkContainer to="/product-create">
                                        <Nav.Link>
                                            <i className="fas fa-plus-circle"></i> Add Product
                                        </Nav.Link>
                                    </LinkContainer>

                                    <LinkContainer to="/chatbot">
                                        <Nav.Link>
                                            <i className="fas fa-robot"></i> Chatbot
                                        </Nav.Link>
                                    </LinkContainer>
                                </Nav>

                                <Nav className="ms-auto d-flex align-items-center">
                                    <Navbar.Text className="text-light me-3 mb-0">
                                        안녕하세요, <span className="text-warning fw-bold">{currentUser.name}</span>님! <i className="fas fa-smile"></i>
                                    </Navbar.Text>
                                    <LinkContainer to="/profile/buy">
                                        <Nav.Link className="me-2">
                                            <i className="fas fa-user"></i> Profile
                                        </Nav.Link>
                                    </LinkContainer>
                                    <Nav.Link onClick={logoutHandler} className="text-danger">
                                        <i className="fas fa-sign-out-alt"></i> Logout
                                    </Nav.Link>
                                </Nav>
                            </>
                        ) : (
                            /* 로그인 안 된 상태 → Login만 보임 */
                            <Nav className="ms-auto">
                                <LinkContainer to="/login">
                                    <Nav.Link>
                                        <i className="fas fa-user"></i> Login
                                    </Nav.Link>
                                </LinkContainer>
                            </Nav>
                        )}
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </header>
    )
}
