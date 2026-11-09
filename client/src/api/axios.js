import axios from "axios";

const api = axios.create({
  // In production, call the API through the same Vercel domain. A configured
  // VITE_API_URL can still point to a separately hosted backend.
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token expires, send the user to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = err.config?.url?.includes("/auth/");
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Gets a readable message from an Axios error
export const getErrorMessage = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

export default api;
