import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PDFDownloadLink } from '@react-pdf/renderer'
import api from '../../api/axios'
import { API_BASE_URL } from '../../constants/config'
import ResumePdf from '../../components/ResumePdf'
import type { Resume } from '../../types/resume'
import { emptyManualData } from '../../types/resume'

export default function MyResumes() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [atsByResume, setAtsByResume] = useState<Record<string, number>>({})
  const [checkingAtsId, setCheckingAtsId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const res = await api.get('/resumes/mine')
      setResumes(res.data.resumes)
    } catch {
      setError('Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('resume', file)
      const res = await api.post('/resumes/manual/prefill', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const draft = res.data?.draft
      setFile(null)
      ;(e.target as HTMLFormElement).reset()
      navigate('/candidate/resumes/new', {
        state: {
          prefillTitle: draft?.title,
          prefillData: draft?.manualData,
        },
      })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'CV import failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resume?')) return
    try {
      await api.delete(`/resumes/${id}`)
      setResumes(resumes.filter((r) => r._id !== id))
    } catch {
      setError('Failed to delete resume')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '—'
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  const handleCheckAts = async (resumeId: string) => {
    setCheckingAtsId(resumeId)
    try {
      const res = await api.get(`/resumes/${resumeId}/analysis`)
      setAtsByResume((prev) => ({ ...prev, [resumeId]: res.data.analysis.atsScore }))
    } catch {
      setError('Failed to calculate ATS score')
    } finally {
      setCheckingAtsId(null)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Resumes</h1>

      {/* Action choice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Import CV to manual editor card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Import CV to Manual Editor</h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload a CV file, auto-fill the manual form, then review and save to confirm.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleUpload} className="flex flex-col gap-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              type="submit"
              disabled={uploading || !file}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
                {uploading ? 'Importing...' : 'Import & Edit'}
              </button>
            </form>
          </div>

        {/* Create Manual CV card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Create CV Manually</h2>
          <p className="text-sm text-gray-500 mb-4">
            Build a professional CV with our editor — fill in your experience, skills and more, then export to PDF.
          </p>
          <button
            onClick={() => navigate('/candidate/resumes/new')}
            className="mt-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium text-sm"
          >
            + Create Manual CV
          </button>
        </div>
      </div>

      {/* Resume list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No resumes yet. Import a CV into the editor or create one manually.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Size / Info</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">ATS Score</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resumes.map((resume) => (
                <tr key={resume._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {resume.type === 'UPLOAD' ? (
                      <a
                        href={`${API_BASE_URL}${resume.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {resume.originalName}
                      </a>
                    ) : (
                      <span className="font-medium text-gray-900">{resume.title || 'Manual CV'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        resume.type === 'MANUAL'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {resume.type === 'MANUAL' ? 'Manual' : 'Upload'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {resume.type === 'UPLOAD' ? formatFileSize(resume.fileSize ?? 0) : 'Structured data'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {atsByResume[resume._id] !== undefined ? `${atsByResume[resume._id]}/100` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(resume.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCheckAts(resume._id)}
                        className="text-cyan-600 hover:text-cyan-800 text-sm font-medium"
                        disabled={checkingAtsId === resume._id}
                      >
                        {checkingAtsId === resume._id ? 'Checking...' : 'ATS Check'}
                      </button>
                      {resume.type === 'MANUAL' && (
                        <>
                          <button
                            onClick={() => navigate(`/candidate/resumes/${resume._id}/edit`)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <PDFDownloadLink
                            document={<ResumePdf data={resume.manualData ?? emptyManualData()} />}
                            fileName={`${resume.title || 'cv'}.pdf`}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            {({ loading: pdfLoading }) => pdfLoading ? '...' : 'PDF'}
                          </PDFDownloadLink>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(resume._id)}
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
