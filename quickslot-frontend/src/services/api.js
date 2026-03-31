import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Assuming backend runs on 5000
  headers: {
    'Content-Type': 'application/json',
  },
});

export const parkingService = {
  createEntry: (data) => api.post('/parking/entry', data),
  getExitInfo: (vehicleNo) => api.get(`/parking/exit/${vehicleNo}`),
  processExit: (id) => api.put(`/parking/exit/${id}`),
};

export const slotsService = {
  getSlots: () => api.get('/slots'),
};

export const reportsService = {
  getTodayReport: () => api.get('/reports/today'),
};

export const historyService = {
  getHistory: (vehicleNo) => api.get(`/history/${vehicleNo || ''}`),
};

export default api;
