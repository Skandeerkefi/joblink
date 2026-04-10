import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { CATEGORIES, JOB_TYPES } from '../../constants/categories'

interface SavedJobEntry {
  _id: string
  job: {
    _id: string
    title: string
    description: string
    location: string
    jobType: string
    remote: boolean
    category: string
    skills: string[]
    recruiter: { _id: string; name: string }
    createdAt: string
  }
  createdAt: string
}

const categoryColors: Record<string, string> = {
  SOFTWARE_ENGINEERING: 'bg-blue-100 text-blue-800',
  DATA: 'bg-purple-100 text-purple-800',
  CYBERSECURITY: 'bg-red-100 text-red-800',
  PRODUCT: 'bg-green-100 text-green-800',
  UI_UX: 'bg-pink-100 text-pink-800',
  MARKETING: 'bg-orange-100 text-orange-800',
  SALES: 'bg-yellow-100 text-yellow-800',
  BUSINESS_DEVELOPMENT: 'bg-indigo-100 text-indigo-800',
  FINANCE: 'bg-emerald-100 text-emerald-800',
  HR: 'bg-teal-100 text-teal-800',
  OPERATIONS: 'bg-cyan-100 text-cyan-800',
  CUSTOMER_SUCCESS: 'bg-lime-100 text-lime-800',
  OTHER: 'bg-gray-100 text-gray-800',
}

const LIMIT = 10

export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState<SavedJobEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  const fetchSavedJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/saved-jobs/mine', { params: { page, limit: LIMIT } })
      setSavedJobs(res.data.data)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch {
      setError('Failed to load saved jobs')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchSavedJobs()
  }, [fetchSavedJobs])

  const handleUnsave = async (jobId: string) => {
    setRemovingId(jobId)
    try {
      await api.delete(`/jobs/${jobId}/save`)
      setSavedJobs((prev) => prev.filter((s) => s.job._id !== jobId))
      setTotal((prev) => prev - 1)
    } catch {
      setError('Failed to remove saved job')
    } finally {
      setRemovingId(null)
    }
  }

  const getCategoryLabel = (value: string) => CATEGORIES.find((c) => c.value === value)?.label || value
  const getJobTypeLabel = (value: string) => JOB_TYPES.find((t) => t.value === value)?.label || value.replace(/_/g, ' ')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Jobs</h1>
        <p className="text-gray-500">Jobs you've bookmarked for later</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-4">🔖</p>
          <p className="text-lg font-medium text-gray-700 mb-2">No saved jobs yet</p>
          <p className="text-gray-500 mb-4">Browse jobs and click "Save" to bookmark them here.</p>
          <Link
            to="/jobs"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{total} saved job{total !== 1 ? 's' : ''}</p>
          <div className="grid gap-4 mb-6">
            {savedJobs.map((entry) => {
              const job = entry.job
              if (!job) return null
              return (
                <div
                  key={entry._id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <Link to={`/jobs/${job._id}`} className="flex-1 min-w-0 group">
                      <h2 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h2>
                      <p className="text-gray-500 text-sm mb-3">
                        {job.recruiter?.name}
                        {job.location && ` • ${job.location}`}
                        {job.remote && (
                          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            Remote
                          </span>
                        )}
                      </p>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">{job.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[job.category] || 'bg-gray-100 text-gray-800'}`}
                        >
                          {getCategoryLabel(job.category)}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {getJobTypeLabel(job.jobType)}
                        </span>
                        {job.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </Link>
                    <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                      <span className="text-xs text-gray-400">
                        Saved {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleUnsave(job._id)}
                        disabled={removingId === job._id}
                        className="text-xs px-2.5 py-1 rounded-full font-medium border bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors disabled:opacity-50"
                      >
                        {removingId === job._id ? '...' : '★ Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${
                    p === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
