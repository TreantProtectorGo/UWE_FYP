import axios from 'axios';

// Configure base URL for your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Traffic News API
export const trafficAPI = {
  // Get all traffic news
  getTrafficNews: async () => {
    try {
      const response = await api.get('/trafficNews_api.php?action=read');
      // PHP API 回傳 { count, total, limit, offset, data }
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching traffic news:', error);
      throw error;
    }
  },

  // Get traffic news by type
  getTrafficNewsByType: async (type) => {
    try {
      const response = await api.get(`/trafficNews_api.php?action=read&datasource=${type}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching traffic news by type:', error);
      throw error;
    }
  },
};

// AI Route Check API
export const aiAPI = {
  // Check route for traffic issues
  checkRoute: async (origin, destination) => {
    try {
      const response = await api.post('/aiCheck_api.php?action=check', {
        origin,
        destination,
      });
      return response.data;
    } catch (error) {
      console.error('Error checking route:', error);
      throw error;
    }
  },
};

// MTR Service API
export const mtrAPI = {
  // Get all MTR service statuses
  getAll: async () => {
    try {
      const response = await api.get('/mtr_api.php');
      // PHP returns { count, data }
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching MTR status:', error);
      throw error;
    }
  },
};

// Special Traffic Arrangements API
export const specialTrafficAPI = {
  // Get active special traffic arrangements
  getActive: async () => {
    try {
      const response = await api.get('/specialArr_api.php?action=read&active=1');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching special traffic arrangements:', error);
      throw error;
    }
  },
  // Get history special traffic arrangements
  getHistory: async () => {
    try {
      const response = await api.get('/specialArr_api.php?action=read&active=2');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching special traffic history:', error);
      throw error;
    }
  },
};

// Road Closure API
export const roadClosureAPI = {
  // Get active road closures
  getActive: async () => {
    try {
      const response = await api.get('/tempRoadClosure_api.php?action=read&active=1');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching road closures:', error);
      throw error;
    }
  },
  // Get history road closures
  getHistory: async () => {
    try {
      const response = await api.get('/tempRoadClosure_api.php?action=read&active=2');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching road closure history:', error);
      throw error;
    }
  },
};

export default api;
