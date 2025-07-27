import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import Footer from './components/Footer';
import Header from './components/Header';
import HomeScreen from './screens/HomeScreen'
import ProductScreen from './screens/ProductScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

import { Provider } from 'react-redux'
import store from './store'
import './utils/axiosConfig' // axios interceptor 설정
import ProductCreateScreen from './screens/ProductCreateScreen';


function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <Router>
          <Header />
          <main className="py-3">
            <Container>
              <Routes>
                <Route path='/' element={<HomeScreen />} />
                
                <Route path='/login' element={<LoginScreen />} />
                <Route path='/register' element={<RegisterScreen />} />
                
                <Route path='/product/:id' element={<ProductScreen />} />
                <Route path='/product-create' element={<ProductCreateScreen />} />
              </Routes>
            </Container>
          </main>
          <Footer />
        </Router>
      </div>
    </Provider>
  );
}

export default App;