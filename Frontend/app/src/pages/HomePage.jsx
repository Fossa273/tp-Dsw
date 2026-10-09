import { useState } from 'react';
import Hero from '../components/Hero';
import SearchForm from '../components/SearchForm';
import DestinationCards from '../components/DestinationCards';
import AboutUs from '../components/AboutUs';

const HomePage = ({ onNavigate }) => {
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  return (
    <>
      <Hero onNavigate={onNavigate} />
      <SearchForm
        key={selectedPromotion?.id ?? 'default-search'}
        selectedPromotion={selectedPromotion}
      />
      <DestinationCards onSelectPromotion={setSelectedPromotion} />
      <AboutUs />
    </>
  );
};

export default HomePage;