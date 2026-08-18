const API_BASE = 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data;
}

export const api = {
  clientes: {
    getAll: () => request('/clientes'),
    getOne: (id) => request(`/clientes/${id}`),
    create: (cliente) =>
      request('/clientes', { method: 'POST', body: JSON.stringify(cliente) }),
    update: (id, cliente) =>
      request(`/clientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(cliente),
      }),
    delete: (id) => request(`/clientes/${id}`, { method: 'DELETE' }),
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
