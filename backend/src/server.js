const express = require('express'); const cors = require('cors'); const dotenv = require('dotenv'); const connectDB = require('./config/db');
dotenv.config(); if (process.env.MONGODB_URI) connectDB();
const app = express(); app.use(cors()); app.use(express.json());
app.use('/api/', require('./middleware/rateLimiter'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use(require('./middleware/errorHandler'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));