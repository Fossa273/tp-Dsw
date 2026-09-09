import { lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './context/AuthContext';
import './index.scss';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const LocalitiesPage = lazy(() => import('./pages/LocalitiesPage'));
const ProvincesPage = lazy(() => import('./pages/ProvincesPage'));
const VehiclesPage = lazy(() => import('./pages/VehiclesPage'));
const VehicleCategoriesPage = lazy(() => import('./pages/VehicleCategoriesPage'));
const DriversPage = lazy(() => import('./pages/DriversPage'));
const JourneysPage = lazy(() => import('./pages/JourneysPage'));
const TripsPage = lazy(() => import('./pages/TripsPage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));

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
        <ErrorBoundary>
          <Suspense fallback={<div className="loading">Cargando...</div>}>
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
            path="/vehicle-categories"
            element={
              <RequireAdmin>
                <VehicleCategoriesPage />
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
              <RequireAuth>
                <BookingsPage />
              </RequireAuth>
            }
          />
        </Routes>
          </Suspense>
        </ErrorBoundary>
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
