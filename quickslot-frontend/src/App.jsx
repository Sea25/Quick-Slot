import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Buildings from './pages/Buildings'
import Locations from './pages/Locations'
import Slots from './pages/Slots'
import SelectVehicle from './pages/SelectVehicle'
import ActiveSession from './pages/ActiveSession'
import ExitPayment from './pages/ExitPayment'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/category/:categoryId/buildings" element={<ProtectedRoute><Buildings /></ProtectedRoute>} />
          <Route path="/building/:buildingId/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
          <Route path="/location/:locationId/slots" element={<ProtectedRoute><Slots /></ProtectedRoute>} />
          <Route path="/slot/:slotId/vehicle" element={<ProtectedRoute><SelectVehicle /></ProtectedRoute>} />
          
          <Route path="/reservation/:reservationId" element={<ProtectedRoute><ActiveSession /></ProtectedRoute>} />
          <Route path="/session/:sessionId/payment" element={<ProtectedRoute><ExitPayment /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
