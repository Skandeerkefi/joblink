import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { CATEGORIES, JOB_TYPES } from '../constants/categories'
import { TUNISIA_GOVERNORATES } from '../constants/tunisiaGovernorates'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

interface Job {
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

export default function Jobs() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)

  // Filter state
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedJobType, setSelectedJobType] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [skillsInput, setSkillsInput] = useState('')
  const [skillsQuery, setSkillsQuery] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [sort, setSort] = useState('newest')

  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number | boolean> = { page, limit: LIMIT }
      if (selectedCategory) params.category = selectedCategory
      if (searchQuery) params.q = searchQuery
      if (selectedJobType) params.jobType = selectedJobType
      if (locationQuery) params.location = locationQuery
      if (skillsQuery) params.skills = skillsQuery
      if (remoteOnly) params.remote = true
      if (sort) params.sort = sort
      const res = await api.get('/jobs', { params })
      setJobs(res.data.data)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch {
      setError('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchQuery, selectedJobType, locationQuery, skillsQuery, remoteOnly, sort, page])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Fetch saved jobs for candidates to show save state
  useEffect(() => {
    if (user?.role !== 'candidate') return
    api.get('/saved-jobs/mine', { params: { limit: 100 } })
      .then((res) => {
        const ids = new Set<string>(res.data.data.map((s: { job: { _id: string } }) => s.job._id))
        setSavedJobIds(ids)
      })
      .catch(() => {})
  }, [user])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearchQuery(searchInput)
    setSkillsQuery(skillsInput)
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    setPage(1)
  }

  const handleSortChange = (value: string) => {
    setSort(value)
    setPage(1)
  }

  const handleClearFilters = () => {
    setSelectedCategory('')
    setSearchInput('')
    setSearchQuery('')
    setLocationQuery('')
    setSkillsInput('')
    setSkillsQuery('')
    setSelectedJobType('')
    setRemoteOnly(false)
    setSort('newest')
    setPage(1)
  }

  const handleSaveToggle = async (e: React.MouseEvent, jobId: string) => {
    e.preventDefault()
    if (!user) return
    setSavingId(jobId)
    try {
      if (savedJobIds.has(jobId)) {
        await api.delete(`/jobs/${jobId}/save`)
        setSavedJobIds((prev) => {
          const next = new Set(prev)
          next.delete(jobId)
          return next
        })
      } else {
        await api.post(`/jobs/${jobId}/save`)
        setSavedJobIds((prev) => new Set(prev).add(jobId))
      }
    } catch {
      // ignore
    } finally {
      setSavingId(null)
    }
  }

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)?.label || value
  }

  const getJobTypeLabel = (value: string) => {
    return JOB_TYPES.find((t) => t.value === value)?.label || value.replace(/_/g, ' ')
  }

  const hasActiveFilters = [
    selectedCategory,
    searchQuery,
    locationQuery,
    skillsQuery,
    selectedJobType,
    remoteOnly,
    sort !== 'newest',
  ].some(Boolean)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.jobs.title}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t.jobs.subtitle}</p>
      </div>

      {/* Search + filters */}
      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-3">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t.jobs.searchPlaceholder}
            className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <select
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="w-full sm:w-52 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">{t.jobs.allGovernorates}</option>
            {TUNISIA_GOVERNORATES.map((gov) => (
              <option key={gov} value={gov}>
                {gov}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder={t.jobs.skillsPlaceholder}
            className="w-full sm:w-48 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm whitespace-nowrap"
          >
            {t.jobs.search}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">{t.jobs.allCategories}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={selectedJobType}
            onChange={(e) => { setSelectedJobType(e.target.value); setPage(1) }}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">{t.jobs.allTypes}</option>
            {JOB_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => { setRemoteOnly(e.target.checked); setPage(1) }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            {t.jobs.remoteOnly}
          </label>

          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title A–Z</option>
            {searchQuery && <option value="relevance">Relevance</option>}
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:underline"
            >
              {t.jobs.clearAllFilters}
            </button>
          )}
          {total > 0 && (
            <span className="text-sm text-gray-400 ml-auto">
              {total} job{total !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
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
          <p className="text-lg">No jobs found{hasActiveFilters ? ' matching your filters' : ''}.</p>
          {hasActiveFilters && (
              <button onClick={handleClearFilters} className="text-blue-600 hover:underline mt-2 block mx-auto">
                {t.jobs.clearFilters}
              </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 mb-6">
            {jobs.map((job) => (
              <Link
                key={job._id}
                to={`/jobs/${job._id}`}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow block"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h2>
                    <p className="text-gray-500 text-sm mb-3">
                      {job.recruiter?.name}
                      {job.location && ` • ${job.location}`}
                      {job.remote && <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Remote</span>}
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
                  <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                    <span className="text-sm text-gray-400 whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    {user?.role === 'candidate' && (
                      <button
                        onClick={(e) => handleSaveToggle(e, job._id)}
                        disabled={savingId === job._id}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                          savedJobIds.has(job._id)
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
                            : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                        } disabled:opacity-50`}
                      >
                        {savedJobIds.has(job._id) ? '★ Saved' : '☆ Save'}
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
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
