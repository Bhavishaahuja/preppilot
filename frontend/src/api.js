// One place that knows where the backend is. Falls back to localhost if the env var is missing.
export const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"