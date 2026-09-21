const axios = require('axios');
const https = require('https');
const cache = require('../utils/cache');
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';
const GENRE_MAP = { 28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 18: 'Drama', 878: 'Sci-Fi', 53: 'Thriller' };
const GENRE_IDS = Object.fromEntries(Object.entries(GENRE_MAP).map(([id, n]) => [n.toLowerCase(), id]));
const SORT_MAP = { popularity: 'popularity.desc', rating: 'vote_average.desc', newest: 'primary_release_date.desc' };
const RETRYABLE = ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'EAI_AGAIN', 'ENOTFOUND', 'EPIPE'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
class MovieService {
  constructor() {
    this.client = null;
  }
  getClient() {
    const token = (process.env.TMDB_ACCESS_TOKEN || '').trim();
    if (!token || token === 'your_tmdb_bearer_token_here') {
      const e = new Error('TMDB_ACCESS_TOKEN is missing. Set it in backend/.env and restart.');
      e.status = 500;
      throw e;
    }
    if (!this.client) {
      this.client = axios.create({
        baseURL: (process.env.TMDB_BASE_URL || TMDB_BASE_URL).replace(/\/+$/, ''),
        headers: { accept: 'application/json', Authorization: `Bearer ${token}` },
        timeout: 15000,
        // Force IPv4: broken IPv6 routes/DNS are a common cause of TMDB ETIMEDOUT/ENOTFOUND
        httpsAgent: new https.Agent({ family: 4, keepAlive: true }),
        // Optional proxy, e.g. TMDB_PROXY=http://127.0.0.1:8080
        ...(process.env.TMDB_PROXY ? { proxy: (u => ({ protocol: u.protocol.replace(':', ''), host: u.hostname, port: Number(u.port) || 80 }))(new URL(process.env.TMDB_PROXY)) } : {})
      });
    }
    return this.client;
  }
  async request(endpoint, params, retries = 3) {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.getClient().get(endpoint, { params });
      } catch (err) {
        const status = err.response?.status;
        const transient = (!status && RETRYABLE.includes(err.code)) || status === 429 || status >= 500;
        if (transient && attempt < retries) { await sleep(500 * attempt); continue; }
        if (status === 401) { err.message = 'TMDB rejected the access token (401). Use the "API Read Access Token" (v4 Bearer), not the v3 API key.'; err.status = 502; }
        else if (status === 404) { err.message = 'Movie not found'; err.status = 404; }
        else if (status) { err.message = `TMDB error ${status}: ${err.response.data?.status_message || err.message}`; err.status = 502; }
        else { err.message = `Cannot reach TMDB (${err.code || err.message}). Your ISP is probably blocking api.themoviedb.org. Change your system DNS to 1.1.1.1 / 8.8.8.8, use a VPN, or set TMDB_BASE_URL / TMDB_PROXY in backend/.env.`; err.status = 503; }
        throw err;
      }
    }
  }
  normalizeMovie(item) {
    const primaryGenreId = item.genre_ids?.[0] ?? item.genres?.[0]?.id;
    return {
      id: item.id,
      title: item.title || 'Untitled',
      overview: item.overview || 'No overview available.',
      poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500',
      backdrop: item.backdrop_path ? `${BACKDROP_BASE_URL}${item.backdrop_path}` : null,
      releaseDate: item.release_date || 'Unknown',
      releaseYear: (item.release_date || '').substring(0, 4) || 'N/A',
      rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : null,
      genre: primaryGenreId ? (GENRE_MAP[primaryGenreId] || 'General') : 'General'
    };
  }
  async getMovies({ query, genre, sort = 'popularity', page = 1 }) {
    const cacheKey = `movies:${query}:${genre}:${sort}:${page}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    let endpoint = '/movie/popular';
    let params = { page: Math.max(1, Number(page) || 1) };
    const genreId = genre && GENRE_IDS[String(genre).toLowerCase()];
    if (query && query.trim()) {
      endpoint = '/search/movie';
      params.query = query.trim();
    } else if (genreId || (SORT_MAP[sort] && sort !== 'popularity')) {
      endpoint = '/discover/movie';
      params.sort_by = SORT_MAP[sort] || SORT_MAP.popularity;
      if (genreId) params.with_genres = genreId;
      if (sort === 'rating') params['vote_count.gte'] = 200;
    }
    const res = await this.request(endpoint, params);
    let results = res.data.results.map(item => this.normalizeMovie(item));
    if (query && query.trim() && genreId) results = results.filter(m => m.genre.toLowerCase() === String(genre).toLowerCase());
    const payload = { movies: results, page: res.data.page, totalPages: Math.min(res.data.total_pages, 500), hasMore: res.data.page < res.data.total_pages };
    cache.set(cacheKey, payload);
    return payload;
  }
  async getMovieDetails(id) {
    const res = await this.request(`/movie/${encodeURIComponent(id)}`);
    return this.normalizeMovie(res.data);
  }
}
module.exports = new MovieService();