import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  const isActive = (path: string) =>
    location.pathname === path ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600 font-medium'

  const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link to={to} className={isActive(to)} onClick={() => setMenuOpen(false)}>
      {children}
    </Link>
  )

  const publicLinks = (
    <>
      <NavLink to="/">Home</NavLink>
      <NavLink to="/jobs">Jobs</NavLink>
    </>
  )

  const candidateLinks = (
    <>
      <NavLink to="/candidate/dashboard">Dashboard</NavLink>
      <NavLink to="/jobs">Jobs</NavLink>
      <NavLink to="/candidate/applications">My Applications</NavLink>
      <NavLink to="/candidate/resumes">My Resumes</NavLink>
      <NavLink to="/candidate/profile">Profile</NavLink>
    </>
  )

  const recruiterLinks = (
    <>
      <NavLink to="/recruiter/dashboard">Dashboard</NavLink>
      <NavLink to="/recruiter/jobs">My Jobs</NavLink>
      <NavLink to="/recruiter/applications">Applications</NavLink>
    </>
  )

  const links = !user ? publicLinks : user.role === 'candidate' ? candidateLinks : recruiterLinks

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0" onClick={() => setMenuOpen(false)}>
            <span className="text-2xl font-bold text-blue-600">JobLink</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-5">
            {links}
            {!user ? (
              <>
                <Link to="/login" className={`${isActive('/login')} ml-2`} onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3 border-l border-gray-200 pl-4 ml-1">
                <span className="text-sm text-gray-500">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-red-600 font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="flex flex-col px-4 py-3 space-y-3">
            {links}
            {!user ? (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-500">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-left text-gray-600 hover:text-red-600 font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
