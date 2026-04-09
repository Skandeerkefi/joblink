import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">JobLink</span>
          </Link>

          <div className="flex items-center space-x-4">
            {!user ? (
              <>
                <Link to="/jobs" className="text-gray-600 hover:text-blue-600 font-medium">
                  Jobs
                </Link>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Register
                </Link>
              </>
            ) : user.role === 'candidate' ? (
              <>
                <Link to="/jobs" className="text-gray-600 hover:text-blue-600 font-medium">
                  Jobs
                </Link>
                <Link to="/candidate/applications" className="text-gray-600 hover:text-blue-600 font-medium">
                  My Applications
                </Link>
                <Link to="/candidate/resumes" className="text-gray-600 hover:text-blue-600 font-medium">
                  My Resumes
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/recruiter/jobs" className="text-gray-600 hover:text-blue-600 font-medium">
                  My Jobs
                </Link>
                <Link to="/recruiter/applications" className="text-gray-600 hover:text-blue-600 font-medium">
                  Applications
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 font-medium"
                >
                  Logout
                </button>
              </>
            )}
            {user && (
              <span className="text-sm text-gray-500 border-l border-gray-200 pl-4">
                {user.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
