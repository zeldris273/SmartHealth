import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './auth/context/AuthContext';
import ProtectedRoute from './auth/components/ProtectedRoute';
import AuthModal from './auth/components/AuthModal';
import Profile from './auth/pages/Profile';
import Home from './pages/Home';
import Dashboard from './pages/dashboard/Dashboard';
import Chatbot from './pages/chatbot/Chatbot';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer position="top-right" theme="light" toastClassName="bg-white/80 backdrop-blur-xl border border-slate-200 text-slate-900 rounded-xl shadow-2xl" />
        <AuthModal />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;