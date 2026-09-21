const WishlistItem = require('../models/WishlistItem');
class WishlistService {
  async getWishlist(userId) { return await WishlistItem.find({ userId }).sort({ createdAt: -1 }); }
  async addWishlistItem(userId, data) {
    return await WishlistItem.findOneAndUpdate({ userId, movieId: data.movieId }, { userId, ...data }, { upsert: true, new: true });
  }
  async removeWishlistItem(userId, movieId) { return await WishlistItem.findOneAndDelete({ userId, movieId }); }
}
module.exports = new WishlistService();