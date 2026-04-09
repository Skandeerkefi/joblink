import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { CATEGORIES } from '../constants/categories'

interface Job {
  _id: string
  title: string
  description: string
  location: string
  jobType: string
  category: string
  skills: string[]
  recruiter: { _id: string; name: string }
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

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    fetchJobs()
  }, [selectedCategory])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = selectedCategory ? { category: selectedCategory } : {}
      const res = await api.get('/jobs', { params })
      setJobs(res.data.jobs)
    } catch {
      setError('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)?.label || value
  }

  const getJobTypeLabel = (value: string) => {
    return value.replace(/_/g, ' ')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Next Job</h1>
        <p className="text-gray-500">Browse opportunities from top companies</p>
      </div>

      <div className="mb-6 flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory('')}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear filter
          </button>
        )}
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
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No jobs found{selectedCategory ? ' for this category' : ''}.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link
              key={job._id}
              to={`/jobs/${job._id}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow block"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h2>
                  <p className="text-gray-500 text-sm mb-3">
                    {job.recruiter?.name} {job.location && `• ${job.location}`}
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
                </div>
                <div className="text-sm text-gray-400 ml-4 whitespace-nowrap">
                  {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
