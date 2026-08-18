import Hero from '../components/Hero';
import FormularioBusqueda from '../components/FormularioBusqueda';
import QuienesSomos from '../components/QuienesSomos';
import CardsDestinos from '../components/CardsDestinos';

const HomePage = ({ onNavigate }) => {
  return (
    <>
      <Hero onNavigate={onNavigate} />
      <FormularioBusqueda />
      <CardsDestinos />
      <QuienesSomos />
    </>
  );
};

export default HomePage;
