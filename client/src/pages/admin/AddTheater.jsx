import { useState } from 'react'
import axios from 'axios'
import Title from '../../components/admin/Title'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/react'
import { useAppContext } from '../../context/AppContext'

const AddTheater = () => {
  const { baseURL } = useAppContext()
  const { getToken } = useAuth()

  const [form, setForm] = useState({ name: '', city: '', address: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.city || !form.address) return toast('All fields are required')

    setIsSubmitting(true)
    try {
      const token = await getToken()
      const { data } = await axios.post(`${baseURL}/api/theater/add`, form, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        toast.success('Theater added!')
        setForm({ name: '', city: '', address: '' })
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add theater')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Title text1="Add" text2="Theater" />
      <form onSubmit={handleSubmit} className="mt-10 max-w-md space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Theater Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. PVR Cinemas"
            className="w-full bg-transparent border border-gray-600 rounded-md px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="e.g. Mumbai"
            className="w-full bg-transparent border border-gray-600 rounded-md px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={2}
            placeholder="e.g. Phoenix Mall, Lower Parel"
            className="w-full bg-transparent border border-gray-600 rounded-md px-3 py-2 outline-none focus:border-primary resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-white px-8 py-2 rounded hover:bg-primary/90 transition cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? 'Adding...' : 'Add Theater'}
        </button>
      </form>
    </>
  )
}

export default AddTheater
