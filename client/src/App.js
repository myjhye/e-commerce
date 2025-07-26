import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import Footer from './components/Footer';
import Header from './components/Header';
import HomeScreen from './screens/HomeScreen'
import ProductScreen from './screens/ProductScreen';
import LoginScreen from './screens/LoginScreen';

import { Provider } from 'react-redux'
import store from './store'
import './utils/axiosConfig' // axios interceptor 설정

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
                <Route path='/product/:id' element={<ProductScreen />} />
                <Route path='/login' element={<LoginScreen />} />
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