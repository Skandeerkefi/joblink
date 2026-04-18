import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { APPLICATION_STATUSES } from '../../constants/categories'
import { API_BASE_URL } from '../../constants/config'

interface Application {
  _id: string
  job: {
    _id: string
    title: string
    location: string
    category: string
  }
  resume?: {
    originalName: string
    fileUrl: string
  }
  status: string
  coverLetter?: string
  atsScore?: number
  matchScore?: number
  interviewAt?: string
  notifications?: Array<{
    message: string
    createdAt: string
  }>
  createdAt: string
}

const statusColors: Record<string, string> = {
  APPLIED: 'bg-gray-100 text-gray-700',
  VIEWED: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
  HIRED: 'bg-green-100 text-green-700',
}

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get('/applications/mine')
        setApplications(res.data.applications)
      } catch {
        setError('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [])

  const getStatusLabel = (value: string) => {
    return APPLICATION_STATUSES.find((s) => s.value === value)?.label || value
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Applications</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg">No applications yet.</p>
          <a href="/jobs" className="text-blue-600 hover:underline mt-2 block">
            Browse jobs to apply
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Job</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Location</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Resume</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Applied</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">ATS</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Match</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Interview</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Notification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => {
                  const latestNotification =
                    app.notifications && app.notifications.length > 0
                      ? app.notifications[app.notifications.length - 1]
                      : null
                  return (
                    <tr key={app._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <a
                      href={`/jobs/${app.job?._id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {app.job?.title || 'N/A'}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.job?.location || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    {app.resume ? (
                      <a
                        href={`${API_BASE_URL}${app.resume.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {app.resume.originalName}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.atsScore ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.matchScore ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {getStatusLabel(app.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {app.interviewAt ? new Date(app.interviewAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    {latestNotification ? (
                      <div>
                        <div>{latestNotification.message}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(latestNotification.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
        </div>
      )}
    </div>
  )
}
