import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, JOB_TYPES } from '../constants/categories'

interface Job {
  _id: string
  title: string
  description: string
  location: string
  jobType: string
  remote: boolean
  category: string
  skills: string[]
  recruiter: { _id: string; name: string; email: string }
  createdAt: string
}

interface Resume {
  _id: string
  type?: 'UPLOAD' | 'MANUAL'
  title?: string
  originalName: string
  fileUrl: string
}

interface ResumeAnalysis {
  atsScore: number
  matchScore: number | null
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

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResume, setSelectedResume] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [similarJobs, setSimilarJobs] = useState<Job[]>([])
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  useEffect(() => {
    fetchJob()
    if (user?.role === 'candidate') fetchResumes()
  }, [id, user])

  useEffect(() => {
    if (id) fetchSimilar()
  }, [id])

  // Check saved state for candidates
  useEffect(() => {
    if (!user || user.role !== 'candidate' || !id) return
    api.get('/saved-jobs/mine', { params: { limit: 100 } })
      .then((res) => {
        const ids = new Set<string>(res.data.data.map((s: { job: { _id: string } }) => s.job._id))
        setIsSaved(ids.has(id))
      })
      .catch(() => {})
  }, [user, id])

  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${id}`)
      setJob(res.data.job)
    } catch {
      setError('Failed to load job')
    } finally {
      setLoading(false)
    }
  }

  const fetchResumes = async () => {
    try {
      const res = await api.get('/resumes/mine')
      setResumes(res.data.resumes)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!selectedResume || !id) {
        setAnalysis(null)
        return
      }
      setAnalysisLoading(true)
      try {
        const res = await api.get(`/resumes/${selectedResume}/analysis`, { params: { jobId: id } })
        setAnalysis({
          atsScore: res.data.analysis.atsScore,
          matchScore: res.data.analysis.matchScore,
        })
      } catch {
        setAnalysis(null)
      } finally {
        setAnalysisLoading(false)
      }
    }

    fetchAnalysis()
  }, [selectedResume, id])

  const fetchSimilar = async () => {
    try {
      const res = await api.get(`/jobs/${id}/similar`)
      setSimilarJobs(res.data.data)
    } catch {
      // ignore
    }
  }

  const handleApply = async () => {
    setError('')
    setSuccess('')
    setApplying(true)
    try {
      const res = await api.post('/applications', {
        jobId: id,
        resumeId: selectedResume || undefined,
        coverLetter: coverLetter || undefined,
      })
      const score = res.data?.score
      setSuccess(
        score
          ? `Application submitted! Match score: ${score.match}/100 • ATS score: ${score.ats}/100`
          : 'Application submitted successfully!'
      )
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }

  const handleSaveToggle = async () => {
    if (!user) return
    setSaving(true)
    try {
      if (isSaved) {
        await api.delete(`/jobs/${id}/save`)
        setIsSaved(false)
      } else {
        await api.post(`/jobs/${id}/save`)
        setIsSaved(true)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!job) {
    return <div className="text-center py-12 text-gray-500">Job not found.</div>
  }

  const categoryLabel = CATEGORIES.find((c) => c.value === job.category)?.label || job.category
  const jobTypeLabel = JOB_TYPES.find((t) => t.value === job.jobType)?.label || job.jobType

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => navigate('/jobs')}
        className="text-blue-600 hover:underline text-sm mb-6 block"
      >
        ← Back to Jobs
      </button>

      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{job.title}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                {job.recruiter?.name}
                {job.location && ` • ${job.location}`}
                {job.remote && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-green-100 text-green-700">Remote</span>}
              </p>
            </div>
            {user?.role === 'candidate' && (
              <button
                onClick={handleSaveToggle}
                disabled={saving}
                className={`shrink-0 px-4 py-2 rounded-lg font-medium text-sm border transition-colors ${
                  isSaved
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                {isSaved ? '★ Saved' : '☆ Save Job'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${categoryColors[job.category] || 'bg-gray-100 text-gray-800'}`}
            >
              {categoryLabel}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              {jobTypeLabel}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Job Description</h2>
          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>

        {job.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-400 mb-6">
          Posted: {new Date(job.createdAt).toLocaleDateString()}
        </p>

        {/* Apply section */}
        {user?.role === 'candidate' && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Apply for this Position</h2>

            {success && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {resumes.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Attach Resume (optional)
                </label>
                <select
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">No resume selected</option>
                    {resumes.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.type === 'MANUAL' ? r.title || 'Manual CV' : r.originalName}
                      </option>
                    ))}
                  </select>
                </div>
            )}

            {selectedResume && (
              <div className="mb-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                {analysisLoading ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Calculating ATS and match score...</p>
                ) : analysis ? (
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <p><span className="font-semibold">ATS score:</span> {analysis.atsScore}/100</p>
                    <p><span className="font-semibold">Job match score:</span> {analysis.matchScore ?? 0}/100</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Unable to analyze this resume right now.</p>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cover Letter (optional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell them why you're a great fit..."
              />
            </div>

            <button
              onClick={handleApply}
              disabled={applying || !!success}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? 'Submitting...' : success ? 'Applied!' : 'Apply Now'}
            </button>
          </div>
        )}

        {!user && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="text-gray-600 dark:text-gray-300">
              <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Sign in
              </a>{' '}
              to apply for this position.
            </p>
          </div>
        )}
      </div>

      {/* Similar jobs */}
      {similarJobs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Similar Jobs</h2>
          <div className="grid gap-3">
            {similarJobs.map((sj) => (
              <Link
                key={sj._id}
                to={`/jobs/${sj._id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow block"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{sj.title}</h3>
                    <p className="text-gray-500 text-sm">
                      {sj.recruiter?.name}{sj.location && ` • ${sj.location}`}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[sj.category] || 'bg-gray-100 text-gray-800'}`}>
                        {CATEGORIES.find((c) => c.value === sj.category)?.label || sj.category}
                      </span>
                      {sj.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 ml-4 shrink-0">
                    {new Date(sj.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
