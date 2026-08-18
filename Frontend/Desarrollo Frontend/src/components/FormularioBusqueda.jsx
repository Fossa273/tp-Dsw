import { useState } from 'react';

const FormularioBusqueda = ({ onSearch }) => {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [fecha, setFecha] = useState('');
  const [pasajeros, setPasajeros] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ origen, destino, fecha, pasajeros });
    }
  };

  return (
    <section className="busqueda">
      <h2>Busca tu viaje</h2>
      <form className="busqueda-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="origen">Origen</label>
          <select
            id="origen"
            value={origen}
            onChange={(e) => setOrigen(e.target.value)}
          >
            <option value="">Seleccionar origen</option>
            <option value="CABA">CABA</option>
            <option value="La Plata">La Plata</option>
            <option value="Mar del Plata">Mar del Plata</option>
            <option value="Rosario">Rosario</option>
            <option value="Cordoba">Cordoba</option>
            <option value="Mendoza">Mendoza</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="destino">Destino</label>
          <select
            id="destino"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
          >
            <option value="">Seleccionar destino</option>
            <option value="CABA">CABA</option>
            <option value="La Plata">La Plata</option>
            <option value="Mar del Plata">Mar del Plata</option>
            <option value="Rosario">Rosario</option>
            <option value="Cordoba">Cordoba</option>
            <option value="Mendoza">Mendoza</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="fecha">Fecha</label>
          <input
            type="date"
            id="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pasajeros">Pasajeros</label>
          <input
            type="number"
            id="pasajeros"
            min="1"
            max="60"
            value={pasajeros}
            onChange={(e) => setPasajeros(Number(e.target.value))}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-buscar">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Buscar
        </button>
      </form>
    </section>
  );
};

export default FormularioBusqueda;
