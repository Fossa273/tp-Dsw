const API_BASE = 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new Error(
      'No se pudo conectar con el servidor. Verifique que el backend este corriendo en el puerto 3000.'
    );
  }

  // If the server answers with something that is not JSON (for example an
  // HTML error page), show a clear message instead of crashing with
  // "Unexpected token '<'".
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Respuesta no-JSON del servidor:', text.slice(0, 200));
    throw new Error(
      `El servidor respondio con un formato inesperado (HTTP ${response.status}). Verifique que el backend y la base de datos esten funcionando.`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data;
}

export const api = {
  clients: {
    getAll: () => request('/clients'),
    getInactive: () => request('/clients/inactive'),
    getOne: (id) => request(`/clients/${id}`),
    create: (client) =>
      request('/clients', { method: 'POST', body: JSON.stringify(client) }),
    update: (id, client) =>
      request(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(client),
      }),
    delete: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
    reactivate: (id) => request(`/clients/${id}/reactivate`, { method: 'POST' }),
  },

  auth: {
    login: (email, password) =>
      request('/clients/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: (id) =>
      request('/clients/logout', {
        method: 'POST',
        body: JSON.stringify({ id }),
      }),
    resetPassword: (email, password) =>
      request('/clients/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },

  localities: {
    getAll: () => request('/localities'),
    getOne: (id) => request(`/localities/${id}`),
    create: (locality) =>
      request('/localities', {
        method: 'POST',
        body: JSON.stringify(locality),
      }),
    update: (id, locality) =>
      request(`/localities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(locality),
      }),
    delete: (id) => request(`/localities/${id}`, { method: 'DELETE' }),
  },

  provinces: {
    getAll: () => request('/provinces'),
    getOne: (id) => request(`/provinces/${id}`),
    create: (province) =>
      request('/provinces', {
        method: 'POST',
        body: JSON.stringify(province),
      }),
    update: (id, province) =>
      request(`/provinces/${id}`, {
        method: 'PUT',
        body: JSON.stringify(province),
      }),
    delete: (id) => request(`/provinces/${id}`, { method: 'DELETE' }),
  },

  vehicles: {
    getAll: () => request('/vehicles'),
    getOne: (id) => request(`/vehicles/${id}`),
    create: (vehicle) =>
      request('/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicle),
      }),
    update: (id, vehicle) =>
      request(`/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(vehicle),
      }),
    delete: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),
  },

  drivers: {
    getAll: () => request('/drivers'),
    getInactive: () => request('/drivers/inactive'),
    getOne: (id) => request(`/drivers/${id}`),
    create: (driver) =>
      request('/drivers', {
        method: 'POST',
        body: JSON.stringify(driver),
      }),
    update: (id, driver) =>
      request(`/drivers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(driver),
      }),
    delete: (id) => request(`/drivers/${id}`, { method: 'DELETE' }),
    reactivate: (id) => request(`/drivers/${id}/reactivate`, { method: 'POST' }),
  },

  journeys: {
    getAll: () => request('/journeys'),
    getOne: (id) => request(`/journeys/${id}`),
    create: (journey) =>
      request('/journeys', {
        method: 'POST',
        body: JSON.stringify(journey),
      }),
    update: (id, journey) =>
      request(`/journeys/${id}`, {
        method: 'PUT',
        body: JSON.stringify(journey),
      }),
    delete: (id) => request(`/journeys/${id}`, { method: 'DELETE' }),
  },

  trips: {
    getAll: () => request('/trips'),
    getOne: (id) => request(`/trips/${id}`),
    create: (trip) =>
      request('/trips', {
        method: 'POST',
        body: JSON.stringify(trip),
      }),
    update: (id, trip) =>
      request(`/trips/${id}`, {
        method: 'PUT',
        body: JSON.stringify(trip),
      }),
    delete: (id) => request(`/trips/${id}`, { method: 'DELETE' }),
  },

  bookings: {
    getAll: () => request('/bookings'),
    getOne: (id) => request(`/bookings/${id}`),
    create: (booking) =>
      request('/bookings', {
        method: 'POST',
        body: JSON.stringify(booking),
      }),
    update: (id, booking) =>
      request(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(booking),
      }),
    delete: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),
  },
};