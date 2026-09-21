import axios from 'axios';
export const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const errMsg = e => e.response?.data?.error || (e.request ? 'Cannot reach the CineVerse backend. Is it running on port 5000?' : e.message);
const wrap = async fn => { try { return await fn(); } catch (e) { throw new Error(errMsg(e)); } };
export const movieApi = {
  getMovies: p => wrap(async () => (await axios.get(`${BASE}/movies`, { params: p })).data),
  getMovieDetails: id => wrap(async () => (await axios.get(`${BASE}/movies/${id}`)).data)
};
