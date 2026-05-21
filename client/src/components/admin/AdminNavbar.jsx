import { Link, useNavigate } from "react-router-dom"
import { assets } from "../../assets/assets"
import { useClerk } from "@clerk/react"
import { LogOutIcon } from "lucide-react"

const AdminNavbar = () => {
  const { signOut } = useClerk()
  const navigate = useNavigate()

  const handleLogout = () => {
    signOut(() => navigate('/'))
  }

  return (
    <div className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-gray-300/30">
      <Link to="/">
        <img src={assets.logo} alt="logo" className="w-36 h-auto"/>
      </Link>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 px-3 py-1.5 rounded-lg transition cursor-pointer"
      >
        <LogOutIcon className="w-4 h-4" />
        <span className="max-sm:hidden">Logout</span>
      </button>
    </div>
  )
}

export default AdminNavbar