import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./auth/context/AuthContext";
import ProtectedRoute from "./auth/components/ProtectedRoute";
import AdminRoute from "./auth/components/AdminRoute";
import AuthModal from "./auth/components/AuthModal";
import Profile from "./auth/pages/Profile";
import Home from "./pages/Home";
import Dashboard from "./pages/dashboard/Dashboard";
import ChatPage from "./pages/ChatPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AccessDenied from "./pages/AccessDenied";
import Header from "./components/Header";
import CSKHChatWidget from "./components/customerservice/CSKHChatWidget";

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

const AppContent = () => {
  return (
    <AuthProvider>
      <ToastContainer
        position="top-right"
        theme="light"
        toastClassName="bg-[#1a1a1a]/95 backdrop-blur-xl border border-[#8b2b2b]/30 text-white rounded-xl shadow-2xl"
      />
      <AuthModal />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/access-denied" element={<AccessDenied />} />
          </Routes>
      <CSKHChatWidget />
    </AuthProvider>
  );
};

export default App;
