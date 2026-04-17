import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import { APPLICATION_STATUSES } from '../../constants/categories'
import { API_BASE_URL } from '../../constants/config'

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
  atsScore?: number
  matchScore?: number
  createdAt: string
}

export default function RecruiterApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [minAts, setMinAts] = useState('')
  const [minMatch, setMinMatch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get('/applications/for-my-jobs')
        setApplications(res.data.applications || [])
      } catch {
        setError('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [])

  const filtered = useMemo(() => {
    const atsThreshold = minAts === '' ? null : Number(minAts)
    const matchThreshold = minMatch === '' ? null : Number(minMatch)

    return [...applications]
      .filter((a) => (statusFilter === 'ALL' ? true : a.status === statusFilter))
      .filter((a) => (atsThreshold === null ? true : (a.atsScore ?? -1) >= atsThreshold))
      .filter((a) => (matchThreshold === null ? true : (a.matchScore ?? -1) >= matchThreshold))
      .sort((a, b) => {
        const matchA = a.matchScore ?? -1
        const matchB = b.matchScore ?? -1
        if (matchB !== matchA) return matchB - matchA
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [applications, minAts, minMatch, statusFilter])

  const changeStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    setError('')
    try {
      await api.patch(`/applications/${id}/status`, { status })
      setApplications((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)))
    } catch {
      setError('Failed to update status')
    } finally {
      setUpdatingId(null)
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Applications</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Sorted by <span className="font-semibold">match score</span> by default.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg px-3 py-2 text-sm"
            >
              <option value="ALL">All statuses</option>
              {APPLICATION_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Min ATS Score</label>
            <input
              type="number"
              min={0}
              max={100}
              value={minAts}
              onChange={(e) => setMinAts(e.target.value)}
              placeholder="e.g. 60"
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Min Match Score</label>
            <input
              type="number"
              min={0}
              max={100}
              value={minMatch}
              onChange={(e) => setMinMatch(e.target.value)}
              placeholder="e.g. 70"
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('ALL')
                setMinAts('')
                setMinMatch('')
              }}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No applications match the selected filters.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Candidate</th>
                  <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Job</th>
                  <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">ATS</th>
                  <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Match</th>
                  <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Resume</th>
                  <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((app) => (
                  <tr key={app._id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{app.candidate?.name}</div>
                      <div className="text-xs text-gray-500">{app.candidate?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{app.job?.title}</div>
                      <div className="text-xs text-gray-500">{app.job?.location || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600">{app.atsScore ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-indigo-600">{app.matchScore ?? '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={app.status}
                        disabled={updatingId === app._id}
                        onChange={(e) => changeStatus(app._id, e.target.value)}
                        className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded px-2 py-1 text-sm"
                      >
                        {APPLICATION_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {app.resume ? (
                        <a
                          href={`${API_BASE_URL}${app.resume.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {app.resume.originalName}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((app) => (
              <div key={app._id} className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{app.candidate?.name}</div>
                <div className="text-xs text-gray-500 mb-2">{app.candidate?.email}</div>
                <div className="text-sm font-medium">{app.job?.title}</div>
                <div className="text-xs text-gray-500 mb-3">{app.job?.location || '—'}</div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>ATS: <span className="font-semibold text-blue-600">{app.atsScore ?? '—'}</span></div>
                  <div>Match: <span className="font-semibold text-indigo-600">{app.matchScore ?? '—'}</span></div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <select
                    value={app.status}
                    disabled={updatingId === app._id}
                    onChange={(e) => changeStatus(app._id, e.target.value)}
                    className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded px-2 py-1 text-sm"
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {app.resume && (
                    <a
                      href={`${API_BASE_URL}${app.resume.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Resume
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
