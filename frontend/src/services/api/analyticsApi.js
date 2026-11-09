import axiosInstance from './axiosInstance';

export const analyticsApi = {
  getDashboard: async () => {
    const res = await axiosInstance.get('/analytics/dashboard');
    return res.data?.data;
  },

  getSociety: async () => {
    const res = await axiosInstance.get('/analytics/society');
    return res.data?.data;
  },

  getMaintenance: async (params = {}) => {
    const res = await axiosInstance.get('/analytics/maintenance', { params });
    return res.data?.data;
  },

  getAmenities: async () => {
    const res = await axiosInstance.get('/analytics/amenities');
    return res.data?.data;
  },

  getComplaints: async () => {
    const res = await axiosInstance.get('/analytics/complaints');
    return res.data?.data;
  },

  getGate: async () => {
    const res = await axiosInstance.get('/analytics/gate');
    return res.data?.data;
  },

  getSos: async () => {
    const res = await axiosInstance.get('/analytics/sos');
    return res.data?.data;
  }
};
