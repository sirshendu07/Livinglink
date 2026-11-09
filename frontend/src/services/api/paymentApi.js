import axiosInstance from './axiosInstance';

export const paymentApi = {
  payMaintenance: async (data) => {
    const res = await axiosInstance.post('/payments/pay-maintenance', data);
    return res.data?.data;
  },

  getPayments: async (params = {}) => {
    const res = await axiosInstance.get('/payments', { params });
    return res.data?.data;
  },

  downloadReceipt: async (paymentId, receiptNumber = 'Receipt') => {
    const res = await axiosInstance.get(`/receipts/${paymentId}/download`, {
      responseType: 'blob'
    });

    // Create a temporary link and trigger browser download
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LivingLink-${receiptNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
