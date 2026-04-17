import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

interface Stats {
  applications: number
  resumes: number
}

export default function CandidateDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ applications: 0, resumes: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [appsRes, resumesRes] = await Promise.all([
          api.get('/applications/mine'),
          api.get('/resumes/mine'),
        ])
        setStats({
          applications: appsRes.data.applications?.length ?? 0,
          resumes: resumesRes.data.resumes?.length ?? 0,
        })
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const quickLinks = [
    { to: '/jobs', label: '🔍 Browse Jobs', desc: 'Explore open positions' },
    { to: '/candidate/applications', label: '📋 My Applications', desc: 'Track your applications' },
    { to: '/candidate/resumes', label: '📄 My Resumes', desc: 'Manage your CV files' },
    { to: '/candidate/ats-checker', label: '🧪 ATS Checker', desc: 'See detailed ATS and match analysis' },
    { to: '/candidate/profile', label: '👤 My Profile', desc: 'Update skills & education' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome back, {user?.name}!</h1>
        <p className="text-gray-500">Here's an overview of your job search activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Applications', value: loading ? '—' : stats.applications, color: 'text-blue-600' },
          { label: 'Resumes', value: loading ? '—' : stats.resumes, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="font-semibold text-gray-900 mb-1">{link.label}</div>
            <div className="text-sm text-gray-500">{link.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
