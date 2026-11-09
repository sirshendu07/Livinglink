import axiosInstance from './axiosInstance';

export const userApi = {
  getUsers: async (params = {}) => {
    const res = await axiosInstance.get('/users', { params });
    return res.data?.data;
  },

  getFlats: async (params = {}) => {
    const res = await axiosInstance.get('/users/flats', { params });
    return res.data?.data;
  },

  approveOwner: async (userId) => {
    const res = await axiosInstance.patch(`/users/${userId}/approve`);
    return res.data?.data?.user;
  },

  updateStatus: async (userId, status, reason = '') => {
    const res = await axiosInstance.patch(`/users/${userId}/status`, { status, reason });
    return res.data?.data?.user;
  },

  createStaff: async (data) => {
    const res = await axiosInstance.post('/users/staff', data);
    return res.data?.data?.staff;
  },

  getAuditLogs: async (params = {}) => {
    const res = await axiosInstance.get('/users/audit-logs', { params });
    return res.data?.data;
  }
};

export const notificationApi = {
  getNotifications: async (params = {}) => {
    const res = await axiosInstance.get('/notifications', { params });
    return res.data?.data;
  },

  markRead: async (id) => {
    const res = await axiosInstance.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async () => {
    const res = await axiosInstance.patch('/notifications/read-all');
    return res.data;
  }
};
