import React, { useState, useEffect } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function CandidateProfile() {
  const { user, updateUser } = useAuth()
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
      </div>

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
  )
}
