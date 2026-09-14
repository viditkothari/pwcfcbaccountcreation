import axios from "axios";

// Same-origin by default (works on any Vercel domain). Locally, REACT_APP_BACKEND_URL
// in frontend/.env points at the preview backend.
const BASE = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

export const api = {
  metadata: async () => (await axios.get(`${BASE}/metadata`)).data,
  search: async (params) =>
    (await axios.get(`${BASE}/accounts`, { params })).data,
  get: async (id) => (await axios.get(`${BASE}/accounts/${id}`)).data,
  create: async (payload) =>
    (await axios.post(`${BASE}/accounts`, payload)).data,
  hierarchy: async (id) => (await axios.get(`${BASE}/accounts/${id}/hierarchy`)).data,
  scaffoldUrl: () => `${BASE}/scaffold/download`,
};
