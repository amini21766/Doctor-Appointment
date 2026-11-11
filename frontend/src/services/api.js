import axios from "axios";

/**
 * Single Axios instance for the whole app.
 * - baseURL comes from VITE_API_URL (production) or the Vite proxy (dev).
 * - Authorization header is injected from localStorage.
 * - 401 responses clear the session so the app can redirect to login.
 */
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
  : "/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

export const TOKEN_KEY = "dap_token";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      // Token invalid/expired — clear it. The AuthContext listens via storage events
      // and ProtectedRoute will redirect.
      const onAuthPage = /^\/(login|register|forgot-password|reset-password|admin\/login)/.test(
        window.location.pathname
      );
      localStorage.removeItem(TOKEN_KEY);
      if (!onAuthPage) {
        window.dispatchEvent(new Event("auth:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

/** Resolve a possibly-relative image path (e.g. /uploads/xyz.png) to a full URL. */
export const resolveImageUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}${url}`;
  }
  return url; // dev proxy handles /uploads
};

/** Extract a readable message from an Axios error. */
export const getErrorMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.errors?.length) return error.response.data.errors[0].message;
  if (error?.message) return error.message;
  return "Something went wrong. Please try again.";
};

export default api;