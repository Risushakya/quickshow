import axios from 'axios';
import Show from '../models/Show.js';
import Theater from '../models/Theater.js';

const tmdb = axios.create({ baseURL: 'https://api.themoviedb.org/3' });
tmdb.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${process.env.TMDB_ACCESS_TOKEN}`;
  return config;
});

const tmdbImg = (path) =>
  path ? `https://image.tmdb.org/t/p/original${path}` : '';

const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
  878: 'Science Fiction', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
};

// Build dateTime map from a list of Show documents
const buildDateTimeMap = (shows) => {
  const dateTime = {};
  for (const show of shows) {
    const date = show.showDateTime.toISOString().split('T')[0];
    if (!dateTime[date]) dateTime[date] = [];
    dateTime[date].push({
      time: show.showDateTime.toISOString(),
      showId: show._id.toString(),
      showPrice: show.showPrice,
      occupiedSeats: Object.fromEntries(show.occupiedSeats),
      theater: show.theater || null,
    });
  }
  return dateTime;
};

// Auto-create default shows for a movie for the next 7 days
const autoCreateShows = async (movieData) => {
  const showTimes = [10, 13, 16, 19]; // hours
  const defaultPrice = 150;

  // Use the first theater in DB, or create a default one if none exist
  let theater = await Theater.findOne();
  if (!theater) {
    theater = await Theater.create({
      name: 'Quickshow Cinema',
      city: 'Mumbai',
      address: '1 Main Street, Mumbai',
    });
  }
  const theaterEmbed = { _id: theater._id, name: theater.name, city: theater.city, address: theater.address };

  const docs = [];
  for (let day = 1; day <= 7; day++) {
    for (const hour of showTimes) {
      const dt = new Date();
      dt.setDate(dt.getDate() + day);
      dt.setHours(hour, 0, 0, 0);
      docs.push({ movie: movieData, theater: theaterEmbed, showDateTime: dt, showPrice: defaultPrice });
    }
  }
  return Show.insertMany(docs);
};

// ─── Public endpoints ──────────────────────────────────────────────────────────

// GET /api/show  →  unique movies that have at least one upcoming show in DB (admin-added only)
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } }).lean();

    const movieMap = new Map();
    for (const show of shows) {
      if (!movieMap.has(show.movie.id)) {
        movieMap.set(show.movie.id, { ...show.movie, _id: String(show.movie.id) });
      }
    }

    res.json({ success: true, shows: [...movieMap.values()] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/show/trailer/:movieId  →  single trailer key for a specific movie
export const getMovieTrailer = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { data } = await tmdb.get(`/movie/${movieId}/videos`);
    const trailer = data.results.find((v) => v.type === 'Trailer' && v.site === 'YouTube');
    if (trailer) {
      res.json({ success: true, key: trailer.key });
    } else {
      res.json({ success: false, key: null });
    }
  } catch (error) {
    res.json({ success: false, key: null });
  }
};

// GET /api/show/trailers  →  YouTube trailers for now-playing movies
export const getTrailers = async (req, res) => {
  try {
    const { data: nowPlaying } = await tmdb.get('/movie/now_playing?language=en-US&page=1');
    const ids = nowPlaying.results.slice(0, 8).map((m) => m.id);

    const results = await Promise.all(
      ids.map((id) =>
        tmdb.get(`/movie/${id}/videos`).then(({ data }) => {
          const trailer = data.results.find(
            (v) => v.type === 'Trailer' && v.site === 'YouTube'
          );
          return trailer
            ? {
                movieId: id,
                videoUrl: `https://www.youtube.com/watch?v=${trailer.key}`,
                image: `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`,
              }
            : null;
        }).catch(() => null)
      )
    );

    res.json({ success: true, trailers: results.filter(Boolean) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/show/:movieId  →  Full movie + auto-seeded shows for booking
export const getShowsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const numericId = Number(movieId);

    // ── 1. Try to get movie details from TMDB ───────────────────────────────
    let movieDataForDB = null;
    let movieForResponse = null;

    try {
      const { data: m } = await tmdb.get(
        `/movie/${numericId}?append_to_response=credits`
      );
      movieDataForDB = {
        id: m.id,
        title: m.title,
        overview: m.overview || '',
        poster_path: tmdbImg(m.poster_path),
        backdrop_path: tmdbImg(m.backdrop_path),
        genres: m.genres || [],
        casts: (m.credits?.cast || []).slice(0, 17).map((c) => ({
          name: c.name,
          profile_path: tmdbImg(c.profile_path),
        })),
        release_date: m.release_date || '',
        original_language: m.original_language || '',
        tagline: m.tagline || '',
        vote_average: m.vote_average || 0,
        vote_count: m.vote_count || 0,
        runtime: m.runtime || 0,
      };
      movieForResponse = { ...movieDataForDB, _id: String(m.id) };
    } catch (_) {
      // TMDB failed — fall back to data cached in existing Show documents
    }

    // ── 2. Fetch existing DB shows for this movie ───────────────────────────
    let shows = await Show.find({
      'movie.id': numericId,
      showDateTime: { $gte: new Date() },
    }).sort({ showDateTime: 1 });

    // ── 3. If TMDB failed, use movie data from existing show ────────────────
    if (!movieForResponse && shows.length > 0) {
      const cached = shows[0].toObject().movie;
      movieForResponse = { ...cached, _id: String(cached.id) };
      movieDataForDB = cached;
    }

    if (!movieForResponse) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    res.json({ success: true, movie: movieForResponse, dateTime: buildDateTimeMap(shows) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin endpoints ──────────────────────────────────────────────────────────

// GET /api/show/admin/now-playing
export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await tmdb.get('/movie/now_playing?language=en-US&page=1');
    res.json({ success: true, movies: data.results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/show/admin/search?q=query
export const searchMovies = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, movies: [] });
    const { data } = await tmdb.get(`/search/movie?query=${encodeURIComponent(q)}&language=en-US&page=1`);
    res.json({ success: true, movies: data.results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/show/admin/all
export const deleteAllShows = async (req, res) => {
  try {
    const result = await Show.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/show/admin/add
export const addShow = async (req, res) => {
  try {
    const { movieId, showPrice, dateTimes, theaterId } = req.body;

    if (!theaterId) {
      return res.status(400).json({ success: false, message: 'theaterId is required' });
    }

    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return res.status(404).json({ success: false, message: 'Theater not found' });
    }

    const { data: m } = await tmdb.get(
      `/movie/${movieId}?append_to_response=credits`
    );

    const movieData = {
      id: m.id,
      title: m.title,
      overview: m.overview || '',
      poster_path: tmdbImg(m.poster_path),
      backdrop_path: tmdbImg(m.backdrop_path),
      genres: m.genres || [],
      casts: (m.credits?.cast || []).slice(0, 17).map((c) => ({
        name: c.name,
        profile_path: tmdbImg(c.profile_path),
      })),
      release_date: m.release_date || '',
      original_language: m.original_language || '',
      tagline: m.tagline || '',
      vote_average: m.vote_average || 0,
      vote_count: m.vote_count || 0,
      runtime: m.runtime || 0,
    };

    const theaterEmbed = { _id: theater._id, name: theater.name, city: theater.city, address: theater.address };

    const shows = await Promise.all(
      dateTimes.map((dt) =>
        Show.create({
          movie: movieData,
          theater: theaterEmbed,
          showDateTime: new Date(dt),
          showPrice: Number(showPrice),
        })
      )
    );

    res.json({ success: true, shows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/show/admin/all
export const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find().sort({ showDateTime: -1 });
    const plain = shows.map((s) => ({
      ...s.toObject(),
      occupiedSeats: Object.fromEntries(s.occupiedSeats),
    }));
    res.json({ success: true, shows: plain });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/show/admin/:id
export const deleteShow = async (req, res) => {
  try {
    await Show.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Show deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
