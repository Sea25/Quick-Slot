const API_BASE = '/api';

let onSessionInvalid = null;

export function setSessionInvalidHandler(handler) {
  onSessionInvalid = handler;
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const userId = localStorage.getItem('quickslot_user_id');
  if (userId) {
    headers['x-user-id'] = userId;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 || data.code === 'SESSION_INVALID') {
      onSessionInvalid?.();
    }
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  login: (body) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  verifySession: () => request('/auth/session'),

  searchParking: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/parking/search?${q}`);
  },

  getLot: (lotId) => request(`/parking/${lotId}`),

  createBooking: (body) =>
    request('/bookings', { method: 'POST', body: JSON.stringify(body) }),

  payBooking: (id) =>
    request(`/bookings/${id}/pay`, { method: 'POST', body: '{}' }),

  cancelBooking: (id) =>
    request(`/bookings/${id}/cancel`, { method: 'PATCH', body: '{}' }),

  getMyTickets: () => request('/bookings/my-tickets'),

  getVehicles: () => request('/vehicles'),

  addVehicle: (body) =>
    request('/vehicles', { method: 'POST', body: JSON.stringify(body) }),
};
