import axios from "axios";
import { BASE_URL } from "./EndPoint";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // List of endpoints that should NOT have authentication token
    const publicEndpoints = [
      '/api/auth/login/',
      '/api/auth/register/',
      '/api/auth/staff/accept/',
      '/api/orders/qr/',
      '/api/payments/verify/',
      '/api/payments/create-razorpay-order/',
    ];

    // Check if current request is to a public endpoint
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );

    // Only add token if NOT a public endpoint
    if (!isPublicEndpoint) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    console.log("🚀 API Request:", {
      url: `${config.baseURL || ""}${config.url}`,
      method: config.method?.toUpperCase(),
      headers: config.headers,
      data: config.data,
      isPublicEndpoint,
    });
    return config;
  },
  (error) => {
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  },
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("❌ API Response Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Handle 401 Unauthorized errors (invalid/expired token)
    if (error.response?.status === 401) {
      const url = error.config?.url;
      
      // If 401 on non-login endpoints, clear invalid tokens and redirect to login
      if (!url?.includes('/api/auth/login/')) {
        console.warn("🔒 Token invalid or expired. Clearing authentication...");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRole");
        
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
