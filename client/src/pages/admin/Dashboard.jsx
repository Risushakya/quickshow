import { ChartLineIcon, IndianRupeeIcon, MapPinIcon, PlayCircleIcon, UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Loading from '../../components/Loading'
import BlurCircle from '../../components/BlurCircle'
import { dateFormat } from '../../lib/dateFormat'
import Title from '../../components/admin/Title'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import { useAppContext } from '../../context/AppContext'

const Dashboard = () => {
  const { currency, baseURL } = useAppContext()
  const { getToken } = useAuth()

  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeShows: [],
    totalUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  const dashboardCards = [
    { title: 'Total Bookings', value: dashboardData.totalBookings || '0', icon: ChartLineIcon },
    { title: 'Total Revenue', value: `${currency}${dashboardData.totalRevenue || 0}`, icon: IndianRupeeIcon },
    { title: 'Active Shows', value: dashboardData.activeShows.length || '0', icon: PlayCircleIcon },
    { title: 'Total Users', value: dashboardData.totalUsers || '0', icon: UserIcon },
  ]

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = await getToken()
        const { data } = await axios.get(`${baseURL}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (data.success) {
          setDashboardData({
            totalBookings: data.totalBookings,
            totalRevenue: data.totalRevenue,
            totalUsers: data.totalUsers,
            activeShows: data.activeShows,
          })
        }
      } catch (e) {
        toast.error('Failed to load dashboard')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  return !loading ? (
    <>
      <Title text1="Admin" text2="Dashboard " />

      <div className="relative flex flex-wrap gap-4 w-full">
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-4 py-3 bg-primary/10 border border-primary/20 rounded-md max-w-50 w-full"
          >
            <div>
              <h1 className="text-sm">{card.title}</h1>
              <p className="text-xl font-medium mt-1">{card.value}</p>
            </div>
            <card.icon className="w-6 h-6" />
          </div>
        ))}
      </div>

      <p className="mt-10 text-lg font-medium">Active Shows</p>

      <div className="relative mt-4 max-w-4xl space-y-8">
        <BlurCircle top="100px" left="-10%" />
        {(() => {
          // Group by theater
          const grouped = dashboardData.activeShows.reduce((acc, show) => {
            const key = show.theater?._id?.toString() || 'unassigned'
            if (!acc[key]) acc[key] = { theater: show.theater || { name: 'Unassigned', city: '' }, shows: [] }
            acc[key].shows.push(show)
            return acc
          }, {})

          if (Object.keys(grouped).length === 0) {
            return <p className="text-gray-400 text-sm">No upcoming shows.</p>
          }

          return Object.values(grouped).map((group) => (
            <div key={group.theater._id || 'unassigned'}>
              {/* Theater header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                  <MapPinIcon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{group.theater.name}</p>
                  {group.theater.city && <p className="text-xs text-gray-400">{group.theater.city}</p>}
                </div>
                <span className="ml-auto text-xs text-gray-500 bg-primary/10 px-2 py-0.5 rounded-full">
                  {group.shows.length} show{group.shows.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-primary/20">
                <table className="w-full border-collapse text-nowrap text-sm">
                  <thead>
                    <tr className="bg-primary/20 text-left text-white">
                      <th className="p-2 pl-4 font-medium">Movie</th>
                      <th className="p-2 font-medium">Date & Time</th>
                      <th className="p-2 font-medium">Price</th>
                      <th className="p-2 font-medium">Bookings</th>
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
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        })()}
      </div>
    </>
  ) : <Loading />
}

export default Dashboard
