import axiosInstance, { setAccessToken } from './axiosInstance';

export const authApi = {
  register: async (data) => {
    const res = await axiosInstance.post('/auth/register', data);
    return res.data;
  },

  verifyOtp: async (data) => {
    const res = await axiosInstance.post('/auth/verify-otp', data);
    return res.data;
  },

  resendOtp: async (data) => {
    const res = await axiosInstance.post('/auth/resend-otp', data);
    return res.data;
  },

  login: async (credentials) => {
    const res = await axiosInstance.post('/auth/login', credentials);
    if (res.data?.data?.accessToken) {
      setAccessToken(res.data.data.accessToken);
    }
    return res.data;
  },

  refreshToken: async () => {
    const res = await axiosInstance.post('/auth/refresh-token');
    if (res.data?.data?.accessToken) {
      setAccessToken(res.data.data.accessToken);
    }
    return res.data;
  },

  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  logoutAll: async () => {
    try {
      await axiosInstance.post('/auth/logout-all');
    } finally {
      setAccessToken(null);
    }
  },

  forgotPassword: async (email) => {
    const res = await axiosInstance.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (data) => {
    const res = await axiosInstance.post('/auth/reset-password', data);
    return res.data;
  },

  getMe: async () => {
    const res = await axiosInstance.get('/auth/me');
    return res.data?.data?.user;
  }
};
