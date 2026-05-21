import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, PlayCircleIcon, XIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAppContext } from '../context/AppContext'
import timeFormat from '../lib/timeFormat'

const HeroSection = () => {
  const navigate = useNavigate()
  const { shows, baseURL } = useAppContext()

  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [trailerKey, setTrailerKey] = useState(null)
  const [trailerLoading, setTrailerLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const slides = shows.slice(0, 8)

  const intervalRef = useRef(null)
  const pauseRef = useRef(false)

  const startAutoSlide = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      if (pauseRef.current) return
      setAnimating(true)
      setTimeout(() => {
        setCurrent((c) => (c + 1) % slides.length)
        setTrailerKey(null)
        setAnimating(false)
      }, 400)
    }, 2000)
  }, [slides.length])

  // Manual navigation — pauses auto-slide for 5 s then resumes
  const goTo = (index, manual = false) => {
    if (animating || index === current) return
    setAnimating(true)
    setShowModal(false)
    setTimeout(() => {
      setCurrent(index)
      setTrailerKey(null)
      setAnimating(false)
    }, 400)

    if (manual) {
      pauseRef.current = true
      clearInterval(intervalRef.current)
      clearTimeout(intervalRef.resumeTimeout)
      intervalRef.resumeTimeout = setTimeout(() => {
        pauseRef.current = false
        startAutoSlide()
      }, 5000)
    }
  }

  const prev = () => goTo((current - 1 + slides.length) % slides.length, true)
  const next = () => goTo((current + 1) % slides.length, true)

  // Start auto-slide; pause when modal is open
  useEffect(() => {
    if (slides.length <= 1 || showModal) {
      clearInterval(intervalRef.current)
      return
    }
    if (!pauseRef.current) startAutoSlide()
    return () => clearInterval(intervalRef.current)
  }, [slides.length, showModal, startAutoSlide])

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowModal(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleWatchTrailer = async () => {
    const movie = slides[current]
    if (!movie) return

    if (trailerKey) {
      setShowModal(true)
      return
    }

    setTrailerLoading(true)
    try {
      const { data } = await axios.get(`${baseURL}/api/show/trailer/${movie._id}`)
      if (data.success && data.key) {
        setTrailerKey(data.key)
        setShowModal(true)
      } else {
        // no trailer from API — show a toast-like inline message
        setTrailerKey('NOT_FOUND')
      }
    } catch {
      setTrailerKey('NOT_FOUND')
    } finally {
      setTrailerLoading(false)
    }
  }

  if (!slides.length) {
    return (
      <div className='flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-[url("/backgroundImage.png")] bg-cover bg-center h-screen'>
        <h1 className='text-5xl md:text-[70px] md:leading-18 font-semibold max-w-110'>
          Book Movie<br /> Tickets
        </h1>
        <button
          onClick={() => navigate('/movies')}
          className='flex items-center gap-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'
        >
          Explore Movies
          <ArrowRight className='w-5 h-5' />
        </button>
      </div>
    )
  }

  const movie = slides[current]

  return (
    <>
      {/* Trailer modal */}
      {showModal && trailerKey && trailerKey !== 'NOT_FOUND' && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4'
          onClick={() => setShowModal(false)}
        >
          <div
            className='relative w-full max-w-4xl'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className='absolute -top-10 right-0 text-white hover:text-primary transition cursor-pointer'
            >
              <XIcon className='w-7 h-7' />
            </button>
            <div className='w-full aspect-video rounded-xl overflow-hidden'>
              <iframe
                key={trailerKey}
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                title={`${movie.title} Trailer`}
                allow='autoplay; encrypted-media; fullscreen'
                allowFullScreen
                className='w-full h-full'
              />
            </div>
          </div>
        </div>
      )}

      <div className='relative h-screen overflow-hidden'>

        {/* Background slides */}
        {slides.map((m, i) => (
          <div
            key={m._id}
            className='absolute inset-0 bg-cover bg-center transition-opacity duration-700'
            style={{
              backgroundImage: `url(${m.backdrop_path})`,
              opacity: i === current ? 1 : 0,
            }}
          />
        ))}
        {/* Overlay: full dark on mobile, side-gradient on desktop */}
        <div className='absolute inset-0 bg-black/70 md:bg-gradient-to-r md:from-black/90 md:via-black/70 md:to-black/20' />

        {/* Content */}
        <div
          className={`relative z-10 flex flex-col items-start justify-center gap-3 md:gap-4 h-full px-6 md:px-16 lg:px-36 pb-16 transition-opacity duration-400 ${animating ? 'opacity-0' : 'opacity-100'}`}
        >
          <p className='text-primary font-medium uppercase tracking-widest text-xs sm:text-sm'>Now Showing</p>

          <h1 className='text-3xl sm:text-5xl md:text-[70px] md:leading-18 font-semibold max-w-full md:max-w-110'>
            {movie.title}
          </h1>

          <div className='flex items-center gap-3 text-gray-300 flex-wrap text-xs sm:text-sm'>
            <span>{movie.genres.slice(0, 3).map(g => g.name).join(' | ')}</span>
            <div className='flex items-center gap-1'>
              <CalendarIcon className='w-4 h-4' />
              {movie.release_date?.split('-')[0]}
            </div>
            {movie.runtime > 0 && (
              <div className='flex items-center gap-1'>
                <ClockIcon className='w-4 h-4' />
                {timeFormat(movie.runtime)}
              </div>
            )}
          </div>

          <p className='hidden sm:block max-w-md text-gray-300 text-sm line-clamp-3'>{movie.overview}</p>

          <div className='flex items-center gap-3 flex-wrap mt-1'>
            <button
              onClick={() => { navigate(`/movies/${movie._id}`); scrollTo(0, 0) }}
              className='flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'
            >
              Book Tickets
              <ArrowRight className='w-4 h-4' />
            </button>

            <button
              onClick={handleWatchTrailer}
              disabled={trailerLoading}
              className='flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 text-sm bg-white/10 hover:bg-white/20 border border-white/20 transition rounded-full font-medium cursor-pointer backdrop-blur-sm disabled:opacity-60'
            >
              <PlayCircleIcon className='w-4 h-4' />
              {trailerLoading ? 'Loading...' : 'Watch Trailer'}
            </button>
          </div>

          {trailerKey === 'NOT_FOUND' && (
            <p className='text-gray-400 text-sm -mt-1'>No trailer available for this movie.</p>
          )}
        </div>

        {/* Prev / Next arrows */}
        <button
          onClick={prev}
          className='absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-primary/70 transition p-2 rounded-full cursor-pointer'
        >
          <ChevronLeftIcon className='w-6 h-6' />
        </button>
        <button
          onClick={next}
          className='absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-primary/70 transition p-2 rounded-full cursor-pointer'
        >
          <ChevronRightIcon className='w-6 h-6' />
        </button>

        {/* Dot indicators */}
        <div className='absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2'>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer
                ${i === current ? 'bg-primary w-6' : 'bg-white/40 w-1.5 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </div>
    </>
  )
}

export default HeroSection
