import axiosInstance from './axiosInstance';

export const visitorApi = {
  // Owner endpoints
  getMyRequests: async (params = {}) => {
    const res = await axiosInstance.get('/visitors/my', { params });
    return res.data?.data;
  },

  respondToRequest: async (id, decision, rejectionReason = '') => {
    const res = await axiosInstance.patch(`/visitors/${id}/respond`, {
      decision,
      rejectionReason
    });
    return res.data?.data?.request;
  },

  // Security & Admin endpoints
  createRequest: async (data) => {
    const res = await axiosInstance.post('/visitors', data);
    return res.data?.data?.request;
  },

  markEntered: async (id) => {
    const res = await axiosInstance.patch(`/visitors/${id}/enter`);
    return res.data?.data?.request;
  },

  markExited: async (id) => {
    const res = await axiosInstance.patch(`/visitors/${id}/exit`);
    return res.data?.data?.request;
  },

  adminOverride: async (id, reason) => {
    const res = await axiosInstance.patch(`/visitors/${id}/override`, { reason });
    return res.data?.data?.request;
  },

  getAllVisitors: async (params = {}) => {
    const res = await axiosInstance.get('/visitors', { params });
    return res.data?.data;
  }
};
