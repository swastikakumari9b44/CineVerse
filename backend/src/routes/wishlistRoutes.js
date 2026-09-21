const r = require('express').Router(); const c = require('../controllers/wishlistController');
r.get('/', c.getWishlist); r.post('/', c.addToWishlist);
r.delete('/:movieId', c.removeFromWishlist);
module.exports = r;