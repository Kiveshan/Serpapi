import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const authAPI = {
  // User login
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get current user profile
  getProfile: async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.user;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Store token in localStorage
  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },

  // Get token from localStorage
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  // Remove token from localStorage
  removeToken: () => {
    localStorage.removeItem('authToken');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    return !!token;
  }
};