import { useEffect, useState } from 'react'
import axios from 'axios'
import Loading from '../../components/Loading'
import Title from '../../components/admin/Title'
import { dateFormat } from '../../lib/dateFormat'
import toast from 'react-hot-toast'
import { Trash2Icon, MapPinIcon, Trash2 } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { useAppContext } from '../../context/AppContext'

const ListShows = () => {
  const { currency, baseURL, fetchShows } = useAppContext()
  const { getToken } = useAuth()

  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAllShows = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${baseURL}/api/show/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) setShows(data.shows)
    } catch (e) {
      toast.error('Failed to load shows')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (showId) => {
    if (!confirm('Delete this show?')) return
    try {
      const token = await getToken()
      const { data } = await axios.delete(`${baseURL}/api/show/admin/${showId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        toast.success('Show deleted')
        fetchAllShows()
        fetchShows()
      }
    } catch {
      toast.error('Failed to delete show')
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Delete ALL shows? This cannot be undone.')) return
    try {
      const token = await getToken()
      const { data } = await axios.delete(`${baseURL}/api/show/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        toast.success(`Deleted ${data.deleted} show(s)`)
        fetchAllShows()
        fetchShows()
      }
    } catch {
      toast.error('Failed to delete all shows')
    }
  }

  useEffect(() => { fetchAllShows() }, [])

  // Group shows by theater
  const grouped = shows.reduce((acc, show) => {
    const key = show.theater?._id?.toString() || 'unassigned'
    if (!acc[key]) {
      acc[key] = {
        theater: show.theater || { name: 'Unassigned', city: '', address: '' },
        shows: [],
      }
    }
    acc[key].shows.push(show)
    return acc
  }, {})

  // Sort each theater's shows by date ascending
  Object.values(grouped).forEach((g) => {
    g.shows.sort((a, b) => new Date(a.showDateTime) - new Date(b.showDateTime))
  })

  if (loading) return <Loading />

  return (
    <>
      <div className="flex items-center justify-between max-w-4xl">
        <Title text1="List" text2="Shows" />
        {shows.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete All
          </button>
        )}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-gray-400 text-sm mt-6">No shows found. Add some from Add Shows.</p>
      ) : (
        <div className="mt-6 space-y-10 max-w-4xl">
          {Object.values(grouped).map((group) => (
            <div key={group.theater._id || 'unassigned'}>

              {/* Theater header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                  <MapPinIcon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{group.theater.name}</p>
                  {group.theater.city && (
                    <p className="text-xs text-gray-400">{group.theater.city}{group.theater.address ? ` — ${group.theater.address}` : ''}</p>
                  )}
                </div>
                <span className="ml-auto text-xs text-gray-500 bg-primary/10 px-2 py-0.5 rounded-full">
                  {group.shows.length} show{group.shows.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Shows table */}
              <div className="overflow-x-auto rounded-lg border border-primary/20">
                <table className="w-full border-collapse text-nowrap text-sm">
                  <thead>
                    <tr className="bg-primary/20 text-left text-white">
                      <th className="p-2 pl-4 font-medium">Movie</th>
                      <th className="p-2 font-medium">Date & Time</th>
                      <th className="p-2 font-medium">Price</th>
                      <th className="p-2 font-medium">Bookings</th>
                      <th className="p-2 font-medium">Earnings</th>
                      <th className="p-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="font-light">
                    {group.shows.map((show, i) => {
                      const booked = Object.keys(show.occupiedSeats).length
                      return (
                        <tr
                          key={show._id}
                          className={`border-b border-primary/10 ${i % 2 === 0 ? 'bg-primary/5' : 'bg-primary/10'}`}
                        >
                          <td className="p-2 pl-4 font-medium">{show.movie.title}</td>
                          <td className="p-2 text-gray-300">{dateFormat(show.showDateTime)}</td>
                          <td className="p-2 text-gray-300">{currency}{show.showPrice}</td>
                          <td className="p-2 text-gray-300">{booked}</td>
                          <td className="p-2 text-gray-300">{currency}{booked * show.showPrice}</td>
                          <td className="p-2">
                            <button
                              onClick={() => handleDelete(show._id)}
                              className="text-red-400 hover:text-red-500 transition cursor-pointer"
                            >
                              <Trash2Icon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default ListShows
