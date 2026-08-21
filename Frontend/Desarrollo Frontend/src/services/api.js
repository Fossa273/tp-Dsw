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

  // Si el servidor responde algo que no es JSON (por ejemplo una
  // pagina de error HTML), avisamos con un mensaje claro en vez de
  // romper con "Unexpected token '<'".
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
  clientes: {
    getAll: () => request('/clientes'),
    getInactive: () => request('/clientes/inactivos'),
    getOne: (id) => request(`/clientes/${id}`),
    create: (cliente) =>
      request('/clientes', { method: 'POST', body: JSON.stringify(cliente) }),
    update: (id, cliente) =>
      request(`/clientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(cliente),
      }),
    delete: (id) => request(`/clientes/${id}`, { method: 'DELETE' }),
    reactivate: (id) =>
      request(`/clientes/${id}/reactivar`, { method: 'POST' }),
  },

  auth: {
    login: (email, password) =>
      request('/clientes/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: (id) =>
      request('/clientes/logout', {
        method: 'POST',
        body: JSON.stringify({ id }),
      }),
    resetPassword: (email, password) =>
      request('/clientes/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },

  localidades: {
    getAll: () => request('/localidades'),
    getOne: (id) => request(`/localidades/${id}`),
    create: (localidad) =>
      request('/localidades', {
        method: 'POST',
        body: JSON.stringify(localidad),
      }),
    update: (id, localidad) =>
      request(`/localidades/${id}`, {
        method: 'PUT',
        body: JSON.stringify(localidad),
      }),
    delete: (id) => request(`/localidades/${id}`, { method: 'DELETE' }),
  },

  provincias: {
    getAll: () => request('/provincias'),
    getOne: (id) => request(`/provincias/${id}`),
    create: (provincia) =>
      request('/provincias', {
        method: 'POST',
        body: JSON.stringify(provincia),
      }),
    update: (id, provincia) =>
      request(`/provincias/${id}`, {
        method: 'PUT',
        body: JSON.stringify(provincia),
      }),
    delete: (id) => request(`/provincias/${id}`, { method: 'DELETE' }),
  },

  vehiculos: {
    getAll: () => request('/vehiculos'),
    getOne: (id) => request(`/vehiculos/${id}`),
    create: (vehiculo) =>
      request('/vehiculos', {
        method: 'POST',
        body: JSON.stringify(vehiculo),
      }),
    update: (id, vehiculo) =>
      request(`/vehiculos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(vehiculo),
      }),
    delete: (id) => request(`/vehiculos/${id}`, { method: 'DELETE' }),
  },
};
