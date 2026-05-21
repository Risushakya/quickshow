import { useEffect, useState } from 'react'
import axios from 'axios'
import BlurCircle from './BlurCircle'
import { PlayCircleIcon } from 'lucide-react'
import { dummyTrailers } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

// Extract YouTube video ID from watch URL or embed URL
const getYouTubeId = (url) => {
  const m = url?.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m?.[1] || ''
}

const TrailerSection = () => {
  const { baseURL } = useAppContext()

  const [trailers, setTrailers] = useState(dummyTrailers)
  const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0])
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const fetchTrailers = async () => {
      try {
        const { data } = await axios.get(`${baseURL}/api/show/trailers`)
        if (data.success && data.trailers.length > 0) {
          setTrailers(data.trailers)
          setCurrentTrailer(data.trailers[0])
          setIsPlaying(false)
        }
      } catch {
        // keep dummyTrailers
      }
    }
    fetchTrailers()
  }, [baseURL])

  const handleSelect = (trailer) => {
    setCurrentTrailer(trailer)
    setIsPlaying(true)
  }

  const videoId = getYouTubeId(currentTrailer.videoUrl)

  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden'>
      <p className='text-gray-300 font-medium text-lg max-w-[960px] mx-auto'>Trailers</p>

      <div className="relative mt-6 max-w-[960px] mx-auto">
        <BlurCircle top='-100px' right='-100px' />

        {/* Main player */}
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
          {isPlaying && videoId ? (
            <iframe
              key={videoId}
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              title="Trailer"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <div
              className="relative w-full h-full cursor-pointer group"
              onClick={() => videoId && setIsPlaying(true)}
            >
              <img
                src={currentTrailer.image}
                alt="Trailer thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition" />
              <PlayCircleIcon
                strokeWidth={1.2}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-24 md:h-24 text-white drop-shadow-lg group-hover:scale-110 transition"
              />
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className='group grid grid-cols-4 gap-4 md:gap-6 mt-6 max-w-[960px] mx-auto'>
        {trailers.slice(0, 4).map((trailer) => {
          const isActive = currentTrailer.videoUrl === trailer.videoUrl
          return (
            <div
              key={trailer.videoUrl}
              onClick={() => handleSelect(trailer)}
              className={`relative cursor-pointer rounded-lg overflow-hidden aspect-video
                group-hover:not-hover:opacity-50 hover:-translate-y-1 duration-300 transition
                ${isActive ? 'ring-2 ring-primary' : ''}`}
            >
              <img
                src={trailer.image}
                alt="Trailer thumbnail"
                className='w-full h-full object-cover brightness-75'
              />
              <PlayCircleIcon
                strokeWidth={1.6}
                className='absolute top-1/2 left-1/2 w-7 h-7 md:w-10 md:h-10 -translate-x-1/2 -translate-y-1/2 text-white'
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TrailerSection
