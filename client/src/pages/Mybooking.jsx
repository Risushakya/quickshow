import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Loading from '../components/Loading'
import BlurCircle from '../components/BlurCircle'
import timeFormat from '../lib/timeFormat'
import { dateFormat } from '../lib/dateFormat'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import { useAppContext } from '../context/AppContext'

const Mybooking = () => {
  const { currency, baseURL } = useAppContext()
  const { getToken } = useAuth()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchBookings = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${baseURL}/api/booking/user`, {
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

  const handlePayNow = (bookingId) => {
    navigate(`/payment/${bookingId}`)
  }

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking? Your seats will be released.')) return
    try {
      const token = await getToken()
      const { data } = await axios.delete(`${baseURL}/api/booking/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        toast.success('Booking cancelled and seats released.')
        fetchBookings()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to cancel booking')
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  return !isLoading ? (
    <div className='relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]'>
      <BlurCircle top="100px" left="100px" />
      <div>
        <BlurCircle bottom="0px" left="600px" />
      </div>
      <h1 className='text-lg font-semibold mb-4'>My Bookings</h1>

      {bookings.length === 0 ? (
        <p className='text-gray-400 mt-8'>No bookings yet.</p>
      ) : (
        bookings.map((item, index) => (
          <div
            key={index}
            className='flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl'
          >
            <div className='flex flex-col md:flex-row'>
              <img
                src={item.show?.movie?.poster_path}
                alt=""
                className='md:max-w-45 aspect-video h-auto object-cover object-bottom rounded'
              />
              <div className='flex flex-col p-4'>
                <p className='text-lg font-semibold'>{item.show?.movie?.title}</p>
                <p className='text-gray-400 text-sm'>{timeFormat(item.show?.movie?.runtime)}</p>
                {item.show?.theater?.name && (
                  <p className='text-gray-400 text-sm'>{item.show.theater.name}, {item.show.theater.city}</p>
                )}
                <p className='text-gray-400 text-sm mt-auto'>{dateFormat(item.show?.showDateTime)}</p>
              </div>
            </div>

            <div className='flex flex-col md:items-end md:text-right justify-between p-4'>
              <div className='flex items-center gap-4'>
                <p className='text-2xl font-semibold mb-3'>{currency}{item.amount}</p>
                {!item.isPaid && (
                  <div className='flex gap-2 mb-3'>
                    <button
                      onClick={() => handlePayNow(item._id)}
                      className="bg-primary px-4 py-1.5 text-sm rounded-full font-medium cursor-pointer hover:bg-primary-dull transition"
                    >
                      Pay Now
                    </button>
                    <button
                      onClick={() => handleCancel(item._id)}
                      className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-1.5 text-sm rounded-full font-medium cursor-pointer transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="text-sm">
                <p><span className="text-gray-400">Total Tickets:</span> {item.bookedSeats.length}</p>
                <p><span className="text-gray-400">Seat Number:</span> {item.bookedSeats.join(', ')}</p>
                <p>
                  <span className="text-gray-400">Status: </span>
                  <span className={item.isPaid ? 'text-green-400' : 'text-yellow-400'}>
                    {item.isPaid ? 'Paid' : 'Pending Payment'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  ) : <Loading />
}

export default Mybooking
