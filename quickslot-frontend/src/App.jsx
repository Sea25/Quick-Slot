import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Locations from './pages/Locations'
import SlotMap from './pages/SlotMap'
import BookingConfirm from './pages/BookingConfirm'
import MyBookings from './pages/MyBookings'
import StaffPanel from './pages/StaffPanel'
import BillPage from './pages/BillPage'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* User only routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute role="user"><Dashboard /></ProtectedRoute>
        } />
        <Route path="/locations/:categoryId" element={
          <ProtectedRoute role="user"><Locations /></ProtectedRoute>
        } />
        <Route path="/slots/:locationId" element={
          <ProtectedRoute role="user"><SlotMap /></ProtectedRoute>
        } />
        <Route path="/booking/:reservationId" element={
          <ProtectedRoute role="user"><BookingConfirm /></ProtectedRoute>
        } />
        <Route path="/my-bookings" element={
          <ProtectedRoute role="user"><MyBookings /></ProtectedRoute>
        } />
        <Route path="/bill/:sessionId" element={
          <ProtectedRoute role="user"><BillPage /></ProtectedRoute>
        } />

        {/* Staff only route */}
        <Route path="/staff" element={
          <ProtectedRoute role="staff"><StaffPanel /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}