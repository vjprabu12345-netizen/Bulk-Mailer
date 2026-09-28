import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("bulkmail_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token has expired or is invalid, bounce back to login rather than
// showing a confusing "unauthorized" state on whatever page is open.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("bulkmail_token");
      localStorage.removeItem("bulkmail_admin");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default client;
