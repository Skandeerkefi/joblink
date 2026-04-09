import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

interface Stats {
  jobs: number
  applications: number
}

export default function RecruiterDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ jobs: 0, applications: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [jobsRes, appsRes] = await Promise.all([
          api.get('/jobs', { params: { limit: 100 } }),
          api.get('/applications/for-my-jobs'),
        ])
        const myJobs = (jobsRes.data.data as Array<{ recruiter: { _id: string } }>).filter(
          (j) => j.recruiter?._id === user?.id
        )
        setStats({
          jobs: myJobs.length,
          applications: appsRes.data.applications?.length ?? 0,
        })
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [user])

  const quickLinks = [
    { to: '/recruiter/jobs/new', label: '➕ Post a Job', desc: 'Create a new job opening' },
    { to: '/recruiter/jobs', label: '📁 My Jobs', desc: 'View and manage your listings' },
    { to: '/recruiter/applications', label: '📬 Applications', desc: 'Review candidate applications' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome back, {user?.name}!</h1>
        <p className="text-gray-500">Manage your job postings and review applicants.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'My Job Postings', value: loading ? '—' : stats.jobs, color: 'text-indigo-600' },
          { label: 'Applications Received', value: loading ? '—' : stats.applications, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
