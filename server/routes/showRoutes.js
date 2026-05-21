import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import {
  getShows,
  getShowsByMovie,
  getNowPlayingMovies,
  searchMovies,
  addShow,
  getAllShows,
  deleteShow,
  deleteAllShows,
  getTrailers,
  getMovieTrailer,
} from '../controllers/showController.js';
import { adminOnly } from '../middlewares/authMiddleware.js';

const router = Router();

// Admin routes — registered before /:movieId to prevent shadowing
router.get('/admin/now-playing', requireAuth(), adminOnly, getNowPlayingMovies);
router.get('/admin/search', requireAuth(), adminOnly, searchMovies);
router.get('/admin/all', requireAuth(), adminOnly, getAllShows);
router.post('/admin/add', requireAuth(), adminOnly, addShow);
router.delete('/admin/all', requireAuth(), adminOnly, deleteAllShows);
router.delete('/admin/:id', requireAuth(), adminOnly, deleteShow);

// Public routes — static paths before /:movieId to avoid shadowing
router.get('/trailers', getTrailers);
router.get('/trailer/:movieId', getMovieTrailer);
router.get('/', getShows);
router.get('/:movieId', getShowsByMovie);

export default router;
