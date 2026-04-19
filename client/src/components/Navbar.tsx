import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../api/axios'

type CandidateApplication = {
  _id: string
  job?: {
    title?: string
  }
  interviewAt?: string
  notifications?: Array<{
    message: string
    createdAt: string
  }>
}

type CandidateNotificationItem = {
  id: string
  message: string
  createdAt: string
  jobTitle: string
  interviewAt?: string
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
  const [notificationItems, setNotificationItems] = useState<CandidateNotificationItem[]>([])
  const notificationMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || user.role !== 'candidate') {
        setNotificationCount(0)
        setNotificationItems([])
        return
      }

      try {
        const res = await api.get('/applications/mine')
        const applications = Array.isArray(res.data?.applications) ? res.data.applications : []

        const notifications = applications.flatMap((app: CandidateApplication) => {
          const appNotifications = Array.isArray(app.notifications) ? app.notifications : []
          const jobTitle = app.job?.title || 'Job application'
          return appNotifications.map((notification, index) => ({
            id: `${app._id}-${notification.createdAt}-${index}`,
            message: notification.message,
            createdAt: notification.createdAt,
            jobTitle,
            interviewAt: app.interviewAt,
          }))
        })
        notifications.sort((a: CandidateNotificationItem, b: CandidateNotificationItem) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

        const totalNotifications = applications.reduce((sum: number, app: CandidateApplication) => {
          return sum + (Array.isArray(app.notifications) ? app.notifications.length : 0)
        }, 0)

        setNotificationItems(notifications)
        setNotificationCount(totalNotifications)
      } catch {
        setNotificationCount(0)
        setNotificationItems([])
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 120000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    setNotificationMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(target)) {
        setNotificationMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-blue-600 dark:text-blue-400 font-semibold'
      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium'

  const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link to={to} className={isActive(to)} onClick={() => setMenuOpen(false)}>
      {children}
    </Link>
  )

  const candidateNotificationButton = user?.role === 'candidate' && (
    <div className="relative" ref={notificationMenuRef}>
      <button
        type="button"
        onClick={() => setNotificationMenuOpen((prev) => !prev)}
        className="relative p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
        aria-label={`Notifications (${notificationCount})`}
        title={`${notificationCount} notifications`}
      >
        <span aria-hidden="true">🔔</span>
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] px-1">
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
      </button>

      {notificationMenuOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-30">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</p>
          </div>

          {notificationItems.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {notificationItems.map((notification) => (
                <li key={notification.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{notification.jobTitle}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">{notification.message}</p>
                  {notification.interviewAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Interview: {new Date(notification.interviewAt).toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/candidate/applications"
            className="block px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
            onClick={() => {
              setNotificationMenuOpen(false)
              setMenuOpen(false)
            }}
          >
            View my applications
          </Link>
        </div>
      )}
    </div>
  )

  const publicLinks = (
    <>
      <NavLink to="/">{t.nav.home}</NavLink>
      <NavLink to="/jobs">{t.nav.jobs}</NavLink>
    </>
  )

  const candidateLinks = (
    <>
      <NavLink to="/candidate/dashboard">{t.nav.dashboard}</NavLink>
      <NavLink to="/jobs">{t.nav.jobs}</NavLink>
      <NavLink to="/candidate/applications">{t.nav.myApplications}</NavLink>
      <NavLink to="/candidate/saved-jobs">{t.nav.savedJobs}</NavLink>
      <NavLink to="/candidate/resumes">{t.nav.myResumes}</NavLink>
      <NavLink to="/candidate/ats-checker">{t.nav.atsChecker}</NavLink>
    </>
  )

  const recruiterLinks = (
    <>
      <NavLink to="/recruiter/dashboard">{t.nav.dashboard}</NavLink>
      <NavLink to="/recruiter/jobs">{t.nav.myJobs}</NavLink>
      <NavLink to="/recruiter/applications">{t.nav.applications}</NavLink>
    </>
  )

  const adminLinks = (
    <>
      <NavLink to="/admin/users">{t.nav.adminUsers}</NavLink>
      <NavLink to="/jobs">{t.nav.jobs}</NavLink>
    </>
  )

  const links = !user
    ? publicLinks
    : user.role === 'candidate'
      ? candidateLinks
      : user.role === 'recruiter'
        ? recruiterLinks
        : adminLinks

  return (
    <nav className="bg-white/90 dark:bg-black/90 backdrop-blur shadow-sm border-b border-gray-200 dark:border-gray-800 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2 shrink-0" onClick={() => setMenuOpen(false)}>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">JobLink</span>
          </Link>

          <div className="hidden md:flex items-center space-x-5">
            {links}
            {candidateNotificationButton}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')}
              className="text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-black"
              aria-label={t.nav.language}
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>
            <button
              onClick={toggleTheme}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              {theme === 'dark' ? t.nav.light : t.nav.dark}
            </button>
            {!user ? (
              <>
                <Link to="/login" className={`${isActive('/login')} ml-2`} onClick={() => setMenuOpen(false)}>
                  {t.nav.login}
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  {t.nav.register}
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3 border-l border-gray-300 dark:border-gray-700 pl-4 ml-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-red-500 font-medium"
                >
                  {t.nav.logout}
                </button>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none"
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

      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="flex flex-col px-4 py-3 space-y-3">
            {links}
            {candidateNotificationButton}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')}
              className="text-left text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-black"
              aria-label={t.nav.language}
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>
            <button
              onClick={toggleTheme}
              className="text-left text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2"
            >
              {theme === 'dark' ? t.nav.switchToLight : t.nav.switchToDark}
            </button>
            {!user ? (
              <>
                <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => setMenuOpen(false)}>
                  {t.nav.login}
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 font-medium text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  {t.nav.register}
                </Link>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-left text-gray-700 dark:text-gray-300 hover:text-red-500 font-medium"
                >
                  {t.nav.logout}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
