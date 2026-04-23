import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

interface Stats {
  applications: number
  interviews: number
  accepted: number
  viewed: number
  rejected: number
  resumes: number
}

interface Application {
  status?: string
}

export default function CandidateDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({
    applications: 0,
    interviews: 0,
    accepted: 0,
    viewed: 0,
    rejected: 0,
    resumes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [appsRes, resumesRes] = await Promise.all([
          api.get('/applications/mine'),
          api.get('/resumes/mine'),
        ])
        const applications: Application[] = appsRes.data.applications || []
        setStats({
          applications: applications.length,
          interviews: applications.filter((app) => app.status === 'INTERVIEW').length,
          accepted: applications.filter((app) => app.status === 'HIRED').length,
          viewed: applications.filter((app) => app.status === 'VIEWED').length,
          rejected: applications.filter((app) => app.status === 'REJECTED').length,
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
    { to: '/candidate/profile', label: '👤 Profile & Account', desc: 'Edit profile, email, and password' },
    { to: '/candidate/ats-checker', label: '🧪 ATS Checker', desc: 'See ATS/match with job filters' },
  ]

  const safeApplications = stats.applications || 1
  const interviewRate = Math.round((stats.interviews / safeApplications) * 100)
  const acceptedRate = Math.round((stats.accepted / safeApplications) * 100)
  const viewedRate = Math.round((stats.viewed / safeApplications) * 100)
  const rejectedRate = Math.round((stats.rejected / safeApplications) * 100)

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 dark:text-gray-300">Here&apos;s your job search dashboard and account analysis.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Job Applications', value: loading ? '—' : stats.applications, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', icon: '📨' },
          { label: 'Interviews', value: loading ? '—' : stats.interviews, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', icon: '🗓️' },
          { label: 'Accepted Jobs', value: loading ? '—' : stats.accepted, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: '✅' },
          { label: 'CVs', value: loading ? '—' : stats.resumes, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', icon: '📄' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border border-gray-200 dark:border-gray-800 p-5 ${s.bg}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Application Outcome Analysis</h2>
          {[
            { label: 'Interview rate', value: loading ? '—' : `${interviewRate}%`, bar: interviewRate, color: 'bg-amber-500' },
            { label: 'Acceptance rate', value: loading ? '—' : `${acceptedRate}%`, bar: acceptedRate, color: 'bg-emerald-500' },
            { label: 'Viewed rate', value: loading ? '—' : `${viewedRate}%`, bar: viewedRate, color: 'bg-blue-500' },
            { label: 'Rejected rate', value: loading ? '—' : `${rejectedRate}%`, bar: rejectedRate, color: 'bg-rose-500' },
          ].map((item) => (
            <div key={item.label} className="mb-4 last:mb-0">
              <div className="flex justify-between text-sm mb-1 text-gray-700 dark:text-gray-300">
                <span>{item.label}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className={`h-full ${item.color}`} style={{ width: `${loading ? 0 : item.bar}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Status Breakdown</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Viewed', value: loading ? '—' : stats.viewed, color: 'text-blue-600' },
              { label: 'Interview', value: loading ? '—' : stats.interviews, color: 'text-amber-600' },
              { label: 'Accepted', value: loading ? '—' : stats.accepted, color: 'text-emerald-600' },
              { label: 'Rejected', value: loading ? '—' : stats.rejected, color: 'text-rose-600' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow"
          >
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{link.label}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{link.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
