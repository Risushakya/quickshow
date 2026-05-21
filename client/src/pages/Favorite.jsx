import { useEffect, useState } from 'react'
import axios from 'axios'
import BlurCircle from '../components/BlurCircle'
import MovieCard from '../components/MovieCard'
import Loading from '../components/Loading'
import toast from 'react-hot-toast'
import { useAuth, useUser } from '@clerk/react'
import { useAppContext } from '../context/AppContext'

const Favorite = () => {
  const { shows, baseURL } = useAppContext()
  const { user } = useUser()
  const { getToken } = useAuth()

  const [favoriteMovies, setFavoriteMovies] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }
      try {
        const token = await getToken()
        const { data } = await axios.get(`${baseURL}/api/user/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (data.success) {
          const favIds = data.favorites
          const favMovies = shows.filter((m) => favIds.includes(Number(m._id)))
          setFavoriteMovies(favMovies)
        }
      } catch (e) {
        toast.error('Failed to load favorites')
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchFavorites()
  }, [user?.id, shows])

  if (isLoading) return <Loading />

  if (!user) {
    return (
      <div className='flex flex-col items-center justify-center h-screen'>
        <h1 className='text-2xl font-bold text-center'>Please login to view your favorites</h1>
      </div>
    )
  }

  return favoriteMovies.length > 0 ? (
    <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />
      <h1 className='text-lg font-medium my-4'>Your Favorite Movies</h1>
      <div className='flex flex-wrap max-sm:justify-center gap-8'>
        {favoriteMovies.map((movie) => (
          <MovieCard movie={movie} key={movie._id} />
        ))}
      </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='text-3xl font-bold text-center'>No favorites yet</h1>
      <p className='text-gray-400 mt-2'>Click the heart icon on any movie to add it here.</p>
    </div>
  )
}

export default Favorite
