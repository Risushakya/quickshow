import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@clerk/react'
import { useAppContext } from '../context/AppContext'
import Loading from '../components/Loading'
import BlurCircle from '../components/BlurCircle'
import { CalendarIcon, MapPinIcon, TicketIcon, ShieldCheckIcon } from 'lucide-react'
import { dateFormat } from '../lib/dateFormat'
import toast from 'react-hot-toast'

const Payment = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { baseURL, currency } = useAppContext()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = await getToken()
        const { data } = await axios.get(`${baseURL}/api/booking/user`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (data.success) {
          const found = data.bookings.find((b) => b._id === bookingId)
          if (!found) { toast.error('Booking not found'); navigate('/my-bookings'); return }
          if (found.isPaid) { navigate(`/payment-success?bookingId=${bookingId}`); return }
          setBooking(found)
        }
      } catch {
        toast.error('Failed to load booking')
        navigate('/my-bookings')
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [bookingId])

  const handlePay = async () => {
    setPaying(true)
    try {
      const token = await getToken()
      const { data } = await axios.put(
        `${baseURL}/api/booking/pay/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        navigate(`/payment-success?bookingId=${bookingId}`)
      }
    } catch {
      toast.error('Payment failed. Please try again.')
      setPaying(false)
    }
  }

  if (loading) return <Loading />

  const movie = booking?.show?.movie
  const theater = booking?.show?.theater

  return (
    <div className='relative min-h-screen flex items-center justify-center px-4 py-20'>
      <BlurCircle top='0px' left='0px' />
      <BlurCircle bottom='0px' right='0px' />

      <div className='relative z-10 w-full max-w-md'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 mb-4'>
            <TicketIcon className='w-7 h-7 text-primary' />
          </div>
          <h1 className='text-2xl font-bold'>Complete Your Booking</h1>
          <p className='text-gray-400 text-sm mt-1'>Review your order and confirm payment</p>
        </div>

        {/* Order Summary Card */}
        <div className='bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-4'>
          {/* Movie poster + title */}
          <div className='flex gap-4 p-5 border-b border-white/10'>
            <img
              src={movie?.poster_path}
              alt={movie?.title}
              className='w-16 h-24 object-cover rounded-lg flex-shrink-0'
            />
            <div className='flex flex-col justify-center gap-1'>
              <p className='font-semibold text-lg leading-tight'>{movie?.title}</p>
              <p className='text-gray-400 text-sm'>
                {movie?.genres?.slice(0, 2).map((g) => g.name).join(' · ')}
              </p>
            </div>
          </div>

          {/* Booking details */}
          <div className='p-5 space-y-3 text-sm'>
            {theater?.name && (
              <div className='flex items-start gap-3'>
                <MapPinIcon className='w-4 h-4 text-primary mt-0.5 flex-shrink-0' />
                <div>
                  <p className='font-medium'>{theater.name}</p>
                  <p className='text-gray-400 text-xs'>{theater.city}{theater.address ? ` — ${theater.address}` : ''}</p>
                </div>
              </div>
            )}
            <div className='flex items-center gap-3'>
              <CalendarIcon className='w-4 h-4 text-primary flex-shrink-0' />
              <p className='text-gray-300'>{dateFormat(booking?.show?.showDateTime)}</p>
            </div>
            <div className='flex items-center gap-3'>
              <TicketIcon className='w-4 h-4 text-primary flex-shrink-0' />
              <p className='text-gray-300'>
                {booking?.bookedSeats?.length} seat{booking?.bookedSeats?.length > 1 ? 's' : ''} &nbsp;·&nbsp;
                {booking?.bookedSeats?.join(', ')}
              </p>
            </div>
          </div>

          {/* Amount */}
          <div className='flex items-center justify-between px-5 py-4 bg-primary/10 border-t border-primary/20'>
            <p className='text-gray-400 text-sm'>Total Amount</p>
            <p className='text-2xl font-bold text-primary'>{currency}{booking?.amount}</p>
          </div>
        </div>

        {/* Secure badge */}
        <div className='flex items-center justify-center gap-1.5 text-gray-500 text-xs mb-5'>
          <ShieldCheckIcon className='w-3.5 h-3.5' />
          <span>Secure · No real charge · Demo payment</span>
        </div>

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={paying}
          className='w-full py-4 rounded-xl bg-primary hover:bg-primary-dull transition font-semibold text-lg cursor-pointer disabled:opacity-60 active:scale-[0.98]'
        >
          {paying ? 'Processing...' : `Pay ${currency}${booking?.amount}`}
        </button>

        <button
          onClick={() => navigate('/my-bookings')}
          className='w-full mt-3 py-3 rounded-xl text-gray-400 hover:text-white text-sm transition cursor-pointer'
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default Payment
