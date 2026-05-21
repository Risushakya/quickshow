import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import BlurCircle from '../components/BlurCircle'
import Loading from '../components/Loading'
import { MapPinIcon } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const Theaters = () => {
  const { baseURL } = useAppContext()
  const [theaters, setTheaters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${baseURL}/api/theater/public`)
      .then(({ data }) => { if (data.success) setTheaters(data.theaters) })
      .catch(() => toast.error('Failed to load theaters'))
      .finally(() => setLoading(false))
  }, [baseURL])

  if (loading) return <Loading />

  return (
    <div className='relative px-6 md:px-16 lg:px-40 pt-32 pb-20 min-h-screen overflow-hidden'>
      <BlurCircle top='100px' left='0px' />
      <BlurCircle bottom='100px' right='0px' />

      <h1 className='text-3xl font-semibold mb-2'>Our Theaters</h1>
      <p className='text-gray-400 mb-10'>Find a Quickshow cinema near you and book your seats.</p>

      {theaters.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-24'>
          <MapPinIcon className='w-14 h-14 text-primary/40 mb-4' strokeWidth={1.2} />
          <p className='text-xl font-semibold'>No theaters listed yet</p>
          <p className='text-gray-400 mt-2 text-sm'>Check back soon — we're expanding!</p>
        </div>
      ) : (
        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl'>
          {theaters.map((t) => (
            <div
              key={t._id}
              className='flex flex-col gap-3 p-6 bg-primary/8 border border-primary/20 rounded-2xl hover:-translate-y-1 transition duration-300'
            >
              <div className='flex items-center justify-center w-12 h-12 rounded-full bg-primary/15'>
                <MapPinIcon className='w-6 h-6 text-primary' />
              </div>
              <p className='text-lg font-semibold'>{t.name}</p>
              <p className='text-sm text-gray-400 leading-relaxed'>{t.address}</p>
              <span className='text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full w-fit'>
                {t.city}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Theaters
