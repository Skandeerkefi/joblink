import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import type { Resume } from '../../types/resume'

interface JobOption {
  _id: string
  title: string
  recruiter?: { name?: string }
}

interface Analysis {
  atsScore: number
  atsBreakdown: Record<string, number | string>
  matchScore: number | null
  matchBreakdown: Record<string, number | string> | null
}

export default function AtsChecker() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [jobs, setJobs] = useState<JobOption[]>([])
  const [resumeId, setResumeId] = useState('')
  const [jobId, setJobId] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [resumesRes, jobsRes] = await Promise.all([
          api.get('/resumes/mine'),
          api.get('/jobs', { params: { limit: 50 } }),
        ])
        const loadedResumes: Resume[] = resumesRes.data.resumes || []
        setResumes(loadedResumes)
        setJobs(jobsRes.data.data || [])
        if (loadedResumes[0]) setResumeId(loadedResumes[0]._id)
      } catch {
        setError('Failed to load ATS checker data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const selectedResume = useMemo(
    () => resumes.find((r) => r._id === resumeId),
    [resumes, resumeId]
  )

  const runCheck = async () => {
    if (!resumeId) return
    setChecking(true)
    setError('')
    try {
      const res = await api.get(`/resumes/${resumeId}/analysis`, {
        params: jobId ? { jobId } : undefined,
      })
      setAnalysis(res.data.analysis)
    } catch {
      setError('Failed to run ATS analysis')
    } finally {
      setChecking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">ATS Checker</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Detailed ATS and match-score analysis for your own CV.</p>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <label className="block text-sm font-medium mb-1">Resume</label>
          <select
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg px-3 py-2 text-sm"
          >
            {resumes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.type === 'MANUAL' ? r.title || 'Manual CV' : r.originalName || 'Uploaded CV'}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <label className="block text-sm font-medium mb-1">Optional Job (for match score)</label>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-lg px-3 py-2 text-sm"
          >
            <option value="">No job selected</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title}{j.recruiter?.name ? ` — ${j.recruiter.name}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-end">
          <button
            disabled={!resumeId || checking}
            onClick={runCheck}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Run ATS Check'}
          </button>
        </div>
      </div>

      {!selectedResume ? (
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400">
          Upload or create a resume first.
        </div>
      ) : analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-3">ATS Result</h2>
            <div className="text-3xl font-bold text-blue-600 mb-4">{analysis.atsScore}/100</div>
            <div className="space-y-2 text-sm">
              {Object.entries(analysis.atsBreakdown || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-1">
                  <span className="capitalize text-gray-600 dark:text-gray-300">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-3">Match Result</h2>
            <div className="text-3xl font-bold text-indigo-600 mb-4">{analysis.matchScore ?? '—'}{analysis.matchScore !== null ? '/100' : ''}</div>
            {analysis.matchBreakdown ? (
              <div className="space-y-2 text-sm">
                {Object.entries(analysis.matchBreakdown).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-1">
                    <span className="capitalize text-gray-600 dark:text-gray-300">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Select a job to see detailed match analysis.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400">
          Select a resume and run ATS check.
        </div>
      )}
    </div>
  )
}
