import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import type { Resume } from '../../types/resume'
import { CATEGORIES, getSubcategoriesByCategory, getSubcategoryLabel } from '../../constants/categories'

interface JobOption {
  _id: string
  title: string
  category: string
  subCategory?: string
  recruiter?: { name?: string }
}

interface Analysis {
  atsScore: number
  atsBreakdown: Record<string, number | string | string[]>
  matchScore: number | null
  matchBreakdown: Record<string, number | string | string[]> | null
}
const MATCH_METADATA_KEYS = new Set(['tips', 'missingRequiredSkills', 'missingTools', 'formula'])

export default function AtsChecker() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [jobs, setJobs] = useState<JobOption[]>([])
  const [resumeId, setResumeId] = useState('')
  const [jobId, setJobId] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [jobsLoading, setJobsLoading] = useState(false)
  const [error, setError] = useState('')

  const [jobSearchInput, setJobSearchInput] = useState('')
  const [jobSearch, setJobSearch] = useState('')
  const [jobCategory, setJobCategory] = useState('')
  const [jobSubCategory, setJobSubCategory] = useState('')

  useEffect(() => {
    const loadResumes = async () => {
      setLoading(true)
      setError('')
      try {
        const resumesRes = await api.get('/resumes/mine')
        const loadedResumes: Resume[] = resumesRes.data.resumes || []
        setResumes(loadedResumes)
        if (loadedResumes[0]) setResumeId(loadedResumes[0]._id)
      } catch {
        setError('Failed to load ATS checker data')
      } finally {
        setLoading(false)
      }
    }
    loadResumes()
  }, [])

  useEffect(() => {
    const loadJobs = async () => {
      setJobsLoading(true)
      try {
        const params: Record<string, string | number> = { limit: 50, sort: 'newest' }
        if (jobSearch) params.q = jobSearch
        if (jobCategory) params.category = jobCategory
        if (jobSubCategory) params.subCategory = jobSubCategory
        const jobsRes = await api.get('/jobs', { params })
        setJobs(jobsRes.data.data || [])
      } catch {
        setJobs([])
      } finally {
        setJobsLoading(false)
      }
    }
    loadJobs()
  }, [jobSearch, jobCategory, jobSubCategory])

  useEffect(() => {
    if (jobId && !jobs.some((job) => job._id === jobId)) {
      setJobId('')
    }
  }, [jobs, jobId])

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
      <div className="mb-6 rounded-2xl border border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">ATS Checker</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Compare your CV with specific jobs using smarter filtering.</p>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-4">
        <p className="text-sm font-semibold mb-3">Job filter (to avoid long scrolling)</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={jobSearchInput}
            onChange={(e) => setJobSearchInput(e.target.value)}
            placeholder="Search job title"
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={jobCategory}
            onChange={(e) => {
              setJobCategory(e.target.value)
              setJobSubCategory('')
            }}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <select
            value={jobSubCategory}
            onChange={(e) => setJobSubCategory(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All domains</option>
            {getSubcategoriesByCategory(jobCategory).map((sc) => (
              <option key={sc.value} value={sc.value}>{sc.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setJobSearch(jobSearchInput.trim())}
              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setJobSearchInput('')
                setJobSearch('')
                setJobCategory('')
                setJobSubCategory('')
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <label className="block text-sm font-medium mb-1">Resume</label>
          <select
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
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
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">No job selected</option>
            {jobs.map((j) => {
              const categoryLabel = CATEGORIES.find((c) => c.value === j.category)?.label || j.category
              const domainLabel = getSubcategoryLabel(j.category, j.subCategory)
              return (
                <option key={j._id} value={j._id}>
                  {j.title} • {categoryLabel}{domainLabel ? ` / ${domainLabel}` : ''}{j.recruiter?.name ? ` — ${j.recruiter.name}` : ''}
                </option>
              )
            })}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {jobsLoading ? 'Loading jobs...' : `${jobs.length} jobs available with current filter`}
          </p>
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
              <div className="space-y-2 text-sm mb-4">
                {Object.entries(analysis.matchBreakdown)
                  .filter(([k]) => !MATCH_METADATA_KEYS.has(k))
                  .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-1">
                    <span className="capitalize text-gray-600 dark:text-gray-300">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Select a job to see detailed match analysis.</p>
            )}

            {analysis.matchBreakdown?.formula && (
              <div className="mt-3 rounded-lg border border-indigo-100 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/30 p-3">
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">Scoring Formula</p>
                <p className="text-xs text-indigo-700 dark:text-indigo-200">{String(analysis.matchBreakdown.formula)}</p>
              </div>
            )}

            {Array.isArray(analysis.matchBreakdown?.tips) && analysis.matchBreakdown.tips.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">How to improve your match</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-amber-900 dark:text-amber-100">
                  {analysis.matchBreakdown.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
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
