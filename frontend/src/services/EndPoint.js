export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const WS_URL = BASE_URL.replace(/^https/, 'wss').replace(/^http/, 'ws') + "/ws/kitchen/orders/";
