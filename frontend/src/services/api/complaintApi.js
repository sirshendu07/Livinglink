import axiosInstance from './axiosInstance';

export const complaintApi = {
  getMyComplaints: async (params = {}) => {
    const res = await axiosInstance.get('/complaints/my', { params });
    return res.data?.data;
  },

  createComplaint: async (data) => {
    const res = await axiosInstance.post('/complaints', data);
    return res.data?.data?.complaint;
  },

  getAllAdmin: async (params = {}) => {
    const res = await axiosInstance.get('/complaints', { params });
    return res.data?.data;
  },

  updateStatus: async (id, data) => {
    const res = await axiosInstance.patch(`/complaints/${id}/status`, data);
    return res.data?.data?.complaint;
  }
};
