import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ClientsPage from './pages/ClientsPage';
import LocalitiesPage from './pages/LocalitiesPage';
import ProvincesPage from './pages/ProvincesPage';
import VehiclesPage from './pages/VehiclesPage';
import DriversPage from './pages/DriversPage';
import JourneysPage from './pages/JourneysPage';
import TripsPage from './pages/TripsPage';
import BookingsPage from './pages/BookingsPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';
import './index.scss';

// Requires an active session
const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Only allows the administrator (client with id 0)
const RequireAdmin = ({ children }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AppContent = () => {
  const navigate = useNavigate();

  const handleNavigate = (page) => {
    if (page === 'home') {
      navigate('/');
    } else if (page === 'admin') {
      navigate('/admin');
    } else {
      navigate(`/${page}`);
    }
  };

  const getCurrentPage = () => {
    const path = window.location.pathname;
    if (path === '/') return 'home';
    return path.replace('/', '');
  };

  return (
    <div className="app">
      <Header currentPage={getCurrentPage()} onNavigate={handleNavigate} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard onNavigate={handleNavigate} />
              </RequireAdmin>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/clients"
            element={
              <RequireAdmin>
                <ClientsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/localities"
            element={
              <RequireAdmin>
                <LocalitiesPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/provinces"
            element={
              <RequireAdmin>
                <ProvincesPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/vehicles"
            element={
              <RequireAdmin>
                <VehiclesPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/drivers"
            element={
              <RequireAdmin>
                <DriversPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/journeys"
            element={
              <RequireAdmin>
                <JourneysPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/trips"
            element={
              <RequireAdmin>
                <TripsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/bookings"
            element={
              <RequireAdmin>
                <BookingsPage />
              </RequireAdmin>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;