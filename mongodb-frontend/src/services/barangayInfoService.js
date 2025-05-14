import api from './axios';

export const barangayInfoService = {
  getInfo: async () => {
    const res = await api.get('/barangay-info');
    return res.data.data;
  },
  updateInfo: async (info, logoFile) => {
    const formData = new FormData();
    formData.append('barangay', info.barangay);
    formData.append('municipality', info.municipality);
    formData.append('province', info.province);
    formData.append('phoneNumber', info.phoneNumber);
    formData.append('emailAddress', info.emailAddress);
    if (logoFile) formData.append('logo', logoFile);
    const res = await api.put('/barangay-info', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data;
  },
  getLogoUrl: () => `${api.defaults.baseURL}/barangay-info/logo`,
}; 