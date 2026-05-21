import mongoose from "mongoose";

const showSchema = new mongoose.Schema({
  movie: {
    id: { type: Number, required: true },
    title: { type: String, required: true },
    overview: { type: String, default: '' },
    poster_path: { type: String, default: '' },
    backdrop_path: { type: String, default: '' },
    genres: [{ id: Number, name: String }],
    casts: [{ name: String, profile_path: String }],
    release_date: { type: String, default: '' },
    original_language: { type: String, default: '' },
    tagline: { type: String, default: '' },
    vote_average: { type: Number, default: 0 },
    vote_count: { type: Number, default: 0 },
    runtime: { type: Number, default: 0 },
  },
  theater: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater' },
    name: { type: String, default: '' },
    city: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  showDateTime: { type: Date, required: true },
  showPrice: { type: Number, required: true },
  occupiedSeats: { type: Map, of: String, default: {} },
}, { timestamps: true });

const Show = mongoose.model('Show', showSchema);
export default Show;
