import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ClientesPage from './pages/ClientesPage';
import LocalidadesPage from './pages/LocalidadesPage';
import ProvinciasPage from './pages/ProvinciasPage';
import VehiculosPage from './pages/VehiculosPage';
import LoginPage from './pages/LoginPage';
import PerfilPage from './pages/PerfilPage';
import { useAuth } from './context/AuthContext';
import './index.scss';

// Exige una sesion iniciada
const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Solo deja pasar al administrador (cliente con id 0)
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
      // Redirige al home y baja hasta el panel de administracion
      navigate('/');
      setTimeout(() => {
        document
          .getElementById('panel-admin')
          ?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
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
            path="/perfil"
            element={
              <RequireAuth>
                <PerfilPage />
              </RequireAuth>
            }
          />
          <Route
            path="/clientes"
            element={
              <RequireAdmin>
                <ClientesPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/localidades"
            element={
              <RequireAdmin>
                <LocalidadesPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/provincias"
            element={
              <RequireAdmin>
                <ProvinciasPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/vehiculos"
            element={
              <RequireAdmin>
                <VehiculosPage />
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
