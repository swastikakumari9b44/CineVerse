const s = require('../services/movieService');
module.exports = {
  async getMovies(req, res, next) { try { res.json(await s.getMovies(req.query)); } catch (e) { next(e); } },
  async getMovieDetails(req, res, next) { try { res.json(await s.getMovieDetails(req.params.id)); } catch (e) { next(e); } }
};