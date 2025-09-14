import axios from "axios";

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: "http://localhost:8000", // FastAPI backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
