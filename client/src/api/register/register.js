import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const registerAPI = {
  // Register new user
  register: async (formData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all institutions for dropdown
  getInstitutions: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/institutions`);
      return response.data.institutions;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all roles for dropdown
  getRoles: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/roles`);
      return response.data.roles;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};