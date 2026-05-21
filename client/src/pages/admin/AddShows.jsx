import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import Title from '../../components/admin/Title'
import Loading from '../../components/Loading'
import { CheckIcon, DeleteIcon, StarIcon, SearchIcon, XIcon } from 'lucide-react'
import { kConverter } from '../../lib/kConverter'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import { useAppContext } from '../../context/AppContext'

const MovieGrid = ({ movies, selectedMovie, onSelect, isPosterFullPath }) => (
  <div className="group flex flex-wrap gap-4 mt-4">
    {movies.map((movie) => (
      <div
        key={movie.id}
        className="relative w-36 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300"
        onClick={() => onSelect(movie.id)}
      >
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={
              movie.poster_path
                ? isPosterFullPath
                  ? movie.poster_path
                  : `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                : 'https://placehold.co/160x240?text=No+Poster'
            }
            alt={movie.title}
            className="w-full object-cover brightness-90"
          />
          <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
            <p className="flex items-center gap-1 text-gray-400">
              <StarIcon className="w-4 h-4 text-primary fill-primary" />
              {movie.vote_average?.toFixed(1) ?? '—'}
            </p>
            <p className="text-gray-300">{kConverter(movie.vote_count)} Votes</p>
          </div>
        </div>
        {selectedMovie === movie.id && (
          <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded">
            <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
        )}
        <p className="font-medium truncate mt-1">{movie.title}</p>
        <p className="text-gray-400 text-sm">{movie.release_date?.split('-')[0]}</p>
      </div>
    ))}
  </div>
)

const AddShows = () => {
  const { currency, baseURL, fetchShows, isLoaded } = useAppContext()
  const { getToken } = useAuth()

  const [nowPlayingMovies, setNowPlayingMovies] = useState([])
  const [theaters, setTheaters] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [selectedTheaters, setSelectedTheaters] = useState([])
  const [dateTimeSelection, setDateTimeSelection] = useState({})
  const [dateTimeInput, setDateTimeInput] = useState('')
  const [showPrice, setShowPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeout = useRef(null)

  useEffect(() => {
    if (!isLoaded) return
    let cancelled = false

    const attempt = async (retriesLeft = 4) => {
      try {
        const token = await getToken()
        if (!token) throw new Error('no token yet')
        const headers = { Authorization: `Bearer ${token}` }
        const [moviesRes, theatersRes] = await Promise.all([
          axios.get(`${baseURL}/api/show/admin/now-playing`, { headers }),
          axios.get(`${baseURL}/api/theater`, { headers }),
        ])
        if (cancelled) return
        if (moviesRes.data.success) setNowPlayingMovies(moviesRes.data.movies)
        if (theatersRes.data.success) setTheaters(theatersRes.data.theaters)
        setInitialLoading(false)
      } catch {
        if (cancelled) return
        if (retriesLeft > 0) {
          setTimeout(() => attempt(retriesLeft - 1), 700)
        } else {
          toast.error('Failed to load data')
          setInitialLoading(false)
        }
      }
    }

    attempt()
    return () => { cancelled = true }
  }, [isLoaded])

  // Debounced search
  const handleSearchChange = (e) => {
    const q = e.target.value
    setSearchQuery(q)
    setSelectedMovie(null)
    clearTimeout(searchTimeout.current)
    if (!q.trim()) { setSearchResults([]); return }
    setIsSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const token = await getToken()
        const { data } = await axios.get(
          `${baseURL}/api/show/admin/search?q=${encodeURIComponent(q.trim())}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (data.success) setSearchResults(data.movies)
      } catch {
        toast.error('Search failed')
      } finally {
        setIsSearching(false)
      }
    }, 400)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setSelectedMovie(null)
  }

  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return
    const [date, time] = dateTimeInput.split('T')
    if (!date || !time) return
    setDateTimeSelection((prev) => {
      const times = prev[date] || []
      if (!times.includes(time)) return { ...prev, [date]: [...times, time] }
      return prev
    })
  }

  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = prev[date].filter((t) => t !== time)
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [date]: filteredTimes }
    })
  }

  const toggleTheater = (id) => {
    setSelectedTheaters((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const handleAddShows = async () => {
    if (!selectedMovie) return toast('Please select a movie')
    if (selectedTheaters.length === 0) return toast('Please select at least one theater')
    if (!showPrice || Number(showPrice) <= 0) return toast('Please enter a valid price')
    if (Object.keys(dateTimeSelection).length === 0) return toast('Please add at least one date and time')

    const dateTimes = Object.entries(dateTimeSelection).flatMap(([date, times]) =>
      times.map((time) => new Date(`${date}T${time}`).toISOString())
    )

    setIsSubmitting(true)
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      await Promise.all(
        selectedTheaters.map((theaterId) =>
          axios.post(
            `${baseURL}/api/show/admin/add`,
            { movieId: selectedMovie, theaterId, showPrice: Number(showPrice), dateTimes },
            { headers }
          )
        )
      )
      toast.success(`Shows added to ${selectedTheaters.length} theater${selectedTheaters.length > 1 ? 's' : ''}!`)
      setSelectedMovie(null)
      setSelectedTheaters([])
      setShowPrice('')
      setDateTimeSelection({})
      setDateTimeInput('')
      clearSearch()
      fetchShows()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add shows')
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayedMovies = searchQuery.trim() ? searchResults : nowPlayingMovies
  const isSearchMode = !!searchQuery.trim()

  if (initialLoading) return <Loading />

  return (
    <>
      <Title text1="Add" text2="Shows" />

      {/* Theater selection */}
      <div className="mt-8">
        <p className="text-sm font-medium mb-3">Select Theater</p>
        {theaters.length === 0 ? (
          <p className="text-sm text-yellow-400">No theaters found. <a href="/admin/add-theater" className="underline">Add a theater first.</a></p>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              {theaters.map((t) => {
                const isSelected = selectedTheaters.includes(t._id)
                return (
                  <button
                    key={t._id}
                    onClick={() => toggleTheater(t._id)}
                    className={`px-4 py-2 rounded-lg border text-sm transition cursor-pointer
                      ${isSelected
                        ? 'bg-primary border-primary text-white'
                        : 'border-gray-600 hover:border-primary/60'
                      }`}
                  >
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs opacity-70">{t.city}</p>
                  </button>
                )
              })}
            </div>
            {selectedTheaters.length > 1 && (
              <p className="text-xs text-primary mt-2">{selectedTheaters.length} theaters selected — shows will be added to all of them</p>
            )}
          </>
        )}
      </div>

      {/* Movie selection */}
      <div className="mt-10">
        <p className="text-sm font-medium mb-3">Select Movie</p>

        {/* Search bar */}
        <div className="relative max-w-sm mb-5">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search any movie by name..."
            className="w-full bg-transparent border border-gray-600 rounded-lg pl-9 pr-9 py-2 text-sm outline-none focus:border-primary transition"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer">
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Label */}
        <p className="text-xs text-gray-500 mb-1">
          {isSearchMode
            ? isSearching
              ? 'Searching...'
              : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`
            : 'Now Playing'}
        </p>

        {/* Movie grid */}
        {isSearching ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm mt-4">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Searching...
          </div>
        ) : displayedMovies.length === 0 && isSearchMode ? (
          <p className="text-gray-400 text-sm mt-4">No movies found. Try a different name.</p>
        ) : (
          <MovieGrid
            movies={displayedMovies}
            selectedMovie={selectedMovie}
            onSelect={setSelectedMovie}
            isPosterFullPath={false}
          />
        )}
      </div>

      {/* Show Price */}
      <div className="mt-10">
        <label className="block text-sm font-medium mb-2">Show Price</label>
        <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md">
          <p className="text-gray-400 text-sm">{currency}</p>
          <input
            min={0}
            type="number"
            value={showPrice}
            onChange={(e) => setShowPrice(e.target.value)}
            placeholder="Enter Show Price"
            className="outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Date and Time Selection */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">Select Date and Time</label>
        <div className="inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg">
          <input
            type="datetime-local"
            value={dateTimeInput}
            onChange={(e) => setDateTimeInput(e.target.value)}
            className="outline-none rounded-md bg-transparent"
          />
          <button
            onClick={handleDateTimeAdd}
            className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer"
          >
            Add Time
          </button>
        </div>
      </div>

      {/* Selected Date Times */}
      {Object.keys(dateTimeSelection).length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium mb-2">Selected Date & Times</p>
          <ul className="space-y-3">
            {Object.entries(dateTimeSelection).map(([date, times]) => (
              <li key={date}>
                <div className="font-medium text-sm">{date}</div>
                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                  {times.map((time) => (
                    <div key={time} className="border border-primary px-2 py-1 flex items-center rounded">
                      <span>{time}</span>
                      <DeleteIcon
                        onClick={() => handleRemoveTime(date, time)}
                        width={15}
                        className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleAddShows}
        disabled={isSubmitting}
        className="bg-primary text-white px-8 py-2 mt-8 rounded hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-60"
      >
        {isSubmitting ? 'Adding...' : 'Add Shows'}
      </button>
    </>
  )
}

export default AddShows
