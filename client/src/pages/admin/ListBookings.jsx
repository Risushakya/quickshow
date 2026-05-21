import { useEffect, useState } from 'react'
import axios from 'axios'
import Title from '../../components/admin/Title'
import Loading from '../../components/Loading'
import { dateFormat } from '../../lib/dateFormat'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import { useAppContext } from '../../context/AppContext'

const ListBookings = () => {
  const { currency, baseURL } = useAppContext()
  const { getToken } = useAuth()

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAllBookings = async () => {
      try {
        const token = await getToken()
        const { data } = await axios.get(`${baseURL}/api/booking/admin/all`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (data.success) setBookings(data.bookings)
      } catch (e) {
        toast.error('Failed to load bookings')
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAllBookings()
  }, [])

  return !isLoading ? (
    <>
      <Title text1="List" text2="Bookings " />
      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">User Name</th>
              <th className="p-2 font-medium">Movie Name</th>
              <th className="p-2 font-medium">Show Time</th>
              <th className="p-2 font-medium">Seats</th>
              <th className="p-2 font-medium">Amount</th>
              <th className="p-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {bookings.map((item, index) => (
              <tr key={index} className="border-b border-primary/20 bg-primary/5 even:bg-primary/10">
                <td className="p-2 min-w-45 pl-5">{item.user?.name}</td>
                <td className="p-2">{item.show?.movie?.title}</td>
                <td className="p-2">{dateFormat(item.show?.showDateTime)}</td>
                <td className="p-2">{item.bookedSeats.join(', ')}</td>
                <td className="p-2">{currency}{item.amount}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${item.isPaid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {item.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && (
          <p className="text-gray-400 text-sm mt-4">No bookings found.</p>
        )}
      </div>
    </>
  ) : <Loading />
}

export default ListBookings
