import React, { useState, useEffect, useCallback } from 'react';
import { movieApi } from './api/movieApi';
import { wishlistApi } from './api/wishlistApi';
import { Search, Heart, Star, X, Film, Loader2 } from 'lucide-react';

const GENRES = ['All', 'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Drama', 'Sci-Fi', 'Thriller'];
const SORTS = [['popularity', 'Popular'], ['rating', 'Top rated'], ['newest', 'Newest']];

export default function App() {
  const [movies, setMovies] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [genre, setGenre] = useState('All');
  const [sort, setSort] = useState('popularity');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('browse');
  const [selected, setSelected] = useState(null);

  useEffect(() => { wishlistApi.getWishlist().then(setWishlist); }, []);
  useEffect(() => { const t = setTimeout(() => setDebounced(query), 400); return () => clearTimeout(t); }, [query]);

  const load = useCallback(async (pg, replace) => {
    setLoading(true); setError('');
    try {
      const d = await movieApi.getMovies({ query: debounced, genre: genre === 'All' ? undefined : genre, sort, page: pg });
      setMovies(prev => replace ? d.movies : [...prev, ...d.movies]);
      setHasMore(d.hasMore); setPage(pg);
    } catch (e) { setError(e.message); if (replace) setMovies([]); setHasMore(false); }
    finally { setLoading(false); }
  }, [debounced, genre, sort]);
  useEffect(() => { load(1, true); }, [load]);

  const inList = id => wishlist.some(i => i.movieId === id);
  const toggle = async m => {
    const id = m.id ?? m.movieId;
    if (inList(id)) { await wishlistApi.removeFromWishlist(id); setWishlist(p => p.filter(i => i.movieId !== id)); }
    else {
      const saved = await wishlistApi.addToWishlist({ movieId: id, title: m.title, poster: m.poster, releaseYear: m.releaseYear, rating: m.rating, genre: m.genre });
      setWishlist(p => [saved, ...p]);
    }
  };
  const open = async m => {
    const id = m.id ?? m.movieId;
    setSelected({ ...m, id, loading: true });
    try { setSelected({ ...(await movieApi.getMovieDetails(id)) }); } catch { setSelected({ ...m, id }); }
  };

  const Card = ({ m, id }) => (
    <div className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative hover:border-red-600 transition">
      <button onClick={() => open(m)} className="block w-full text-left">
        <img src={m.poster} alt={m.title} loading="lazy" className="w-full aspect-[2/3] object-cover" />
        <div className="p-3">
          <h3 className="font-bold truncate">{m.title}</h3>
          <div className="flex items-center justify-between text-sm text-slate-400 mt-1">
            <span>{m.releaseYear} · {m.genre}</span>
            {m.rating != null && <span className="flex items-center gap-1 text-yellow-400"><Star className="w-4 h-4 fill-yellow-400" />{m.rating}</span>}
          </div>
        </div>
      </button>
      <button onClick={() => toggle(m)} aria-label="Toggle wishlist" className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 p-2 rounded-full">
        <Heart className={`w-5 h-5 ${inList(id) ? 'text-red-500 fill-red-500' : 'text-white'}`} />
      </button>
    </div>
  );

  const list = tab === 'browse' ? movies : wishlist;
  return (
    <div className="min-h-screen w-full bg-slate-950 text-white">
      <header className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-black text-red-600 flex items-center gap-2"><Film /> CINEVERSE</h1>
          <div className="relative flex-1 min-w-[220px] max-w-lg">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={e => { setQuery(e.target.value); setTab('browse'); }} placeholder="Search movies..." className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2.5 rounded-xl outline-none focus:border-red-600" />
          </div>
          <nav className="flex gap-2 ml-auto">
            {[['browse', 'Browse'], ['wishlist', `Wishlist (${wishlist.length})`]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === k ? 'bg-red-600' : 'bg-slate-900 hover:bg-slate-800'}`}>{l}</button>
            ))}
          </nav>
        </div>
        {tab === 'browse' && (
          <div className="max-w-7xl mx-auto px-6 pb-3 flex flex-wrap items-center gap-2">
            {GENRES.map(g => <button key={g} onClick={() => setGenre(g)} className={`px-3 py-1 rounded-full text-sm ${genre === g ? 'bg-white text-black' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}>{g}</button>)}
            <select value={sort} onChange={e => setSort(e.target.value)} disabled={!!debounced} title={debounced ? 'Sorting applies when not searching' : ''} className="ml-auto bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm disabled:opacity-40">
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {error && tab === 'browse' && <div className="mb-6 p-4 rounded-xl bg-red-950 border border-red-800 text-red-200">{error}<button onClick={() => load(1, true)} className="ml-4 underline">Retry</button></div>}
        {tab === 'wishlist' && list.length === 0 && <p className="text-slate-400">Your wishlist is empty. Tap the heart on any movie to save it here.</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {list.map(m => <Card key={m.id ?? m.movieId} m={m} id={m.id ?? m.movieId} />)}
        </div>
        {tab === 'browse' && loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
        {tab === 'browse' && !loading && !error && movies.length === 0 && <p className="text-slate-400">No movies found.</p>}
        {tab === 'browse' && hasMore && !loading && <div className="flex justify-center mt-8"><button onClick={() => load(page + 1, false)} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-semibold">Load more</button></div>}
      </main>

      {selected && (
        <div className="fixed inset-0 z-20 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-3 right-3 z-10 bg-black/60 p-2 rounded-full"><X className="w-5 h-5" /></button>
            {selected.backdrop && <img src={selected.backdrop} alt="" className="w-full h-56 object-cover rounded-t-2xl" />}
            <div className="p-6 flex gap-6 flex-col sm:flex-row">
              <img src={selected.poster} alt={selected.title} className="w-40 rounded-lg self-start" />
              <div>
                <h2 className="text-2xl font-black">{selected.title}</h2>
                <p className="text-slate-400 mt-1">{selected.releaseYear} · {selected.genre}{selected.rating != null && ` · ★ ${selected.rating}`}</p>
                <p className="mt-4 text-slate-200 leading-relaxed">{selected.loading ? 'Loading…' : (selected.overview || 'No overview available.')}</p>
                <button onClick={() => toggle(selected)} className="mt-6 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 font-semibold flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${inList(selected.id) ? 'fill-white' : ''}`} />{inList(selected.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
