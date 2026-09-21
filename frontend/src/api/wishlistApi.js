import axios from 'axios';
import { BASE } from './movieApi';
// Uses MongoDB via the backend when available, otherwise falls back to this browser's localStorage.
const getUid = () => { let u = localStorage.getItem('cineverse_uid'); if (!u) { u = 'u_' + Math.random().toString(36).slice(2); localStorage.setItem('cineverse_uid', u); } return u; };
const h = () => ({ headers: { 'x-user-id': getUid() }, timeout: 4000 });
const KEY = 'cineverse_wishlist';
const local = { get: () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }, set: v => localStorage.setItem(KEY, JSON.stringify(v)) };
export const wishlistApi = {
  async getWishlist() { try { return (await axios.get(`${BASE}/wishlist`, h())).data; } catch { return local.get(); } },
  async addToWishlist(m) {
    try { return (await axios.post(`${BASE}/wishlist`, m, h())).data; }
    catch { const item = { ...m, createdAt: new Date().toISOString() }; local.set([item, ...local.get().filter(i => i.movieId !== m.movieId)]); return item; }
  },
  async removeFromWishlist(id) {
    try { return (await axios.delete(`${BASE}/wishlist/${id}`, h())).data; }
    catch { local.set(local.get().filter(i => i.movieId !== id)); return { success: true }; }
  }
};
