const Client = ({ id, firstName, lastName, phone, active }) => {
  return (
    <div>
      <h1>Cliente</h1>
      <h2>Información del cliente: </h2>
      <h2>ID: {id}</h2>
      <h2>Nombre: {firstName}</h2>
      <h2>Apellido: {lastName}</h2>
      <h2> Teléfono: {phone} </h2>
      <h2> Estado: {active ? 'Activo' : 'Inactivo'} </h2>
    </div>
  );
};

export default Client;