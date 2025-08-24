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
import ProfileScreen from './screens/ProfileScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import RecentScreen from './screens/RecentScreen';


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

                <Route path='/profile/buy' element={<ProfileScreen />} />
                <Route path='/profile/recent' element={<RecentScreen />} />
                
                <Route path='/product/:id' element={<ProductScreen />} />
                <Route path='/product-create' element={<ProductCreateScreen />} />

                <Route path='/chatbot' element={<ChatbotScreen />} />
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