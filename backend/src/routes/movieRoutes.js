const r = require('express').Router(); const c = require('../controllers/movieController');
r.get('/', c.getMovies); r.get('/:id', c.getMovieDetails);
module.exports = r;