import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { CATEGORIES, EXPERIENCE_LEVELS, JOB_TYPES } from '../../constants/categories'

interface Job {
  _id: string
  title: string
  location: string
  jobType: string
  experienceLevel: string
  category: string
  isActive: boolean
  createdAt: string
  recruiter: { _id: string; name: string }
}

export default function RecruiterJobs() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/jobs', { params: { limit: 100 } })
        const allJobs: Job[] = res.data.data
        setJobs(allJobs.filter((j) => j.recruiter?._id === user?.id))
      } catch {
        setError('Failed to load jobs')
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this job?')) return
    try {
      await api.delete(`/jobs/${id}`)
      setJobs(jobs.filter((j) => j._id !== id))
    } catch {
      setError('Failed to delete job')
    }
  }

  const getCategoryLabel = (value: string) => CATEGORIES.find((c) => c.value === value)?.label || value
  const getJobTypeLabel = (value: string) => JOB_TYPES.find((t) => t.value === value)?.label || value
  const getExperienceLevelLabel = (value: string) =>
    EXPERIENCE_LEVELS.find((level) => level.value === value)?.label || value

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Job Postings</h1>
        <Link
          to="/recruiter/jobs/new"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          + Post New Job
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg mb-4">No job postings yet.</p>
          <Link to="/recruiter/jobs/new" className="text-blue-600 hover:underline font-medium">
            Create your first job posting
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Title</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Category</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Level</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Location</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Posted</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((job) => (
                <tr key={job._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{job.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{getCategoryLabel(job.category)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{getJobTypeLabel(job.jobType)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{getExperienceLevelLabel(job.experienceLevel || 'JUNIOR')}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{job.location || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => navigate(`/recruiter/jobs/${job._id}/edit`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(job._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
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
