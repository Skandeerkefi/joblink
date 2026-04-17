import { useEffect, useState } from 'react'
import api from '../../api/axios'

type RoleFilter = 'all' | 'candidate' | 'recruiter'

type UserRole = 'candidate' | 'recruiter'

interface AdminUser {
  _id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export default function AdminUsers() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const fetchUsers = async (role: RoleFilter) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/admin/users', { params: { role } })
      setUsers(res.data.users || [])
    } catch {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(roleFilter)
  }, [roleFilter])

  const updateUser = async (id: string, updates: Partial<Pick<AdminUser, 'name' | 'email' | 'role'>>) => {
    setSavingId(id)
    setError('')
    try {
      await api.patch(`/admin/users/${id}`, updates)
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, ...updates } as AdminUser : u)))
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Failed to update user')
      await fetchUsers(roleFilter)
    } finally {
      setSavingId(null)
    }
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user? This also removes related data.')) return
    setSavingId(id)
    setError('')
    try {
      await api.delete(`/admin/users/${id}`)
      setUsers((prev) => prev.filter((u) => u._id !== id))
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Failed to delete user')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin · User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage recruiters and candidates (edit and delete).</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="recruiter">Recruiters</option>
            <option value="candidate">Candidates</option>
          </select>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400">
          No users found.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Role</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Created</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3">
                    <input
                      value={u.name}
                      onChange={(e) => setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, name: e.target.value } : x)))}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={u.email}
                      onChange={(e) => setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, email: e.target.value } : x)))}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, role: e.target.value as UserRole } : x)))}
                      className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm"
                    >
                      <option value="candidate">Candidate</option>
                      <option value="recruiter">Recruiter</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        disabled={savingId === u._id}
                        onClick={() => updateUser(u._id, { name: u.name, email: u.email, role: u.role })}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        disabled={savingId === u._id}
                        onClick={() => deleteUser(u._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
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
