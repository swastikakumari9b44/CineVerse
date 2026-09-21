# 🎬 CineVerse

A movie discovery app. Browse popular films, search, filter by genre, sort, open movie details, and save favourites to a wishlist. Movie data comes from [TMDB](https://www.themoviedb.org/).

**Stack:** React + Vite + Tailwind (frontend) · Node + Express (backend) · MongoDB (optional, for the wishlist)

## 🎥 Demo video

> Watch CineVerse in action: browsing, search, genre filters, movie details with trailers, and the wishlist.
https://drive.google.com/drive/home?dmr=1&ec=wgc-drive-%5Bmodule%5D-goto
<!--


## Features

- Browse popular movies with **Load more** pagination
- **Search** by title (debounced)
- **Genre filters** and **sorting** (Popular, Top rated, Newest)
- **Details modal** with backdrop, overview, year and rating
- **Watch trailer**: plays the official YouTube trailer (from TMDB) right inside the details modal
- **Wishlist** saved in MongoDB, with automatic fallback to browser localStorage if the database isn't available
- Server-side caching (5 min) and rate limiting (200 requests / 15 min)
- Clear on-screen errors with a Retry button

## Project structure

```
cineverse/
├── backend/
│   ├── src/
│   │   ├── config/db.js            # MongoDB connection (non-fatal if it fails)
│   │   ├── controllers/            # Request handlers
│   │   ├── middleware/             # Error handler, rate limiter
│   │   ├── models/WishlistItem.js  # Mongoose schema
│   │   ├── routes/                 # /api/movies, /api/wishlist
│   │   ├── services/               # TMDB client (retries, IPv4, proxy support)
│   │   ├── utils/cache.js          # In-memory cache
│   │   └── server.js
│   ├── check-tmdb.js               # Connectivity diagnostic
│   └── .env.example
├── frontend/
│   ├── src/ (App.jsx, api/)
│   └── vite / tailwind / postcss configs
└── tools/cloudflare-worker.js      # Optional free TMDB proxy
```

## Prerequisites

- Node.js 18+
- A TMDB account with an **API Read Access Token** (TMDB → Settings → API → *API Read Access Token*, the long one, not the short v3 key)
- MongoDB Atlas or local MongoDB (optional)

## Setup

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env      # then edit .env
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

### Backend `.env`

| Variable | Required | Description |
|---|---|---|
| `TMDB_ACCESS_TOKEN` | yes | TMDB API Read Access Token (Bearer) |
| `MONGODB_URI` | no | MongoDB connection string. Without it, the wishlist uses browser localStorage |
| `PORT` | no | Defaults to `5000` |
| `CLIENT_URL` | no | Frontend URL, default `http://localhost:5173` |
| `TMDB_BASE_URL` | no | Override TMDB URL (for a proxy/mirror) |
| `TMDB_PROXY` | no | HTTP proxy, e.g. `http://127.0.0.1:8080` |

### Frontend `.env` (optional)

```
VITE_API_BASE_URL=http://localhost:5000/api
```

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/movies?query=&genre=&sort=&page=` | List/search movies. `genre`: Action, Adventure, Animation, Comedy, Crime, Drama, Sci-Fi, Thriller. `sort`: `popularity`, `rating`, `newest` (sort/genre apply when not searching by text, except genre which filters results) |
| GET | `/api/movies/:id` | Movie details, including `trailerKey` (YouTube video ID or `null`) |
| GET | `/api/wishlist` | Get wishlist (user identified by `x-user-id` header) |
| POST | `/api/wishlist` | Add a movie |
| DELETE | `/api/wishlist/:movieId` | Remove a movie |

## Troubleshooting

### `Cannot reach TMDB (ECONNRESET / ETIMEDOUT / ENOTFOUND)`

Some ISPs (notably in India) block `api.themoviedb.org`. The backend already forces IPv4 and retries 3 times, but if it still fails:

1. Run the diagnostic: `cd backend && node check-tmdb.js`
2. Fixes, in order of reliability:
   - Turn on a **VPN** (e.g. Cloudflare WARP), restart the backend
   - Set system DNS to **1.1.1.1 / 8.8.8.8**
   - Deploy `tools/cloudflare-worker.js` as a free Cloudflare Worker and set `TMDB_BASE_URL=https://YOUR-WORKER.workers.dev/3`
3. Posters load from `image.tmdb.org` directly in your browser; if TMDB is blocked, images may need the VPN too.

### `TMDB rejected the access token (401)`
Use the **API Read Access Token**, not the v3 API key.

### `TMDB_ACCESS_TOKEN is missing`
Create `backend/.env` from `.env.example` and restart the backend.

### Wishlist doesn't sync across devices
Without MongoDB it's stored per-browser. Set `MONGODB_URI` for server-side storage.

### Page looks unstyled
Make sure `tailwind.config.js` and `postcss.config.js` exist in `frontend/` and you ran `npm install` there.

## Security notes

- Never commit `backend/.env`. Add it to `.gitignore`.
- If a token or database password has been shared, rotate it.
- Users are identified by a random ID in localStorage, not real authentication.

## Ideas for next steps

Trailers, "similar movies", real user accounts, infinite scroll, deployment (Render/Railway + Vercel).

## Credits

This product uses the TMDB API but is not endorsed or certified by TMDB.
