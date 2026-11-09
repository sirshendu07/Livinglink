import axiosInstance from './axiosInstance';

export const maintenanceApi = {
  getMyInvoices: async (params = {}) => {
    const res = await axiosInstance.get('/maintenance/my', { params });
    return res.data?.data;
  },

  getAllAdmin: async (params = {}) => {
    const res = await axiosInstance.get('/maintenance/admin/all', { params });
    return res.data?.data;
  },

  getDefaulters: async (params = {}) => {
    const res = await axiosInstance.get('/maintenance/admin/defaulters', { params });
    return res.data?.data;
  },

  createInvoice: async (data) => {
    const res = await axiosInstance.post('/maintenance', data);
    return res.data?.data?.invoice;
  },

  generateBulkInvoices: async (data) => {
    const res = await axiosInstance.post('/maintenance/bulk', data);
    return res.data?.data;
  },

  recordWaiver: async (invoiceId, data) => {
    const res = await axiosInstance.patch(`/maintenance/${invoiceId}/waiver`, data);
    return res.data?.data?.invoice;
  }
};
