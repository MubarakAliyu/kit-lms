import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Single shared axios instance. Every service in src/_lib/api/* imports this.
// In dev, requests are intercepted by MSW (browser worker for client calls,
// Node server for NextAuth's authorize() callback).
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 8000,
});

// Retry once on a network error. Covers the brief race window when MSW is
// still booting in some flows and an early request would otherwise hit a
// non-existent backend.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (config && !config._retry && error.code === "ERR_NETWORK") {
      config._retry = true;
      await new Promise((resolve) => setTimeout(resolve, 500));
      return apiClient(config);
    }
    return Promise.reject(error);
  }
);
