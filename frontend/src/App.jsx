import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import SearchResults from './pages/SearchResults';
import SlotDetail from './pages/SlotDetail';
import Payment from './pages/Payment';
import MyTickets from './pages/MyTickets';
import AddVehicle from './pages/AddVehicle';
import { useAuth } from './context/AuthContext';
import { setSessionInvalidHandler } from './api/client';

function AppRoutes() {
  const { clearSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setSessionInvalidHandler(() => {
      clearSession();
      navigate('/', { replace: true });
      window.alert('Your session expired. Please sign in again.');
    });
  }, [clearSession, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search/results"
        element={
          <ProtectedRoute>
            <SearchResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicle"
        element={
          <ProtectedRoute>
            <AddVehicle />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lot/:lotId"
        element={
          <ProtectedRoute>
            <SlotDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/:bookingId"
        element={
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <MyTickets />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
