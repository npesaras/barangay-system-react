import { api } from '../App';

export const clearanceService = {
  // Create a new clearance request
  createRequest: async (data) => {
    const response = await api.post('/clearance-requests', data);
    return response.data;
  },

  // List requests (admin: all, user: own)
  getRequests: async () => {
    const response = await api.get('/clearance-requests');
    return response.data;
  },

  // Approve a request (admin only)
  approveRequest: async (id) => {
    const response = await api.patch(`/clearance-requests/${id}/approve`);
    return response.data;
  },

  // Delete a request (admin only)
  deleteRequest: async (id) => {
    const response = await api.delete(`/clearance-requests/${id}`);
    return response.data;
  },

  // Deny a request (admin only)
  denyRequest: async (id) => {
    const response = await api.patch(`/clearance-requests/${id}/deny`);
    return response.data;
  },
}; 