import axiosInstance from './axiosInstance';

export const sosApi = {
  triggerSos: async (notes = 'Emergency assistance requested') => {
    const res = await axiosInstance.post('/sos/trigger', { notes });
    return res.data?.data?.alert;
  },

  getActiveAlerts: async () => {
    const res = await axiosInstance.get('/sos/active');
    return res.data?.data?.alerts || [];
  },

  acknowledgeSos: async (id, notes = '') => {
    const res = await axiosInstance.patch(`/sos/${id}/acknowledge`, { notes });
    return res.data?.data?.alert;
  },

  resolveSos: async (id, resolutionNotes) => {
    const res = await axiosInstance.patch(`/sos/${id}/resolve`, { resolutionNotes });
    return res.data?.data?.alert;
  },

  getHistory: async (params = {}) => {
    const res = await axiosInstance.get('/sos/history', { params });
    return res.data?.data;
  }
};
