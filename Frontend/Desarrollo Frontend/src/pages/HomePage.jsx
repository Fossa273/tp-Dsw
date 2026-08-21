import Hero from '../components/Hero';
import FormularioBusqueda from '../components/FormularioBusqueda';
import CardsDestinos from '../components/CardsDestinos';
import AdminPanel from '../components/AdminPanel';
import QuienesSomos from '../components/QuienesSomos';
import { useAuth } from '../context/AuthContext';

const HomePage = ({ onNavigate }) => {
  const { isAdmin } = useAuth();

  return (
    <>
      <Hero onNavigate={onNavigate} />
      <FormularioBusqueda />
      <CardsDestinos />
      {isAdmin && <AdminPanel onNavigate={onNavigate} />}
      <QuienesSomos />
    </>
  );
};

export default HomePage;
