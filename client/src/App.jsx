import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import Mybooking from './pages/Mybooking'
import Favorite from './pages/Favorite'
import Theaters from './pages/Theaters'
import Payment from './pages/Payment'
import PaymentSuccess from './pages/PaymentSuccess'
import { Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import Layout from './pages/admin/Layout'
import AddShows from './pages/admin/AddShows'
import ListShows from './pages/admin/ListShows'
import ListBookings from './pages/admin/ListBookings'
import Dashboard from './pages/admin/Dashboard'
import AddTheater from './pages/admin/AddTheater'
import ListTheaters from './pages/admin/ListTheaters'
import Loading from './components/Loading'
import { useAppContext } from './context/AppContext'

const AdminRoute = () => {
  const { isAdmin, isLoaded } = useAppContext()
  if (!isLoaded) return <Loading />
  return isAdmin ? <Layout /> : <Navigate to='/' />
}

const App = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAdmin, isLoaded } = useAppContext()
  const isAdminRoute = location.pathname.startsWith('/admin')

  // Only auto-redirect from the home page; admin should still be able to browse the site
  useEffect(() => {
    if (isLoaded && isAdmin && location.pathname === '/') {
      navigate('/admin')
    }
  }, [isLoaded, isAdmin, location.pathname, navigate])

  return (
    <>
      <Toaster />
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/movies' element={<Movies />} />
        <Route path='/movies/:id' element={<MovieDetails />} />
        <Route path='/movies/:id/:date' element={<SeatLayout />} />
        <Route path='/my-bookings' element={<Mybooking />} />
        <Route path='/favorite' element={<Favorite />} />
        <Route path='/theaters' element={<Theaters />} />
        <Route path='/payment/:bookingId' element={<Payment />} />
        <Route path='/payment-success' element={<PaymentSuccess />} />
        <Route path='/admin/*' element={<AdminRoute />}>
          <Route index element={<Dashboard />} />
          <Route path='add-theater' element={<AddTheater />} />
          <Route path='list-theaters' element={<ListTheaters />} />
          <Route path='add-shows' element={<AddShows />} />
          <Route path='list-shows' element={<ListShows />} />
          <Route path='list-bookings' element={<ListBookings />} />
        </Route>
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  )
}

export default App
