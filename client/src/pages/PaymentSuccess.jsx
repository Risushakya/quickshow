import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { CheckCircleIcon } from 'lucide-react'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'
import { useAuth } from '@clerk/react'

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { baseURL, currency } = useAppContext()
  const { getToken } = useAuth()

  const [booking, setBooking] = useState(null)

  useEffect(() => {
    const bookingId = searchParams.get('bookingId')
    if (!bookingId) return

    // Poll briefly in case the webhook hasn't fired yet
    let tries = 0
    const interval = setInterval(async () => {
      try {
        const token = await getToken()
        const { data } = await axios.get(`${baseURL}/api/booking/user`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const found = data.bookings?.find((b) => b._id === bookingId)
        if (found?.isPaid) {
          setBooking(found)
          clearInterval(interval)
        }
      } catch {}
      if (++tries >= 6) clearInterval(interval)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <BlurCircle top="100px" left="100px" />
      <BlurCircle bottom="100px" right="100px" />
      <CheckCircleIcon className="w-20 h-20 text-green-400 mb-6" strokeWidth={1.5} />
      <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
      <p className="text-gray-400 mb-8">Your tickets are confirmed. Enjoy the movie!</p>

      {booking && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 max-w-sm w-full text-left mb-8">
          <p className="font-semibold text-lg">{booking.show?.movie?.title}</p>
          {booking.show?.theater?.name && (
            <p className="text-gray-400 text-sm mt-1">{booking.show.theater.name}, {booking.show.theater.city}</p>
          )}
          <p className="text-gray-400 text-sm mt-1">Seats: {booking.bookedSeats?.join(', ')}</p>
          <p className="text-gray-400 text-sm mt-1">Amount: {currency}{booking.amount}</p>
          <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">Paid</span>
        </div>
      )}

      <button
        onClick={() => { navigate('/my-bookings'); scrollTo(0, 0) }}
        className="px-8 py-3 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
      >
        View My Bookings
      </button>
    </div>
  )
}

export default PaymentSuccess
