import axiosInstance from './axiosInstance';

export const amenityApi = {
  getCatalog: async () => {
    const res = await axiosInstance.get('/amenities');
    return res.data?.data?.amenities || [];
  },

  getById: async (id) => {
    const res = await axiosInstance.get(`/amenities/${id}`);
    return res.data?.data?.amenity;
  },

  getMyCard: async (amenityId) => {
    const res = await axiosInstance.get(`/amenity-access/cards/${amenityId}`);
    return res.data?.data?.card;
  },

  purchaseSubscription: async (data) => {
    const res = await axiosInstance.post('/subscriptions/purchase', data);
    return res.data?.data;
  },

  verifyCard: async (qrToken) => {
    const res = await axiosInstance.post('/amenity-access/verify', { qrToken });
    return res.data?.data;
  },

  adminOverride: async (data) => {
    const res = await axiosInstance.post('/amenity-access/override', data);
    return res.data?.data;
  },

  getEntryLogs: async (params = {}) => {
    const res = await axiosInstance.get('/amenity-access/logs', { params });
    return res.data?.data;
  },

  // Admin amenity management
  getAllAdmin: async () => {
    const res = await axiosInstance.get('/amenities/admin/all');
    return res.data?.data?.amenities || [];
  },

  createAmenity: async (data) => {
    const res = await axiosInstance.post('/amenities', data);
    return res.data?.data?.amenity;
  },

  updateAmenity: async (id, data) => {
    const res = await axiosInstance.patch(`/amenities/${id}`, data);
    return res.data?.data?.amenity;
  }
};
