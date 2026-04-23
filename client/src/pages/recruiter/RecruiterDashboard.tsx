import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

interface Stats {
  jobs: number
  applications: number
}

interface DashboardApplication {
  _id: string
  status: 'APPLIED' | 'VIEWED' | 'INTERVIEW' | 'REJECTED' | 'HIRED'
  atsScore?: number
  matchScore?: number
  interviewAt?: string
  createdAt: string
  job?: {
    _id: string
    title?: string
  }
}

const STATUS_ORDER: DashboardApplication['status'][] = ['APPLIED', 'VIEWED', 'INTERVIEW', 'HIRED', 'REJECTED']

const STATUS_LABELS: Record<DashboardApplication['status'], string> = {
  APPLIED: 'Applied',
  VIEWED: 'Viewed',
  INTERVIEW: 'Interview',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
}
const TOP_JOBS_LIMIT = 5

export default function RecruiterDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ jobs: 0, applications: 0 })
  const [applications, setApplications] = useState<DashboardApplication[]>([])
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
        const recruiterApplications = (appsRes.data.applications || []) as DashboardApplication[]
        setStats({
          jobs: myJobs.length,
          applications: recruiterApplications.length,
        })
        setApplications(recruiterApplications)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [user])

  const analytics = useMemo(() => {
    const statusCounts: Record<DashboardApplication['status'], number> = {
      APPLIED: 0,
      VIEWED: 0,
      INTERVIEW: 0,
      HIRED: 0,
      REJECTED: 0,
    }

    let atsSum = 0
    let atsCount = 0
    let matchSum = 0
    let matchCount = 0
    let interviewsScheduled = 0
    let recentApplications = 0
    const last7Days = Date.now() - 7 * 24 * 60 * 60 * 1000
    const byJob = new Map<string, { id: string; title: string; count: number }>()

    applications.forEach((app) => {
      statusCounts[app.status] += 1
      if (typeof app.atsScore === 'number') {
        atsSum += app.atsScore
        atsCount += 1
      }
      if (typeof app.matchScore === 'number') {
        matchSum += app.matchScore
        matchCount += 1
      }
      if (app.interviewAt) interviewsScheduled += 1
      if (new Date(app.createdAt).getTime() >= last7Days) recentApplications += 1
      if (app.job?._id) {
        const current = byJob.get(app.job._id) || {
          id: app.job._id,
          title: app.job.title || 'Untitled job',
          count: 0,
        }
        current.count += 1
        byJob.set(app.job._id, current)
      }
    })

    const topJobs = [...byJob.values()].sort((a, b) => b.count - a.count).slice(0, TOP_JOBS_LIMIT)
    return {
      statusCounts,
      avgAts: atsCount ? Math.round(atsSum / atsCount) : null,
      avgMatch: matchCount ? Math.round(matchSum / matchCount) : null,
      interviewsScheduled,
      recentApplications,
      topJobs,
    }
  }, [applications])

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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'My Job Postings', value: loading ? '—' : stats.jobs, color: 'text-indigo-600' },
          { label: 'Applications Received', value: loading ? '—' : stats.applications, color: 'text-blue-600' },
          { label: 'Avg ATS Score', value: loading ? '—' : `${analytics.avgAts ?? '—'}`, color: 'text-cyan-600' },
          { label: 'Avg Match Score', value: loading ? '—' : `${analytics.avgMatch ?? '—'}`, color: 'text-violet-600' },
          {
            label: 'Interviews Scheduled',
            value: loading ? '—' : analytics.interviewsScheduled,
            color: 'text-amber-600',
          },
          {
            label: 'New Applications (7d)',
            value: loading ? '—' : analytics.recentApplications,
            color: 'text-emerald-600',
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Applications by Status</h2>
          <div className="space-y-3">
            {STATUS_ORDER.map((status) => {
              const count = analytics.statusCounts[status]
              const pct = applications.length > 0 ? Math.round((count / applications.length) * 100) : 0
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{STATUS_LABELS[status]}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Jobs by Applications</h2>
          {analytics.topJobs.length === 0 ? (
            <p className="text-sm text-gray-500">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {analytics.topJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between gap-3">
                  <div className="text-sm text-gray-700 truncate">{job.title}</div>
                  <div className="text-sm font-semibold text-gray-900">{job.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
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
