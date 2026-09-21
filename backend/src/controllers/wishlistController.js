const s = require('../services/wishlistService');
module.exports = {
  async getWishlist(req, res, next) { try { res.json(await s.getWishlist(req.headers['x-user-id'] || 'default')); } catch (e) { next(e); } },
  async addToWishlist(req, res, next) { try { res.status(201).json(await s.addWishlistItem(req.headers['x-user-id'] || 'default', req.body)); } catch (e) { next(e); } },
  async removeFromWishlist(req, res, next) { try { await s.removeWishlistItem(req.headers['x-user-id'] || 'default', Number(req.params.movieId)); res.json({ success: true }); } catch (e) { next(e); } }
};