import { Route } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import ProtectedRoute from '../components/ProtectedRoute';

export const authRoutes = [
  <Route key="login" path="/login" element={<Login />} />,
  <Route key="register" path="/register" element={<Register />} />,
  <Route 
    key="profile" 
    path="/profile" 
    element={
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    } 
  />
];
