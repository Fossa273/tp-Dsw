import Hero from '../components/Hero';
import FormularioBusqueda from '../components/FormularioBusqueda';
import CardsDestinos from '../components/CardsDestinos';
import AdminPanel from '../components/AdminPanel';
import QuienesSomos from '../components/QuienesSomos';

const HomePage = ({ onNavigate }) => {
  return (
    <>
      <Hero onNavigate={onNavigate} />
      <FormularioBusqueda />
      <CardsDestinos />
      <AdminPanel onNavigate={onNavigate} />
      <QuienesSomos />
    </>
  );
};

export default HomePage;
