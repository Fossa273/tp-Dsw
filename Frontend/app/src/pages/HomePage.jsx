import Hero from '../components/Hero';
import SearchForm from '../components/SearchForm';
import DestinationCards from '../components/DestinationCards';
import AboutUs from '../components/AboutUs';

const HomePage = ({ onNavigate }) => {
  return (
    <>
      <Hero onNavigate={onNavigate} />
      <SearchForm />
      <DestinationCards />
      <AboutUs />
    </>
  );
};

export default HomePage;