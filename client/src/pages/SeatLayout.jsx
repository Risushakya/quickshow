import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import Loading from '../components/Loading'
import { ArrowRightIcon, ClockIcon, MapPinIcon } from 'lucide-react'
import isoTimeFormat from '../lib/isoTimeFormat'
import BlurCircle from '../components/BlurCircle'
import toast from 'react-hot-toast'
import { useAuth, useClerk, useUser } from '@clerk/react'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const SeatLayout = () => {
  const groupRows = [['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H'], ['I', 'J']]

  const { id, date } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { user } = useUser()
  const { openSignIn } = useClerk()
  const { baseURL } = useAppContext()

  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [selectedTheaterId, setSelectedTheaterId] = useState(null)
  const [show, setShow] = useState(null)
  const [isBooking, setIsBooking] = useState(false)

  useEffect(() => {
    const fetchShow = async () => {
      try {
        const { data } = await axios.get(`${baseURL}/api/show/${id}`)
        if (data.success) setShow(data)
      } catch (e) {
        console.error(e)
        toast.error('Failed to load show details')
      }
    }
    fetchShow()
  }, [id])

  const timeSlotsForDate = show?.dateTime?.[date] || []

  // Unique theaters available on this date
  const theatersForDate = useMemo(() => {
    const seen = new Map()
    for (const slot of timeSlotsForDate) {
      if (slot.theater?._id && !seen.has(slot.theater._id)) {
        seen.set(slot.theater._id, slot.theater)
      }
    }
    return [...seen.values()]
  }, [timeSlotsForDate])

  // Auto-select single theater; reset when date changes
  useEffect(() => {
    if (theatersForDate.length === 1) {
      setSelectedTheaterId(theatersForDate[0]._id)
    } else {
      setSelectedTheaterId(null)
    }
    setSelectedTime(null)
    setSelectedSeats([])
  }, [date, theatersForDate.length])

  const filteredSlots = selectedTheaterId
    ? timeSlotsForDate.filter((s) => s.theater?._id === selectedTheaterId)
    : timeSlotsForDate

  const handleTheaterSelect = (theaterId) => {
    setSelectedTheaterId(theaterId)
    setSelectedTime(null)
    setSelectedSeats([])
  }

  const handleSeatClick = (seatId) => {
    if (!selectedTime) return toast('Please select a time slot first')
    if (selectedTime.occupiedSeats?.[seatId]) return
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
      return toast('You can only select up to 5 seats')
    }
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    )
  }

  const handleTimeSelect = (item) => {
    setSelectedTime(item)
    setSelectedSeats([])
  }

  const handleCheckout = async () => {
    if (!user) return openSignIn()
    if (!selectedTime) return toast('Please select a time slot')
    if (!selectedSeats.length) return toast('Please select at least one seat')

    setIsBooking(true)
    try {
      const token = await getToken()

      // Step 1: create booking (isPaid: false)
      const { data: bookingData } = await axios.post(
        `${baseURL}/api/booking`,
        { showId: selectedTime.showId, selectedSeats },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!bookingData.success) throw new Error(bookingData.message)

      // Step 2: go to payment page
      navigate(`/payment/${bookingData.booking._id}`)
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Booking failed. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  const renderSeats = (row, count = 9) => {
    const occupied = selectedTime?.occupiedSeats || {}
    return (
      <div key={row} className='flex gap-2 mt-2'>
        <div className='flex flex-wrap items-center justify-center gap-2'>
          {Array.from({ length: count }, (_, i) => {
            const seatId = `${row}${i + 1}`
            const isOccupied = !!occupied[seatId]
            const isSelected = selectedSeats.includes(seatId)
            return isOccupied ? (
              <div
                key={seatId}
                title={`Seat ${seatId} — occupied`}
                className='h-8 w-8 rounded bg-gray-600 border border-gray-500 flex items-center justify-center cursor-not-allowed'
              >
                <span className='text-gray-400 text-xs font-bold'>✕</span>
              </div>
            ) : (
              <button
                key={seatId}
                onClick={() => handleSeatClick(seatId)}
                className={`h-8 w-8 rounded border text-xs transition
                  ${isSelected
                    ? 'bg-primary border-primary text-white cursor-pointer'
                    : 'border-primary/60 cursor-pointer hover:bg-primary/20'
                  }`}
              >
                {seatId}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return show ? (
    <div className='flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50'>
      {/* Sidebar */}
      <div className='w-64 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30'>

        {/* Single theater — show as info header */}
        {theatersForDate.length === 1 && (
          <div className='px-6 mb-5 pb-5 border-b border-primary/20'>
            <p className='text-xs text-gray-500 uppercase tracking-wider mb-2'>Theater</p>
            <div className='flex items-start gap-2'>
              <MapPinIcon className='w-4 h-4 text-primary mt-0.5 flex-shrink-0' />
              <div>
                <p className='text-sm font-semibold'>{theatersForDate[0].name}</p>
                {theatersForDate[0].city && (
                  <p className='text-xs text-gray-400 mt-0.5'>
                    {theatersForDate[0].city}
                    {theatersForDate[0].address ? ` — ${theatersForDate[0].address}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Multiple theaters — show selector */}
        {theatersForDate.length > 1 && (
          <div className='px-6 mb-6'>
            <p className='text-sm font-semibold mb-3 flex items-center gap-1.5'>
              <MapPinIcon className='w-4 h-4 text-primary' />
              Select Theater
            </p>
            <div className='space-y-2'>
              {theatersForDate.map((t) => (
                <button
                  key={t._id}
                  onClick={() => handleTheaterSelect(t._id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition cursor-pointer
                    ${selectedTheaterId === t._id
                      ? 'bg-primary border-primary text-white'
                      : 'border-primary/30 hover:border-primary/60 hover:bg-primary/10'
                    }`}
                >
                  <p className='font-medium truncate'>{t.name}</p>
                  <p className='text-xs opacity-70'>{t.city}</p>
                </button>
              ))}
            </div>
            <div className='mt-4 border-t border-primary/20' />
          </div>
        )}

        {/* Time slot selection */}
        <p className='text-lg font-semibold px-6'>Available Timing</p>
        {timeSlotsForDate.length === 0 ? (
          <p className='px-6 mt-4 text-sm text-gray-400'>No shows for this date</p>
        ) : !selectedTheaterId && theatersForDate.length > 1 ? (
          <p className='px-6 mt-4 text-sm text-gray-400'>Select a theater above</p>
        ) : filteredSlots.length > 0 ? (
          <div className='mt-5 space-y-1'>
            {filteredSlots.map((item) => (
              <div
                key={item.time}
                onClick={() => handleTimeSelect(item)}
                className={`px-6 py-2 cursor-pointer transition rounded-r-md
                  ${selectedTime?.time === item.time
                    ? 'bg-primary text-white'
                    : 'hover:bg-primary/20'
                  }`}
              >
                <div className='flex items-center gap-2'>
                  <ClockIcon className='w-4 h-4' />
                  <p className='text-sm font-medium'>{isoTimeFormat(item.time)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='px-6 mt-4 text-sm text-gray-400'>No shows for this theater on this date</p>
        )}

      </div>

      {/* Seat Layout */}
      <div className='relative flex-1 flex flex-col items-center max-md:mt-16'>
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0" right="0" />
        <h1 className='text-2xl font-semibold mb-4'>Select Your Seat</h1>
        <img src={assets.screenImage} alt="screen" />
        <p className='text-gray-400 text-sm mb-6'>SCREEN SIDE</p>

        <div className='flex flex-col items-center mt-10 text-xs text-gray-300'>
          <div className='grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6'>
            {groupRows[0].map((row) => renderSeats(row))}
          </div>
          <div className='grid grid-cols-2 gap-11'>
            {groupRows.slice(1).map((group) => (
              <div key={group.join('')}>
                {group.map((row) => renderSeats(row))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className='flex items-center gap-6 mt-8 text-xs text-gray-400'>
          <span className='flex items-center gap-1'>
            <span className='inline-block w-4 h-4 rounded border border-primary/60' /> Available
          </span>
          <span className='flex items-center gap-1'>
            <span className='inline-block w-4 h-4 rounded bg-primary' /> Selected
          </span>
          <span className='flex items-center gap-1'>
            <span className='inline-block w-4 h-4 rounded bg-gray-600 border border-gray-500 text-center leading-4 text-gray-400 text-xs font-bold'>✕</span> Occupied
          </span>
        </div>

        {selectedSeats.length > 0 && (
          <p className='mt-4 text-sm text-gray-300'>
            Selected: {selectedSeats.join(', ')} &nbsp;|&nbsp; Total:{' '}
            {selectedTime
              ? `${import.meta.env.VITE_CURRENCY || '$'}${selectedSeats.length * (timeSlotsForDate.find(t => t.time === selectedTime?.time)?.showPrice || 0)}`
              : '—'}
          </p>
        )}

        <button
          onClick={handleCheckout}
          disabled={isBooking}
          className='flex items-center gap-1 mt-10 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95 disabled:opacity-60'
        >
          {isBooking ? 'Booking...' : 'Proceed to Checkout'}
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  ) : <Loading />
}

export default SeatLayout
