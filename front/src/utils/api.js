import axios from 'axios';
import { API_BASE_URL } from '@src/config/config';

// Example utility function for making API requests
export const fetchDataFromApi = async (endpoint, params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${endpoint}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching data from API:', error.message);
    throw error;
  }
};

// Define fetchApiData function and export it
export const fetchApiData = async (endpoint, method = 'GET', data = null) => {
  try {
    const response = await axios({
      method,
      url: `${API_BASE_URL}/${endpoint}`,
      data
    });
    return response.data;
  } catch (error) {
    console.error(`Error ${method}ing data from API:`, error.message);
    throw error;
  }
};