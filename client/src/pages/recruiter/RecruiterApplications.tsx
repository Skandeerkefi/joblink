import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import { APPLICATION_STATUSES } from '../../constants/categories'
import { API_BASE_URL } from '../../constants/config'

interface ResumeManualData {
  personalInfo?: { fullName?: string; email?: string }
  summary?: string
  skills?: string[]
  experience?: Array<{ title?: string; company?: string }>
}

interface Application {
  _id: string
  job: {
    _id: string
    title: string
    location: string
    category?: string
  }
  candidate: {
    _id: string
    name: string
    email: string
  }
  resume?: {
    type?: 'UPLOAD' | 'MANUAL'
    title?: string
    originalName?: string
    fileUrl?: string
    manualData?: ResumeManualData
  }
  status: string
  coverLetter?: string
  atsScore?: number
  atsBreakdown?: Record<string, number | string>
  matchScore?: number
  matchBreakdown?: Record<string, number | string>
  createdAt: string
}

interface GroupedApplications {
  job: Application['job']
  applications: Application[]
}

const ATS_MAX_POINTS: Record<string, number> = {
  contact: 20,
  structure: 25,
  length: 20,
  content: 35,
  format: 20,
  summary: 15,
  skills: 20,
  experience: 20,
  education: 10,
  projects: 10,
  certifications: 5,
}

const MATCH_MAX_POINTS: Record<string, number> = {
  skillScore: 70,
  keywordScore: 25,
  categoryBonus: 5,
}

const BREAKDOWN_LABELS: Record<string, string> = {
  contact: 'Contact',
  structure: 'Structure',
  length: 'Length',
  content: 'Content',
  format: 'Format',
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  certifications: 'Certifications',
  skillScore: 'Skill fit',
  keywordScore: 'Keyword fit',
  categoryBonus: 'Category bonus',
}

const scoreToTen = (value: number, max: number) => {
  if (max <= 0) return 0
  const scaled = Math.round((Math.max(0, value) / max) * 10)
  return Math.max(0, Math.min(10, scaled))
}

const formatScoreDetails = (
  breakdown: Record<string, number | string> | undefined,
  maxMap: Record<string, number>
) => {
  if (!breakdown) return []
  return Object.entries(breakdown)
    .filter(([key, value]) => typeof value === 'number' && key in maxMap)
    .map(([key, value]) => {
      const max = maxMap[key]
      const label = BREAKDOWN_LABELS[key] || key
      const scaled = scoreToTen(value as number, max)
      return `${label}: ${scaled}/10`
    })
}

const sortByMatchThenDate = (a: Application, b: Application) => {
  const matchA = a.matchScore ?? -1
  const matchB = b.matchScore ?? -1
  if (matchB !== matchA) return matchB - matchA
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
    const parseThreshold = (value: string) => {
      if (value.trim() === '') return null
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }
    const atsThreshold = parseThreshold(minAts)
    const matchThreshold = parseThreshold(minMatch)

    return [...applications]
      .filter((a) => (statusFilter === 'ALL' ? true : a.status === statusFilter))
      .filter((a) => (atsThreshold === null ? true : (a.atsScore ?? -1) >= atsThreshold))
      .filter((a) => (matchThreshold === null ? true : (a.matchScore ?? -1) >= matchThreshold))
      .sort(sortByMatchThenDate)
  }, [applications, minAts, minMatch, statusFilter])

  const groupedByJob = useMemo<GroupedApplications[]>(() => {
    const byJob = new Map<string, GroupedApplications>()
    filtered.forEach((app) => {
      const jobId = app.job?._id
      if (!jobId) return
      if (!byJob.has(jobId)) {
        byJob.set(jobId, { job: app.job, applications: [] })
      }
      byJob.get(jobId)?.applications.push(app)
    })
    return [...byJob.values()].map((group) => ({
      ...group,
      applications: [...group.applications].sort(sortByMatchThenDate),
    }))
  }, [filtered])

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
          Grouped by your job posts and sorted by <span className="font-semibold">match score</span>.
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
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
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
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
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
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
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

      {groupedByJob.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No applications match the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByJob.map((group) => (
            <section
              key={group.job._id}
              className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">{group.job.title}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {group.job.location || 'No location'} • {group.applications.length} application(s)
                </p>
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[1080px]">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Candidate</th>
                      <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">ATS</th>
                      <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Match</th>
                      <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Status</th>
                      <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">CV</th>
                      <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {group.applications.map((app) => {
                      const atsDetails = formatScoreDetails(app.atsBreakdown, ATS_MAX_POINTS)
                      const matchDetails = formatScoreDetails(app.matchBreakdown, MATCH_MAX_POINTS)
                      const matchedSkills = app.matchBreakdown?.matchedSkills
                      const requiredSkills = app.matchBreakdown?.requiredSkills
                      return (
                        <tr key={app._id}>
                          <td className="px-4 py-3 align-top">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{app.candidate?.name}</div>
                            <div className="text-xs text-gray-500">{app.candidate?.email}</div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="text-sm font-semibold text-blue-600">{app.atsScore ?? '—'}/100</div>
                            {atsDetails.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">{atsDetails.join(' • ')}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="text-sm font-semibold text-indigo-600">{app.matchScore ?? '—'}/100</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {typeof matchedSkills === 'number' && typeof requiredSkills === 'number'
                                ? `Skills matched: ${matchedSkills}/${requiredSkills}`
                                : null}
                              {matchDetails.length > 0
                                ? `${typeof matchedSkills === 'number' && typeof requiredSkills === 'number' ? ' • ' : ''}${matchDetails.join(' • ')}`
                                : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <select
                              value={app.status}
                              disabled={updatingId === app._id}
                              onChange={(e) => changeStatus(app._id, e.target.value)}
                              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm"
                            >
                              {APPLICATION_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 align-top">
                            {app.resume?.fileUrl ? (
                              <a
                                href={`${API_BASE_URL}${app.resume.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {app.resume.originalName || 'View CV'}
                              </a>
                            ) : app.resume?.type === 'MANUAL' ? (
                              <div className="text-xs text-gray-700 dark:text-gray-300">
                                <div className="font-medium">{app.resume.title || 'Manual CV'}</div>
                                <div className="text-gray-500">
                                  Skills: {app.resume.manualData?.skills?.length || 0} • Experience: {app.resume.manualData?.experience?.length || 0}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-500">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3 p-3">
                {group.applications.map((app) => {
                  const atsDetails = formatScoreDetails(app.atsBreakdown, ATS_MAX_POINTS)
                  const matchDetails = formatScoreDetails(app.matchBreakdown, MATCH_MAX_POINTS)
                  return (
                    <div
                      key={app._id}
                      className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
                    >
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{app.candidate?.name}</div>
                      <div className="text-xs text-gray-500 mb-2">{app.candidate?.email}</div>
                      <div className="grid grid-cols-1 gap-1 text-sm mb-3">
                        <div>
                          ATS: <span className="font-semibold text-blue-600">{app.atsScore ?? '—'}/100</span>
                          {atsDetails.length > 0 && (
                            <div className="text-xs text-gray-500 mt-0.5">{atsDetails.join(' • ')}</div>
                          )}
                        </div>
                        <div>
                          Match: <span className="font-semibold text-indigo-600">{app.matchScore ?? '—'}/100</span>
                          {matchDetails.length > 0 && (
                            <div className="text-xs text-gray-500 mt-0.5">{matchDetails.join(' • ')}</div>
                          )}
                        </div>
                        {app.resume?.fileUrl ? (
                          <a
                            href={`${API_BASE_URL}${app.resume.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {app.resume.originalName || 'View CV'}
                          </a>
                        ) : app.resume?.type === 'MANUAL' ? (
                          <div className="text-xs text-gray-500">
                            {app.resume.title || 'Manual CV'} • Skills: {app.resume.manualData?.skills?.length || 0}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <select
                          value={app.status}
                          disabled={updatingId === app._id}
                          onChange={(e) => changeStatus(app._id, e.target.value)}
                          className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm"
                        >
                          {APPLICATION_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
