import React, { useState, useEffect } from 'react'
import api from '../../api/axios'

interface Education {
  _id?: string
  school: string
  degree: string
  field: string
  startYear: string
  endYear: string
}

interface Profile {
  bio: string
  skills: string[]
  education: Education[]
}

const emptyEdu = (): Education => ({ school: '', degree: '', field: '', startYear: '', endYear: '' })

export default function CandidateProfile() {
  const [profile, setProfile] = useState<Profile>({ bio: '', skills: [], education: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile/me')
        const p = res.data.profile
        setProfile({
          bio: p.bio || '',
          skills: p.skills || [],
          education: (p.education || []).map((e: Education) => ({
            ...e,
            startYear: e.startYear != null ? String(e.startYear) : '',
            endYear: e.endYear != null ? String(e.endYear) : '',
          })),
        })
      } catch {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  /* --- Skills --- */
  const addSkill = () => {
    const s = skillInput.trim()
    if (!s || profile.skills.includes(s)) return
    setProfile({ ...profile, skills: [...profile.skills, s] })
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter((s) => s !== skill) })
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill()
    }
  }

  /* --- Education --- */
  const addEducation = () => {
    setProfile({ ...profile, education: [...profile.education, emptyEdu()] })
  }

  const removeEducation = (idx: number) => {
    setProfile({ ...profile, education: profile.education.filter((_, i) => i !== idx) })
  }

  const updateEdu = (idx: number, field: keyof Education, value: string) => {
    const updated = profile.education.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
    setProfile({ ...profile, education: updated })
  }

  /* --- Submit --- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const payload = {
        bio: profile.bio,
        skills: profile.skills,
        education: profile.education
          .filter((e) => e.school.trim())
          .map((e) => ({
            school: e.school.trim(),
            degree: e.degree.trim(),
            field: e.field.trim(),
            startYear: e.startYear ? parseInt(e.startYear) : undefined,
            endYear: e.endYear ? parseInt(e.endYear) : undefined,
          })),
      }
      const res = await api.put('/profile/me', payload)
      const p = res.data.profile
      setProfile({
        bio: p.bio || '',
        skills: p.skills || [],
        education: (p.education || []).map((e: Education) => ({
          ...e,
          startYear: e.startYear != null ? String(e.startYear) : '',
          endYear: e.endYear != null ? String(e.endYear) : '',
        })),
      })
      setSuccess('Profile saved!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Array<{ msg: string }> } } }
      setError(e.response?.data?.errors?.[0]?.msg || e.response?.data?.message || 'Failed to save profile')
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

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Bio */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About Me</h2>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={4}
            maxLength={1000}
            placeholder="Write a short bio about yourself..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">{profile.bio.length}/1000</p>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="Type a skill and press Enter or comma"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="button"
              onClick={addSkill}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Add
            </button>
          </div>
          {profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-blue-400 hover:text-blue-700 leading-none"
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Education */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Education</h2>
            <button
              type="button"
              onClick={addEducation}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add entry
            </button>
          </div>

          {profile.education.length === 0 && (
            <p className="text-gray-400 text-sm">No education entries yet.</p>
          )}

          <div className="space-y-4">
            {profile.education.map((edu, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 relative">
                <button
                  type="button"
                  onClick={() => removeEducation(idx)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-lg leading-none"
                  aria-label="Remove education entry"
                >
                  ×
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">School / University *</label>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => updateEdu(idx, 'school', e.target.value)}
                      placeholder="e.g. MIT"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEdu(idx, 'degree', e.target.value)}
                      placeholder="e.g. Bachelor's"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Field of Study</label>
                    <input
                      type="text"
                      value={edu.field}
                      onChange={(e) => updateEdu(idx, 'field', e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Year</label>
                    <input
                      type="number"
                      value={edu.startYear}
                      onChange={(e) => updateEdu(idx, 'startYear', e.target.value)}
                      placeholder="e.g. 2018"
                      min={1900}
                      max={2100}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Year</label>
                    <input
                      type="number"
                      value={edu.endYear}
                      onChange={(e) => updateEdu(idx, 'endYear', e.target.value)}
                      placeholder="e.g. 2022"
                      min={1900}
                      max={2100}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
