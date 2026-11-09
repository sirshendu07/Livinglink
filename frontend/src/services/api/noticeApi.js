import axiosInstance from './axiosInstance';

export const noticeApi = {
  getPublished: async (params = {}) => {
    const res = await axiosInstance.get('/notices', { params });
    return res.data?.data;
  },

  markRead: async (noticeId) => {
    const res = await axiosInstance.post(`/notices/${noticeId}/read`);
    return res.data;
  },

  getAllAdmin: async (params = {}) => {
    const res = await axiosInstance.get('/notices/admin/all', { params });
    return res.data?.data;
  },

  createNotice: async (data) => {
    const res = await axiosInstance.post('/notices', data);
    return res.data?.data?.notice;
  },

  updateNotice: async (id, data) => {
    const res = await axiosInstance.patch(`/notices/${id}`, data);
    return res.data?.data?.notice;
  },

  deleteNotice: async (id) => {
    const res = await axiosInstance.delete(`/notices/${id}`);
    return res.data;
  },

  getReaders: async (id) => {
    const res = await axiosInstance.get(`/notices/${id}/readers`);
    return res.data?.data;
  }
};
