import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './auth/context/AuthContext';
import ProtectedRoute from './auth/components/ProtectedRoute';
import Login from './auth/pages/Login';
import Register from './auth/pages/Register';
import Profile from './auth/pages/Profile';
import Home from './pages/Home';
import Dashboard from './pages/dashboard/Dashboard';
import Chatbot from './pages/chatbot/Chatbot';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer position="top-right" theme="dark" toastClassName="bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-xl shadow-2xl" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;