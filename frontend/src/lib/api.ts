import axios from "axios";

const API_BASE_URL =  "http://20.115.98.57:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("jurify_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("jurify_token");
      localStorage.removeItem("jurify_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth API ──────────────────────────────────────────
export const authAPI = {
  register: (data: { email: string; password: string; full_name: string }) =>
    api.post("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
  logout: () => api.post("/api/auth/logout"),
};

// ── Documents API ─────────────────────────────────────
export const documentsAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  list: (page = 1, pageSize = 10) =>
    api.get("/api/documents", { params: { page, page_size: pageSize } }),
  get: (id: number) => api.get(`/api/documents/${id}`),
  delete: (id: number) => api.delete(`/api/documents/${id}`),
  download: (id: number) =>
    api.get(`/api/documents/${id}/download`, { responseType: "blob" }),
};

// ── Analysis API ──────────────────────────────────────
export const analysisAPI = {
  start: (documentId: number) =>
    api.post(`/api/analysis/${documentId}/start`),
  status: (documentId: number) =>
    api.get(`/api/analysis/${documentId}/status`),
  result: (documentId: number) =>
    api.get(`/api/analysis/${documentId}/result`),
};
