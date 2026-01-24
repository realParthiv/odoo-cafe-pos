import api from "./api";

export const authService = {
  // 1. Owner Registration
  registerOwner: async (userData) => {
    try {
      const response = await api.post("/api/auth/register/", userData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 2. Login
  login: async (credentials) => {
    try {
      const response = await api.post("/api/auth/login/", credentials);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 3. Get Profile
  getProfile: async () => {
    try {
      const response = await api.get("/api/auth/profile/");
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 4. Update Profile
  updateProfile: async (data) => {
    try {
      const response = await api.patch("/api/auth/profile/", data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 5. Update UPI ID
  updateUpi: async (data) => {
    try {
      const response = await api.patch("/api/auth/profile/upi/", data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 6. Change Password
  changePassword: async (data) => {
    try {
      const response = await api.post("/api/auth/change-password/", data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 8. List All Users (Admin Only)
  getUsers: async (role = null) => {
    try {
      const url = role ? `/api/auth/users/?role=${role}` : "/api/auth/users/";
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 9. Get User by ID (Admin Only)
  getUser: async (id) => {
    try {
      const response = await api.get(`/api/auth/users/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 10. Update User (Admin Only)
  updateUser: async (id, data) => {
    try {
      const response = await api.patch(`/api/auth/users/${id}/`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 11. Deactivate User (Admin Only)
  deactivateUser: async (id) => {
    try {
      const response = await api.delete(`/api/auth/users/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 12. Logout
  logout: async (refreshToken) => {
    try {
      const response = await api.post("/api/auth/logout/", {
        refresh: refreshToken,
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 13. Invite Staff
  inviteStaff: async (data) => {
    try {
      const response = await api.post("/api/auth/staff/invite/", data);
      console.log("response of inviteStaff :: ", response);

      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 14. List Invitations
  getInvitations: async (status = null, role = null) => {
    try {
      let url = "/api/auth/staff/invitations/";
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (role) params.append("role", role);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 15. Resend Invitation
  resendInvitation: async (id) => {
    try {
      const response = await api.post(
        `/api/auth/staff/invitations/${id}/resend/`,
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 16. Delete Invitation
  deleteInvitation: async (id) => {
    try {
      const response = await api.delete(`/api/auth/staff/invitations/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 17. Verify Token
  verifyToken: async (token) => {
    try {
      const response = await api.get(`/api/auth/staff/verify-token/${token}/`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 18. Set Password
  setPassword: async (data) => {
    try {
      const response = await api.post("/api/auth/staff/set-password/", data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export const tableService = {
  // 1. List Floors
  getFloors: async () => {
    try {
      const response = await api.get("/api/tables/floors/");
      console.log("response of getFloors :: ", response);
      return response.data;
    } catch (error) {
      console.log("error of getFloors :: ", error);
      throw error.response ? error.response.data : error;
    }
  },

  // 2. Create Floor
  createFloor: async (data) => {
    try {
      const response = await api.post("/api/tables/floors/", data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 3. Delete Floor
  deleteFloor: async (id) => {
    try {
      const response = await api.delete(`/api/tables/floors/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 4. List Tables
  getTables: async (floorId = null) => {
    try {
      let url = "/api/tables/tables/";
      if (floorId) {
        url += `?floor=${floorId}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 5. Create Table
  createTable: async (data) => {
    try {
      const response = await api.post("/api/tables/tables/", data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 6. Delete Table
  deleteTable: async (id) => {
    try {
      const response = await api.delete(`/api/tables/tables/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 7. Update Table Status
  updateTableStatus: async (id, status) => {
    try {
      const response = await api.patch(`/api/tables/tables/${id}/status/`, {
        status,
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 8. Get QR Code Image
  getQrCode: async (id) => {
    try {
      const response = await api.get(`/api/tables/tables/${id}/qr/`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 9. Download QR Code PDF
  downloadQrPdf: async (id) => {
    try {
      const response = await api.get(`/api/tables/tables/${id}/qr/pdf/`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export const orderService = {
  // 1. Get Dashboard Stats
  getDashboardStats: async () => {
    try {
      const response = await api.get("/api/orders/dashboard/stats/");
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 2. Get Sales History
  getSalesHistory: async (days = 30) => {
    try {
      const response = await api.get(
        `/api/orders/dashboard/sales-history/?days=${days}`,
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 3. Get Cashier Performance
  getCashierPerformance: async () => {
    try {
      const response = await api.get(
        "/api/orders/dashboard/cashier-performance/",
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export const settingsService = {
  // 1. Update Mobile Order Settings
  updateMobileOrderSettings: async (data) => {
    try {
      const response = await api.put("/api/settings/mobile-order/", data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};
