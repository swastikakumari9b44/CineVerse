const mongoose = require('mongoose');
const WishlistItemSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  movieId: { type: Number, required: true },
  title: { type: String, required: true },
  poster: { type: String },
  releaseYear: { type: String },
  rating: { type: Number },
  genre: { type: String },
  createdAt: { type: Date, default: Date.now }
});
WishlistItemSchema.index({ userId: 1, movieId: 1 }, { unique: true });
module.exports = mongoose.model('WishlistItem', WishlistItemSchema);