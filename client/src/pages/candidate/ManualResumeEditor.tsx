import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PDFDownloadLink } from '@react-pdf/renderer'
import api from '../../api/axios'
import ResumePdf from '../../components/ResumePdf'
import type { ManualData, Education, Experience, Project, Certification } from '../../types/resume'
import { emptyManualData } from '../../types/resume'

type Section = 'personal' | 'summary' | 'skills' | 'certifications' | 'education' | 'experience' | 'projects'

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'personal', label: 'Personal Info' },
  { key: 'summary', label: 'Summary' },
  { key: 'skills', label: 'Skills' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'education', label: 'Education' },
  { key: 'experience', label: 'Experience' },
  { key: 'projects', label: 'Projects' },
]

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

export default function ManualResumeEditor() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [title, setTitle] = useState('My CV')
  const [data, setData] = useState<ManualData>(emptyManualData())
  const [activeSection, setActiveSection] = useState<Section>('personal')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isEdit && id) {
      api.get(`/resumes/${id}`)
        .then((res) => {
          const r = res.data.resume
          setTitle(r.title || 'My CV')
          setData({ ...emptyManualData(), ...(r.manualData || {}) })
        })
        .catch(() => setError('Failed to load resume'))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const updatePersonal = (key: string, value: string) =>
    setData((d) => ({ ...d, personalInfo: { ...d.personalInfo, [key]: value } }))

  const updateLinks = (index: number, value: string) => {
    const links = [...(data.personalInfo.links || [])]
    links[index] = value
    setData((d) => ({ ...d, personalInfo: { ...d.personalInfo, links } }))
  }
  const addLink = () =>
    setData((d) => ({ ...d, personalInfo: { ...d.personalInfo, links: [...(d.personalInfo.links || []), ''] } }))
  const removeLink = (i: number) =>
    setData((d) => ({ ...d, personalInfo: { ...d.personalInfo, links: d.personalInfo.links.filter((_, idx) => idx !== i) } }))

  // Skills
  const [skillInput, setSkillInput] = useState('')
  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (!trimmed) return
    setData((d) => ({ ...d, skills: [...d.skills, trimmed] }))
    setSkillInput('')
  }
  const removeSkill = (i: number) =>
    setData((d) => ({ ...d, skills: d.skills.filter((_, idx) => idx !== i) }))

  // Certifications
  const addCertification = () =>
    setData((d) => ({
      ...d,
      certifications: [
        ...(d.certifications || []),
        { name: '', issuer: '', issueDate: '', credentialId: '', link: '' },
      ],
    }))
  const updateCertification = (i: number, key: keyof Certification, val: string) => {
    const arr = [...(data.certifications || [])]
    arr[i] = { ...arr[i], [key]: val }
    setData((d) => ({ ...d, certifications: arr }))
  }
  const removeCertification = (i: number) =>
    setData((d) => ({ ...d, certifications: (d.certifications || []).filter((_, idx) => idx !== i) }))

  // Education helpers
  const addEducation = () =>
    setData((d) => ({ ...d, education: [...d.education, { school: '', degree: '', field: '', startYear: '', endYear: '', details: '' }] }))
  const updateEducation = (i: number, key: keyof Education, val: string) => {
    const arr = [...data.education]
    arr[i] = { ...arr[i], [key]: val }
    setData((d) => ({ ...d, education: arr }))
  }
  const removeEducation = (i: number) =>
    setData((d) => ({ ...d, education: d.education.filter((_, idx) => idx !== i) }))

  // Experience helpers
  const addExperience = () =>
    setData((d) => ({ ...d, experience: [...d.experience, { company: '', title: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] }] }))
  const updateExperience = (i: number, key: keyof Experience, val: string | boolean | string[]) => {
    const arr = [...data.experience]
    arr[i] = { ...arr[i], [key]: val }
    setData((d) => ({ ...d, experience: arr }))
  }
  const removeExperience = (i: number) =>
    setData((d) => ({ ...d, experience: d.experience.filter((_, idx) => idx !== i) }))
  const updateExpBullet = (ei: number, bi: number, val: string) => {
    const arr = [...data.experience]
    const bullets = [...arr[ei].bullets]
    bullets[bi] = val
    arr[ei] = { ...arr[ei], bullets }
    setData((d) => ({ ...d, experience: arr }))
  }
  const addExpBullet = (ei: number) => {
    const arr = [...data.experience]
    arr[ei] = { ...arr[ei], bullets: [...arr[ei].bullets, ''] }
    setData((d) => ({ ...d, experience: arr }))
  }
  const removeExpBullet = (ei: number, bi: number) => {
    const arr = [...data.experience]
    arr[ei] = { ...arr[ei], bullets: arr[ei].bullets.filter((_, idx) => idx !== bi) }
    setData((d) => ({ ...d, experience: arr }))
  }

  // Project helpers
  const addProject = () =>
    setData((d) => ({ ...d, projects: [...d.projects, { name: '', link: '', description: '', bullets: [''] }] }))
  const updateProject = (i: number, key: keyof Project, val: string | string[]) => {
    const arr = [...data.projects]
    arr[i] = { ...arr[i], [key]: val }
    setData((d) => ({ ...d, projects: arr }))
  }
  const removeProject = (i: number) =>
    setData((d) => ({ ...d, projects: d.projects.filter((_, idx) => idx !== i) }))
  const updateProjBullet = (pi: number, bi: number, val: string) => {
    const arr = [...data.projects]
    const bullets = [...arr[pi].bullets]
    bullets[bi] = val
    arr[pi] = { ...arr[pi], bullets }
    setData((d) => ({ ...d, projects: arr }))
  }
  const addProjBullet = (pi: number) => {
    const arr = [...data.projects]
    arr[pi] = { ...arr[pi], bullets: [...arr[pi].bullets, ''] }
    setData((d) => ({ ...d, projects: arr }))
  }
  const removeProjBullet = (pi: number, bi: number) => {
    const arr = [...data.projects]
    arr[pi] = { ...arr[pi], bullets: arr[pi].bullets.filter((_, idx) => idx !== bi) }
    setData((d) => ({ ...d, projects: arr }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (isEdit && id) {
        await api.put(`/resumes/${id}/manual`, { title, manualData: data })
        setSuccess('Resume saved!')
      } else {
        const res = await api.post('/resumes/manual', { title, manualData: data })
        setSuccess('Resume created!')
        navigate(`/candidate/resumes/${res.data.resume._id}/edit`, { replace: true })
      }
    } catch {
      setError('Failed to save resume')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  const pdfFilename = `${(data.personalInfo.fullName || 'resume').replace(/[^a-z0-9_\-]/gi, '_')}-cv.pdf`

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/candidate/resumes')} className="text-sm text-blue-600 hover:underline mb-1 block">
            ← Back to My Resumes
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit CV' : 'Create CV'}</h1>
        </div>
        <div className="flex gap-3">
          <PDFDownloadLink
            document={<ResumePdf data={data} />}
            fileName={pdfFilename}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium text-sm"
          >
            {({ loading: pdfLoading }) => pdfLoading ? 'Generating...' : '⬇ Download PDF'}
          </PDFDownloadLink>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{success}</div>
      )}

      {/* CV Title */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <InputField label="CV Title" value={title} onChange={setTitle} placeholder="e.g. Software Engineer CV" />
      </div>

      <div className="flex gap-6">
        {/* Sidebar navigation */}
        <div className="w-48 shrink-0">
          <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`w-full text-left px-4 py-3 text-sm font-medium border-b border-gray-100 last:border-b-0 transition-colors ${
                  activeSection === s.key
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Section form */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
          {activeSection === 'personal' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <InputField label="Full Name" value={data.personalInfo.fullName} onChange={(v) => updatePersonal('fullName', v)} placeholder="Jane Doe" />
              <InputField label="Email" value={data.personalInfo.email} onChange={(v) => updatePersonal('email', v)} placeholder="jane@example.com" type="email" />
              <InputField label="Phone" value={data.personalInfo.phone} onChange={(v) => updatePersonal('phone', v)} placeholder="+1 555 123 4567" />
              <InputField label="Location" value={data.personalInfo.location} onChange={(v) => updatePersonal('location', v)} placeholder="City, Country" />
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Links (LinkedIn, GitHub, portfolio…)</label>
                {(data.personalInfo.links || []).map((link, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updateLinks(i, e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={() => removeLink(i)} className="text-red-500 hover:text-red-700 text-sm px-2">✕</button>
                  </div>
                ))}
                <button onClick={addLink} className="text-sm text-blue-600 hover:underline">+ Add link</button>
              </div>
            </div>
          )}

          {activeSection === 'summary' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Summary</h2>
              <TextArea
                label="Summary"
                value={data.summary}
                onChange={(v) => setData((d) => ({ ...d, summary: v }))}
                placeholder="A brief overview of your professional background and goals..."
              />
            </div>
          )}

          {activeSection === 'skills' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Type a skill and press Enter"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={addSkill} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {skill}
                    <button onClick={() => removeSkill(i)} className="text-blue-400 hover:text-blue-700">✕</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'certifications' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h2>
              {(data.certifications || []).map((cert, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-700 text-sm">Certification #{i + 1}</span>
                    <button onClick={() => removeCertification(i)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Certificate Name" value={cert.name} onChange={(v) => updateCertification(i, 'name', v)} placeholder="AWS Certified Developer" />
                    <InputField label="Issuer" value={cert.issuer} onChange={(v) => updateCertification(i, 'issuer', v)} placeholder="Amazon Web Services" />
                    <InputField label="Issue Date" value={cert.issueDate} onChange={(v) => updateCertification(i, 'issueDate', v)} placeholder="2025-02" />
                    <InputField label="Credential ID" value={cert.credentialId} onChange={(v) => updateCertification(i, 'credentialId', v)} placeholder="ABC-12345" />
                    <div className="sm:col-span-2">
                      <InputField label="Credential Link (optional)" value={cert.link} onChange={(v) => updateCertification(i, 'link', v)} placeholder="https://..." type="url" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addCertification} className="text-sm text-blue-600 hover:underline">+ Add certification</button>
            </div>
          )}

          {activeSection === 'education' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Education</h2>
              {data.education.map((edu, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-700 text-sm">Education #{i + 1}</span>
                    <button onClick={() => removeEducation(i)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="School / University" value={edu.school} onChange={(v) => updateEducation(i, 'school', v)} placeholder="MIT" />
                    <InputField label="Degree" value={edu.degree} onChange={(v) => updateEducation(i, 'degree', v)} placeholder="Bachelor's" />
                    <InputField label="Field of Study" value={edu.field} onChange={(v) => updateEducation(i, 'field', v)} placeholder="Computer Science" />
                    <div className="grid grid-cols-2 gap-2">
                      <InputField label="Start Year" value={edu.startYear} onChange={(v) => updateEducation(i, 'startYear', v)} placeholder="2018" />
                      <InputField label="End Year" value={edu.endYear} onChange={(v) => updateEducation(i, 'endYear', v)} placeholder="2022" />
                    </div>
                  </div>
                  <TextArea label="Details / Achievements" value={edu.details} onChange={(v) => updateEducation(i, 'details', v)} placeholder="Dean's list, GPA 3.9..." />
                </div>
              ))}
              <button onClick={addEducation} className="text-sm text-blue-600 hover:underline">+ Add education</button>
            </div>
          )}

          {activeSection === 'experience' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h2>
              {data.experience.map((exp, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-700 text-sm">Experience #{i + 1}</span>
                    <button onClick={() => removeExperience(i)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Job Title" value={exp.title} onChange={(v) => updateExperience(i, 'title', v)} placeholder="Software Engineer" />
                    <InputField label="Company" value={exp.company} onChange={(v) => updateExperience(i, 'company', v)} placeholder="Acme Corp" />
                    <InputField label="Location" value={exp.location} onChange={(v) => updateExperience(i, 'location', v)} placeholder="New York, NY" />
                    <div />
                    <InputField label="Start Date" value={exp.startDate} onChange={(v) => updateExperience(i, 'startDate', v)} placeholder="Jan 2021" />
                    <div>
                      <InputField label="End Date" value={exp.endDate} onChange={(v) => updateExperience(i, 'endDate', v)} placeholder="Dec 2023" />
                      <label className="flex items-center gap-2 text-sm text-gray-700 -mt-2 mb-3">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => updateExperience(i, 'current', e.target.checked)}
                        />
                        Currently working here
                      </label>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities / Achievements</label>
                    {exp.bullets.map((b, bi) => (
                      <div key={bi} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => updateExpBullet(i, bi, e.target.value)}
                          placeholder="Describe a responsibility or achievement..."
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={() => removeExpBullet(i, bi)} className="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
                      </div>
                    ))}
                    <button onClick={() => addExpBullet(i)} className="text-sm text-blue-600 hover:underline">+ Add bullet</button>
                  </div>
                </div>
              ))}
              <button onClick={addExperience} className="text-sm text-blue-600 hover:underline">+ Add experience</button>
            </div>
          )}

          {activeSection === 'projects' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects</h2>
              {data.projects.map((proj, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-700 text-sm">Project #{i + 1}</span>
                    <button onClick={() => removeProject(i)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Project Name" value={proj.name} onChange={(v) => updateProject(i, 'name', v)} placeholder="My Awesome App" />
                    <InputField label="Link (optional)" value={proj.link} onChange={(v) => updateProject(i, 'link', v)} placeholder="https://github.com/..." type="url" />
                  </div>
                  <TextArea label="Description" value={proj.description} onChange={(v) => updateProject(i, 'description', v)} placeholder="Brief description of the project..." />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Points</label>
                    {proj.bullets.map((b, bi) => (
                      <div key={bi} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => updateProjBullet(i, bi, e.target.value)}
                          placeholder="Describe a key point or technology used..."
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={() => removeProjBullet(i, bi)} className="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
                      </div>
                    ))}
                    <button onClick={() => addProjBullet(i)} className="text-sm text-blue-600 hover:underline">+ Add bullet</button>
                  </div>
                </div>
              ))}
              <button onClick={addProject} className="text-sm text-blue-600 hover:underline">+ Add project</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
