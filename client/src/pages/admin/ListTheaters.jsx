import { useEffect, useState } from 'react'
import axios from 'axios'
import Title from '../../components/admin/Title'
import Loading from '../../components/Loading'
import toast from 'react-hot-toast'
import { Trash2Icon } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { useAppContext } from '../../context/AppContext'

const ListTheaters = () => {
  const { baseURL } = useAppContext()
  const { getToken } = useAuth()

  const [theaters, setTheaters] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTheaters = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${baseURL}/api/theater`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) setTheaters(data.theaters)
    } catch (e) {
      toast.error('Failed to load theaters')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, force = false) => {
    if (!force && !confirm('Delete this theater?')) return
    try {
      const token = await getToken()
      const { data } = await axios.delete(
        `${baseURL}/api/theater/${id}${force ? '?force=true' : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        toast.success('Theater deleted')
        fetchTheaters()
      }
    } catch (e) {
      if (e.response?.status === 409) {
        const { activeShows } = e.response.data
        if (confirm(`This theater has ${activeShows} upcoming show(s). Delete anyway?`)) {
          handleDelete(id, true)
        }
      } else {
        toast.error(e.response?.data?.message || 'Failed to delete theater')
      }
    }
  }

  useEffect(() => { fetchTheaters() }, [])

  return !loading ? (
    <>
      <Title text1="List" text2="Theaters" />
      <div className="max-w-2xl mt-6">
        {theaters.length === 0 ? (
          <p className="text-gray-400 text-sm mt-4">No theaters added yet.</p>
        ) : (
          <div className="space-y-3">
            {theaters.map((t) => (
              <div key={t._id} className="flex items-center justify-between p-4 bg-primary/8 border border-primary/20 rounded-lg">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-gray-400">{t.city} — {t.address}</p>
                </div>
                <button
                  onClick={() => handleDelete(t._id)}
                  className="text-red-400 hover:text-red-600 transition cursor-pointer ml-4"
                >
                  <Trash2Icon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  ) : <Loading />
}

export default ListTheaters
