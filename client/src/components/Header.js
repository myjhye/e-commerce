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
                        <Nav className="ml-auto">
                            <LinkContainer to="/cart">
                                <Nav.Link>
                                <i className="fas fa-shopping-cart"></i> Cart
                                </Nav.Link>
                            </LinkContainer>

                            {currentUser ? (
                                <>
                                    <LinkContainer to="/profile">
                                        <Nav.Link>
                                            <i className="fas fa-user"></i> Profile
                                        </Nav.Link>
                                    </LinkContainer>
                                    <Nav.Link onClick={logoutHandler}>
                                        <i className="fas fa-sign-out-alt"></i> Logout
                                    </Nav.Link>
                                    <Navbar.Text className="text-light ms-3">
                                        안녕하세요, <span className="text-warning">{currentUser.name}</span>님! <i className="fas fa-smile"></i>
                                    </Navbar.Text>
                                </>
                            ) : (
                                <LinkContainer to="/login">
                                    <Nav.Link>
                                        <i className="fas fa-user"></i> Login
                                    </Nav.Link>
                                </LinkContainer>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </header>
    )
}