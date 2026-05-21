import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import BlurCircle from '../components/BlurCircle'
import { Heart, PlayCircleIcon, StarIcon, XIcon } from 'lucide-react'
import timeFormat from '../lib/timeFormat'
import DateSelect from '../components/DateSelect'
import MovieCard from '../components/MovieCard'
import Loading from '../components/Loading'
import toast from 'react-hot-toast'
import { useAuth, useUser } from '@clerk/react'
import { useAppContext } from '../context/AppContext'

const MovieDetails = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getToken } = useAuth()
  const { user } = useUser()
  const { shows, baseURL, currency } = useAppContext()

  const [show, setShow] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [trailerKey, setTrailerKey] = useState(null)
  const [showTrailer, setShowTrailer] = useState(false)

  useEffect(() => {
    const fetchShow = async () => {
      try {
        const { data } = await axios.get(`${baseURL}/api/show/${id}`)
        if (data.success) setShow(data)
      } catch (e) {
        console.error(e)
        toast.error('Failed to load movie details')
      }
    }
    fetchShow()
  }, [id])

  // Fetch trailer key for this specific movie
  useEffect(() => {
    const fetchTrailer = async () => {
      try {
        const { data } = await axios.get(`${baseURL}/api/show/trailer/${id}`)
        if (data.success && data.key) setTrailerKey(data.key)
      } catch { /* no trailer available */ }
    }
    fetchTrailer()
  }, [id])

  useEffect(() => {
    const fetchFav = async () => {
      if (!user) return
      try {
        const token = await getToken()
        const { data } = await axios.get(`${baseURL}/api/user/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (data.success) setIsFavorite(data.favorites.includes(Number(id)))
      } catch (e) {
        console.error(e)
      }
    }
    fetchFav()
  }, [user?.id, id])

  // Close trailer modal on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowTrailer(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleFavorite = async () => {
    if (!user) return toast('Please login to add favorites')
    try {
      const token = await getToken()
      const { data } = await axios.post(
        `${baseURL}/api/user/favorites`,
        { movieId: Number(id) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        setIsFavorite(data.isFavorite)
        toast.success(data.isFavorite ? 'Added to favorites' : 'Removed from favorites')
      }
    } catch (e) {
      toast.error('Could not update favorites')
    }
  }

  return show ? (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">

      {/* Trailer Modal */}
      {showTrailer && trailerKey && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={() => setShowTrailer(false)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute -top-10 right-0 text-white hover:text-primary transition cursor-pointer"
            >
              <XIcon className="w-7 h-7" />
            </button>
            <div className="w-full aspect-video rounded-xl overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                title="Movie Trailer"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      <div className='flex flex-col md:flex-row gap-8 max-w-6xl mx-auto'>
        <img
          src={show.movie.poster_path}
          alt={show.movie.title}
          className='max-md:mx-auto rounded-xl h-104 max-w-70 object-cover'
        />

        <div className='relative flex flex-col gap-3'>
          <BlurCircle top="-100px" left="-100px" />
          <p className='text-primary'>{show.movie.original_language?.toUpperCase() || 'ENGLISH'}</p>
          <h1 className='text-4xl font-semibold max-w-96 text-balance'>
            {show.movie.title}
          </h1>

          <div className='flex items-center gap-2 text-gray-300'>
            <StarIcon className='w-5 h-5 text-primary fill-primary' />
            {show.movie.vote_average.toFixed(1)} User Rating
          </div>

          <p className='text-gray-400 mt-2 text-sm leading-tight max-w-xl'>
            {show.movie.overview}
          </p>

          <p>
            {timeFormat(show.movie.runtime)} |{' '}
            {show.movie.genres.map((g) => g.name).join(', ')} |{' '}
            {show.movie.release_date.split('-')[0]}
          </p>

          <div className='flex items-center flex-wrap gap-4 mt-4'>
            <button
              onClick={() => trailerKey ? setShowTrailer(true) : toast('No trailer available')}
              className='flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium cursor-pointer active:scale-95'
            >
              <PlayCircleIcon className="w-5 h-5" />
              Watch Trailer
            </button>
            <a
              href="#dateSelect"
              className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95'
            >
              Buy Tickets
            </a>
            <button
              onClick={handleFavorite}
              className='bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95 hover:bg-gray-600'
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <p className='text-lg font-medium mt-20'>Your Favorite Cast</p>
      <div className='overflow-x-auto no-scrollbar mt-8 pb-4'>
        <div className='flex items-center gap-4 w-max px-4'>
          {show.movie.casts.slice(0, 10).map((cast, index) => (
            <div key={index} className='flex flex-col items-center text-center'>
              <img
                src={cast.profile_path || 'https://placehold.co/80x80/1a1a2e/ffffff?text=?'}
                alt={cast.name}
                onError={(e) => { e.target.src = 'https://placehold.co/80x80/1a1a2e/ffffff?text=?' }}
                className='rounded-full h-20 aspect-square object-cover'
              />
              <p className='font-medium text-xs mt-3'>{cast.name}</p>
            </div>
          ))}
        </div>
      </div>

      {Object.keys(show.dateTime).length > 0 ? (
        <DateSelect dateTime={show.dateTime} id={id} />
      ) : (
        <div id="dateSelect" className="pt-30">
          <div className='flex items-center justify-center p-8 bg-primary/10 border border-primary/20 rounded-lg'>
            <p className='text-gray-400 text-lg'>No shows scheduled for this movie yet.</p>
          </div>
        </div>
      )}

      <p className='text-lg font-medium mt-20 mb-8'>You May Also Like</p>
      <div className='flex flex-wrap max-sm:justify-center gap-8'>
        {shows.slice(0, 3).map((movie, index) => (
          <MovieCard movie={movie} key={index} />
        ))}
      </div>

      <div className='flex justify-center mt-20'>
        <button
          className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer'
          onClick={() => { navigate('/movies'); scrollTo(0, 0) }}
        >
          Show More
        </button>
      </div>
    </div>
  ) : <Loading />
}

export default MovieDetails
