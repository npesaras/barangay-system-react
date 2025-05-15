import { api } from '../App';

export const blotterService = {
  // Create a new blotter request
  createRequest: async (data) => {
    const response = await api.post('/blotter-requests', data);
    return response.data;
  },

  // List requests (admin: all, user: own)
  getRequests: async () => {
    const response = await api.get('/blotter-requests');
    return response.data;
  },

  // Approve a request (admin only)
  approveRequest: async (id) => {
    const response = await api.patch(`/blotter-requests/${id}/approve`);
    return response.data;
  },

  // Deny a request (admin only)
  denyRequest: async (id) => {
    const response = await api.patch(`/blotter-requests/${id}/deny`);
    return response.data;
  },

  // Delete a request (admin only)
  deleteRequest: async (id) => {
    const response = await api.delete(`/blotter-requests/${id}`);
    return response.data;
  },
}; 