import React, { useState, useEffect } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

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
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState<Profile>({ bio: '', skills: [], education: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [skillInput, setSkillInput] = useState('')

  const [accountSaving, setAccountSaving] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [accountSuccess, setAccountSuccess] = useState('')
  const [accountForm, setAccountForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
  })

  useEffect(() => {
    setAccountForm((prev) => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
    }))
  }, [user?.name, user?.email])

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
        education: (p.education || []).map((ed: Education) => ({
          ...ed,
          startYear: ed.startYear != null ? String(ed.startYear) : '',
          endYear: ed.endYear != null ? String(ed.endYear) : '',
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

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAccountError('')
    setAccountSuccess('')
    setAccountSaving(true)
    try {
      const payload: Record<string, string> = {}
      if (accountForm.name.trim() && accountForm.name.trim() !== user?.name) payload.name = accountForm.name.trim()
      if (accountForm.email.trim() && accountForm.email.trim() !== user?.email) payload.email = accountForm.email.trim()
      if (accountForm.newPassword) {
        payload.currentPassword = accountForm.currentPassword
        payload.newPassword = accountForm.newPassword
      }
      if (Object.keys(payload).length === 0) {
        setAccountError('No account changes to save.')
        return
      }
      const res = await api.put('/auth/account', payload)
      if (res.data?.user) updateUser(res.data.user)
      setAccountForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }))
      setAccountSuccess('Account updated successfully.')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Array<{ msg: string }> } } }
      setAccountError(e.response?.data?.errors?.[0]?.msg || e.response?.data?.message || 'Failed to update account')
    } finally {
      setAccountSaving(false)
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
    <div className="max-w-4xl">
      <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          Keep your profile and account up to date to improve your ATS and job match performance.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About Me</h2>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
                maxLength={1000}
                placeholder="Write a short bio about yourself..."
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{profile.bio.length}/1000</p>
            </div>

            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills</h2>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Type a skill and press Enter or comma"
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Add
                </button>
              </div>
              {profile.skills.length > 0 ? (
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
              ) : (
                <p className="text-sm text-gray-400">No skills added yet.</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Education</h2>
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
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative">
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
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">School / University *</label>
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => updateEdu(idx, 'school', e.target.value)}
                          placeholder="e.g. MIT"
                          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Degree</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEdu(idx, 'degree', e.target.value)}
                          placeholder="e.g. Bachelor's"
                          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Field of Study</label>
                        <input
                          type="text"
                          value={edu.field}
                          onChange={(e) => updateEdu(idx, 'field', e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Year</label>
                        <input
                          type="number"
                          value={edu.startYear}
                          onChange={(e) => updateEdu(idx, 'startYear', e.target.value)}
                          min={1900}
                          max={2100}
                          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End Year</label>
                        <input
                          type="number"
                          value={edu.endYear}
                          onChange={(e) => updateEdu(idx, 'endYear', e.target.value)}
                          min={1900}
                          max={2100}
                          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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

        <div className="space-y-6">
          <form onSubmit={handleAccountSubmit} className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Settings</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Update your account email and password.</p>

            {accountError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
                {accountError}
              </div>
            )}
            {accountSuccess && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-3 py-2 rounded-lg text-sm">
                {accountSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full Name</label>
              <input
                type="text"
                value={accountForm.name}
                onChange={(e) => setAccountForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={accountForm.email}
                onChange={(e) => setAccountForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current Password</label>
              <input
                type="password"
                value={accountForm.currentPassword}
                onChange={(e) => setAccountForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Required only when changing password"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">New Password</label>
              <input
                type="password"
                value={accountForm.newPassword}
                onChange={(e) => setAccountForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty if you don't want to change it"
              />
            </div>

            <button
              type="submit"
              disabled={accountSaving}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              {accountSaving ? 'Updating...' : 'Update Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
