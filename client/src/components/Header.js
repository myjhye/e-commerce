import { Navbar, Nav, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../actions/userActions';

export default function Header() {
    
    const dispatch = useDispatch();
    
    const userLogin = useSelector(state => state.userLogin);
    const { userInfo } = userLogin;

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

                            {userInfo ? (
                                <>
                                    <LinkContainer to="/profile">
                                        <Nav.Link>
                                            <i className="fas fa-user"></i> Profile
                                        </Nav.Link>
                                    </LinkContainer>
                                    <Nav.Link onClick={logoutHandler}>
                                        <i className="fas fa-sign-out-alt"></i> Logout
                                    </Nav.Link>
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