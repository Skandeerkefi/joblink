import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import { APPLICATION_STATUSES } from '../../constants/categories'
import { API_BASE_URL } from '../../constants/config'

interface ResumeManualData {
  personalInfo?: { fullName?: string; email?: string }
  summary?: string
  skills?: string[]
  experience?: Array<{
    title?: string
    company?: string
    location?: string
    startDate?: string
    endDate?: string
    current?: boolean
    bullets?: string[]
  }>
  education?: Array<{
    school?: string
    degree?: string
    field?: string
    startYear?: string
    endYear?: string
    details?: string
  }>
  projects?: Array<{
    name?: string
    link?: string
    description?: string
    bullets?: string[]
  }>
  certifications?: Array<{
    name?: string
    issuer?: string
    issueDate?: string
    credentialId?: string
    link?: string
  }>
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
  atsBreakdown?: Record<string, number | string | string[]>
  matchScore?: number
  matchBreakdown?: Record<string, number | string | string[]>
  interviewAt?: string
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
  skillsMatch: 100,
  experienceMatch: 100,
  educationMatch: 100,
  keywordsToolsMatch: 100,
  bonus: 100,
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
  skillsMatch: 'Skills match',
  experienceMatch: 'Experience match',
  educationMatch: 'Education match',
  keywordsToolsMatch: 'Keywords/tools match',
  bonus: 'Bonus',
}

const scoreToTen = (value: number, max: number) => {
  if (max <= 0) return 0
  const scaled = Math.round((Math.max(0, value) / max) * 10)
  return Math.max(0, Math.min(10, scaled))
}

const formatScoreDetails = (
  breakdown: Record<string, number | string | string[]> | undefined,
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

const DATETIME_LOCAL_LENGTH = 16

const toDatetimeLocalValue = (dateTime?: string) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, DATETIME_LOCAL_LENGTH)
}

export default function RecruiterApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedManualApplication, setSelectedManualApplication] = useState<Application | null>(null)
  const [interviewScheduleTarget, setInterviewScheduleTarget] = useState<Application | null>(null)
  const [interviewDateTimeInput, setInterviewDateTimeInput] = useState('')

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

  useEffect(() => {
    if (!selectedManualApplication) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedManualApplication(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedManualApplication])

  useEffect(() => {
    if (!interviewScheduleTarget) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setInterviewScheduleTarget(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [interviewScheduleTarget])

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

  const changeStatus = async (id: string, status: string, interviewAt?: string) => {
    setUpdatingId(id)
    setError('')
    try {
      await api.patch(`/applications/${id}/status`, { status, interviewAt })
      setApplications((prev) =>
        prev.map((a) =>
          a._id === id
            ? { ...a, status, interviewAt: status === 'INTERVIEW' ? interviewAt || a.interviewAt : undefined }
            : a
        )
      )
    } catch {
      setError('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleStatusChange = async (app: Application, status: string) => {
    if (status !== 'INTERVIEW') {
      await changeStatus(app._id, status)
      return
    }

    setInterviewScheduleTarget(app)
    setInterviewDateTimeInput(toDatetimeLocalValue(app.interviewAt))
  }

  const scheduleInterview = async () => {
    if (!interviewScheduleTarget) return
    if (!interviewDateTimeInput) {
      setError('Please choose an interview date/time')
      return
    }
    const interviewDate = new Date(interviewDateTimeInput)
    if (Number.isNaN(interviewDate.getTime())) {
      setError('Invalid interview date/time')
      return
    }
    await changeStatus(interviewScheduleTarget._id, 'INTERVIEW', interviewDate.toISOString())
    setInterviewScheduleTarget(null)
    setInterviewDateTimeInput('')
  }

  const manualSkills = (selectedManualApplication?.resume?.manualData?.skills || []).filter(Boolean)
  const uniqueManualSkills = [...new Set(manualSkills)]

  const formatExperienceDates = (
    startDate?: string,
    endDate?: string,
    current?: boolean
  ) => {
    if (!startDate && !endDate && !current) return ''
    if (!startDate && current) return 'Present'
    if (!startDate) return endDate || ''
    if (current) return `${startDate} - Present`
    if (!endDate) return startDate
    return `${startDate} - ${endDate}`
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
                      <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Interview</th>
                      <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">CV</th>
                      <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {group.applications.map((app) => {
                      const atsDetails = formatScoreDetails(app.atsBreakdown, ATS_MAX_POINTS)
                      const matchDetails = formatScoreDetails(app.matchBreakdown, MATCH_MAX_POINTS)
                      const matchedSkills =
                        app.matchBreakdown?.matchedRequiredSkills ?? app.matchBreakdown?.matchedSkills
                      const requiredSkills = app.matchBreakdown?.requiredSkills
                      const hasSkillMatchCounts =
                        typeof matchedSkills === 'number' && typeof requiredSkills === 'number'
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
                              {hasSkillMatchCounts ? `Skills matched: ${matchedSkills}/${requiredSkills}` : null}
                              {matchDetails.length > 0
                                ? `${hasSkillMatchCounts ? ' • ' : ''}${matchDetails.join(' • ')}`
                                : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <select
                               value={app.status}
                               disabled={updatingId === app._id}
                               onChange={(e) => handleStatusChange(app, e.target.value)}
                               className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm"
                             >
                              {APPLICATION_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-500">
                            {app.interviewAt ? new Date(app.interviewAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-3 align-top">
                            {app.resume?.fileUrl ? (
                              <a
                                href={`${API_BASE_URL}${app.resume.fileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {app.resume.originalName || 'View CV'}
                              </a>
                            ) : app.resume?.type === 'MANUAL' ? (
                              <div className="text-xs text-gray-700 dark:text-gray-300">
                                <div className="font-medium">{app.resume.title || 'Manual CV'}</div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedManualApplication(app)}
                                  className="mt-2 text-blue-600 hover:underline"
                                >
                                  View CV
                                </button>
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
                        <div>
                          Interview:{' '}
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {app.interviewAt ? new Date(app.interviewAt).toLocaleString() : '—'}
                          </span>
                        </div>
                        {app.resume?.fileUrl ? (
                          <a
                            href={`${API_BASE_URL}${app.resume.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {app.resume.originalName || 'View CV'}
                          </a>
                        ) : app.resume?.type === 'MANUAL' ? (
                          <div className="text-xs text-gray-500">
                            {app.resume.title || 'Manual CV'}
                            <div>
                              <button
                                type="button"
                                onClick={() => setSelectedManualApplication(app)}
                                className="mt-1 text-sm text-blue-600 hover:underline"
                              >
                                View CV
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <select
                          value={app.status}
                          disabled={updatingId === app._id}
                          onChange={(e) => handleStatusChange(app, e.target.value)}
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

      {interviewScheduleTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(event) => {
            if (event.currentTarget === event.target) setInterviewScheduleTarget(null)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="interview-scheduler-title"
            className="bg-white dark:bg-gray-950 w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-800 p-4"
          >
            <h3 id="interview-scheduler-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Schedule interview
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {interviewScheduleTarget.candidate?.name} • {interviewScheduleTarget.job?.title}
            </p>
            <label htmlFor="interview-datetime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Interview date & time
            </label>
            <input
              id="interview-datetime"
              type="datetime-local"
              value={interviewDateTimeInput}
              onChange={(event) => setInterviewDateTimeInput(event.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInterviewScheduleTarget(null)}
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={scheduleInterview}
                disabled={updatingId === interviewScheduleTarget._id}
                className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedManualApplication?.resume?.type === 'MANUAL' && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(event) => {
            if (event.currentTarget === event.target) setSelectedManualApplication(null)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-cv-viewer-title"
            className="bg-white dark:bg-gray-950 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-start justify-between gap-4">
              <div>
                <h3 id="manual-cv-viewer-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedManualApplication.resume.title || 'Manual CV'}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedManualApplication.candidate?.name} • {selectedManualApplication.candidate?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedManualApplication(null)}
                aria-label="Close CV viewer dialog"
                className="text-sm border border-gray-300 dark:border-gray-700 rounded px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-5 text-sm">
              <section>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Personal Info</h4>
                <div className="text-gray-700 dark:text-gray-300 space-y-1">
                  <div>
                    {selectedManualApplication.resume.manualData?.personalInfo?.fullName || 'No full name provided'}
                  </div>
                  {selectedManualApplication.resume.manualData?.personalInfo?.email && (
                    <div>{selectedManualApplication.resume.manualData.personalInfo.email}</div>
                  )}
                </div>
              </section>

              {selectedManualApplication.resume.manualData?.summary && (
                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Summary</h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedManualApplication.resume.manualData.summary}
                  </p>
                </section>
              )}

              {uniqueManualSkills.length > 0 && (
                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {uniqueManualSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {(selectedManualApplication.resume.manualData?.experience || []).length > 0 && (
                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Experience</h4>
                  <div className="space-y-3">
                    {(selectedManualApplication.resume.manualData?.experience || []).map((exp) => {
                      const bullets = (exp.bullets || []).filter(Boolean)
                      const experienceKey = [exp.title, exp.company, exp.startDate, exp.endDate, exp.location]
                        .filter(Boolean)
                        .join('|') || 'experience'
                      return (
                        <div key={experienceKey} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {exp.title || 'Role'}{exp.company ? ` — ${exp.company}` : ''}
                          </div>
                          {(exp.location || exp.startDate || exp.endDate || exp.current) && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {[exp.location, formatExperienceDates(exp.startDate, exp.endDate, exp.current)].filter(Boolean).join(' • ')}
                            </div>
                          )}
                          {bullets.length > 0 && (
                            <ul className="list-disc pl-5 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                              {bullets.map((bullet, bulletIndex) => (
                                <li key={`${experienceKey}-bullet-${bulletIndex}`}>{bullet}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {(selectedManualApplication.resume.manualData?.education || []).length > 0 && (
                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Education</h4>
                  <div className="space-y-3">
                    {(selectedManualApplication.resume.manualData?.education || []).map((edu) => {
                      const educationKey = [edu.school, edu.degree, edu.field, edu.startYear, edu.endYear]
                        .filter(Boolean)
                        .join('|') || 'education'
                      return (
                        <div key={educationKey} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {edu.degree || 'Degree'}{edu.field ? ` in ${edu.field}` : ''}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {[edu.school, [edu.startYear, edu.endYear].filter(Boolean).join(' - ')].filter(Boolean).join(' • ')}
                          </div>
                          {edu.details && (
                            <p className="mt-2 text-gray-700 dark:text-gray-300">{edu.details}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {(selectedManualApplication.resume.manualData?.projects || []).length > 0 && (
                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Projects</h4>
                  <div className="space-y-3">
                    {(selectedManualApplication.resume.manualData?.projects || []).map((project) => {
                      const projectKey = [project.name, project.description, project.link]
                        .filter(Boolean)
                        .join('|') || 'project'
                      return (
                        <div key={projectKey} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{project.name || 'Project'}</div>
                          {project.description && (
                            <p className="mt-1 text-gray-700 dark:text-gray-300">{project.description}</p>
                          )}
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open project link in a new tab"
                              className="mt-1 inline-block text-blue-600 hover:underline"
                            >
                              {project.link}
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {(selectedManualApplication.resume.manualData?.certifications || []).length > 0 && (
                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Certifications</h4>
                  <div className="space-y-3">
                    {(selectedManualApplication.resume.manualData?.certifications || []).map((cert) => {
                      const certKey = [cert.name, cert.issuer, cert.issueDate, cert.credentialId]
                        .filter(Boolean)
                        .join('|') || 'certification'
                      return (
                        <div key={certKey} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{cert.name || 'Certification'}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {[cert.issuer, cert.issueDate, cert.credentialId ? `ID: ${cert.credentialId}` : ''].filter(Boolean).join(' • ')}
                          </div>
                          {cert.link && (
                            <a
                              href={cert.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open certification link in a new tab"
                              className="mt-1 inline-block text-blue-600 hover:underline"
                            >
                              {cert.link}
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
