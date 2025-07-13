import './App.css';
import { Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import Footer from './components/Footer';
import Header from './components/Header';
import HomeScreen from './screens/HomeScreen'

function App() {
  return (
    <div>
      <Header />
      <main className="py-3">
        <Container>
          <Routes>
            <Route path='/' element={<HomeScreen />} />
            <Route path='/cart' element={<div>Cart Page</div>} />
            <Route path='/login' element={<div>Login Page</div>} />
          </Routes>
        </Container>
      </main>
      <Footer />
    </div>
  );
}

export default App;