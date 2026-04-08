import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Get auth token for requests
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const applicationsAPI = {
  // Get all applications with pending count
  getAllApplications: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system-admin`, {
        headers: getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get pending applications only
  getPendingApplications: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system-admin/pending`, {
        headers: getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get applications by status
  getApplicationsByStatus: async (status) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system-admin/status/${status}`, {
        headers: getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get application details by ID
  getApplicationById: async (userid) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system-admin/${userid}`, {
        headers: getAuthHeaders()
      });
      return response.data.data.application;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update application status
  updateApplicationStatus: async (userid, status, enabled) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/system-admin/${userid}/status`,
        { status, enabled },
        { headers: getAuthHeaders() }
      );
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get signed URL for document download
  getDocumentUrl: async (userid) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system-admin/${userid}/document`, {
        headers: getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};