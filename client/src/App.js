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
      {/* 2. Tailwind flexbox로 sticky footer 레이아웃 구현 */}
      <div className="flex flex-col min-h-screen">
        <Router>
          <Header />
          {/* 3. main 태그가 남은 공간을 모두 차지하도록 flex-grow 적용 */}
          <main className="flex-grow">
            {/* 4. react-bootstrap의 Container를 Tailwind 방식으로 교체 */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            </div>
          </main>
          <Footer />
        </Router>
      </div>
    </Provider>
  );
}

export default App;