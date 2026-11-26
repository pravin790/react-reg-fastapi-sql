export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : payload?.message || "Request failed";

    throw new Error(message);
  }

  return payload;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  get: async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
      ...options,
    });

    return handleResponse(response);
  },

  post: async (endpoint, body, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
      body: JSON.stringify(body),
      ...options,
    });

    return handleResponse(response);
  },

  put: async (endpoint, body, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
      body: JSON.stringify(body),
      ...options,
    });

    return handleResponse(response);
  },

  postForm: async (endpoint, formData, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
      body: formData,
      ...options,
    });

    return handleResponse(response);
  },

  putForm: async (endpoint, formData, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
      body: formData,
      ...options,
    });

    return handleResponse(response);
  },

  delete: async (endpoint, body = null, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      ...options,
    });

    return handleResponse(response);
  },
};

export default api;
