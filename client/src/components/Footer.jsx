import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <footer className="px-6 md:px-16 lg:px-36 mt-40 w-full text-gray-300">
      <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-500 pb-14">
        <div className="md:max-w-96">
          <img alt="Quickshow" className="h-11" src={assets.logo} />
          <p className="mt-6 text-sm leading-relaxed">
            Quickshow is your go-to platform for booking movie tickets online. Browse now-playing films, pick your seats, and confirm your booking in seconds — all in one place.
          </p>
        </div>

        <div className="flex-1 flex items-start md:justify-end gap-20 md:gap-40">
          <div>
            <h2 className="font-semibold mb-5">Quick Links</h2>
            <ul className="text-sm space-y-2">
              <li><Link to="/" className="hover:text-primary transition">Home</Link></li>
              <li><Link to="/movies" className="hover:text-primary transition">Movies</Link></li>
              <li><Link to="/theaters" className="hover:text-primary transition">Theaters</Link></li>
              <li><Link to="/my-bookings" className="hover:text-primary transition">My Bookings</Link></li>
              <li><Link to="/favorite" className="hover:text-primary transition">Favorites</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-semibold mb-5">Get in touch</h2>
            <div className="text-sm space-y-2">
              <p>rishabhshakya028@gmail.com</p>
            </div>
          </div>
        </div>
      </div>

      <p className="pt-4 text-center text-sm pb-5">
        Copyright {new Date().getFullYear()} © Quickshow. All Rights Reserved.
      </p>
    </footer>
  )
}

export default Footer
