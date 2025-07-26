import { useState, useEffect } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../actions/userActions';

export default function RegisterScreen() {
   const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const userRegister = useSelector(state => state.userRegister);
    const { loading, error, userInfo } = userRegister;

    const userLogin = useSelector(state => state.userLogin);
    const { userInfo: userLoginInfo } = userLogin;

    useEffect(() => {
        // 이미 로그인된 사용자는 홈으로 리다이렉트
        if (userInfo || userLoginInfo) {
            navigate('/');
        }
    }, [navigate, userInfo, userLoginInfo]);
    

   const submitHandler = (e) => {
       e.preventDefault();

       // 비밀번호 확인 검증
        if (password !== confirmPassword) {
            setMessage('비밀번호가 일치하지 않습니다.');
        } else {
            setMessage('');
            dispatch(register(name, email, password));
        }
   };

   return (
       <div style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '40px' }}>
           <h1>회원가입</h1>

            {message && (
                <div className="alert alert-danger" role="alert">
                    {message}
                </div>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

           <Form onSubmit={submitHandler}>
               <Form.Group controlId='name' className='my-3'>
                   <Form.Label>Name</Form.Label>
                   <Form.Control
                       type='text'
                       placeholder='Enter name'
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       required
                   />
               </Form.Group>

               <Form.Group controlId='email' className='my-3'>
                   <Form.Label>Email Address</Form.Label>
                   <Form.Control
                       type='email'
                       placeholder='Enter email'
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       required
                   />
               </Form.Group>

               <Form.Group controlId='password' className='my-3'>
                   <Form.Label>Password</Form.Label>
                   <Form.Control
                       type='password'
                       placeholder='Enter password'
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       required
                   />
               </Form.Group>

               <Form.Group controlId='confirmPassword' className='my-3'>
                   <Form.Label>Confirm Password</Form.Label>
                   <Form.Control
                       type='password'
                       placeholder='Confirm password'
                       value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)}
                       required
                   />
               </Form.Group>

               <Button 
                   type='submit' 
                   variant='primary' 
                   className='w-100'
                   disabled={loading}
               >
                   {loading ? 'Creating Account...' : 'Register'}
               </Button>
           </Form>

           <Row className='py-3'>
               <Col className='text-center'>
                   이미 계정이 있으신가요? <Link to='/login'>로그인</Link>
               </Col>
           </Row>
       </div>
   );
}