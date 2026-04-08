import { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import EmailVerify from './pages/auth/EmailVerify'
import ResetPassword from './pages/auth/ResetPassword'
import Dashboard from './pages/Dashboard'
import NewOrder from './pages/orders/NewOrder'
import EditOrder from './pages/orders/EditOrder'
import OrderList from './pages/orders/OrderList'
import OrderDetail from './pages/orders/OrderDetail'
import UserManagement from './pages/admin/UserManagement'
import AdminOrders from './pages/admin/AdminOrders'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AppContext } from './context/AppContext'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, userData, authLoading } = useContext(AppContext)
  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Уншиж байна...</div>
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

const App = () => {
  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/email-verify" element={<EmailVerify />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderList /></ProtectedRoute>} />
        <Route path="/orders/new" element={<ProtectedRoute allowedRoles={['customer']}><NewOrder /></ProtectedRoute>} />
        <Route path="/orders/:id/edit" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><EditOrder /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrders /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default App
