import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ClientesPage from './pages/ClientesPage';
import LocalidadesPage from './pages/LocalidadesPage';
import ProvinciasPage from './pages/ProvinciasPage';
import VehiculosPage from './pages/VehiculosPage';
import './index.scss';

const AppContent = () => {
  const navigate = useNavigate();

  const handleNavigate = (page) => {
    if (page === 'home') {
      navigate('/');
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
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/localidades" element={<LocalidadesPage />} />
          <Route path="/provincias" element={<ProvinciasPage />} />
          <Route path="/vehiculos" element={<VehiculosPage />} />
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
