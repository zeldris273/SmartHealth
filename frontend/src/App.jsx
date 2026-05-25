import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './auth/context/AuthContext';
import ProtectedRoute from './auth/components/ProtectedRoute';
import AuthModal from './auth/components/AuthModal';
import Profile from './auth/pages/Profile';
import Login from './auth/pages/Login';
import Register from './auth/pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/dashboard/Dashboard';
import Chatbot from './pages/chatbot/Chatbot';
import Header from './components/Header';

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

const AppContent = () => {
  const location = useLocation();
  const hideHeader = location.pathname === '/login' || location.pathname === '/register';

  return (
    <AuthProvider>
      <ToastContainer
        position="top-right"
        theme="dark"
        toastClassName="bg-[#1a1a1a]/95 backdrop-blur-xl border border-[#8b2b2b]/30 text-white rounded-xl shadow-2xl"
      />
      <AuthModal />
      {!hideHeader && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
};

export default App;