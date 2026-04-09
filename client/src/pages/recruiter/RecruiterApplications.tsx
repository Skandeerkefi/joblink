import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { APPLICATION_STATUSES } from '../../constants/categories'

interface Application {
  _id: string
  job: {
    _id: string
    title: string
    location: string
  }
  candidate: {
    _id: string
    name: string
    email: string
  }
  resume?: {
    originalName: string
    fileUrl: string
  }
  status: string
  coverLetter?: string
  createdAt: string
}

const statusColors: Record<string, string> = {
  APPLIED: 'bg-gray-100 text-gray-700',
  VIEWED: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
  HIRED: 'bg-green-100 text-green-700',
}

export default function RecruiterApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get('/applications/for-my-jobs')
        setApplications(res.data.applications)
      } catch {
        setError('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/applications/${id}/status`, { status: newStatus })
      setApplications(
        applications.map((app) => (app._id === id ? { ...app, status: newStatus } : app))
      )
    } catch {
      setError('Failed to update status')
    }
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Applications for My Jobs</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg">No applications received yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Candidate</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Job</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Resume</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Applied</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map((app) => (
                <tr key={app._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{app.candidate?.name}</div>
                    <div className="text-sm text-gray-500">{app.candidate?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{app.job?.title}</div>
                    {app.job?.location && (
                      <div className="text-sm text-gray-500">{app.job.location}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {app.resume ? (
                      <a
                        href={`http://localhost:5000${app.resume.fileUrl}`}
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
                  <td className="px-6 py-4">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app._id, e.target.value)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusColors[app.status] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {APPLICATION_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
