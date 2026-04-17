import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [success, setSuccess] = useState('')
  const [devVerificationUrl, setDevVerificationUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setNeedsVerification(false)
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token, user } = res.data
      login(token, user)
      if (user.role === 'admin') {
        navigate('/admin/users')
      } else if (user.role === 'recruiter') {
        navigate('/recruiter/jobs')
      } else {
        navigate('/jobs')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; needsEmailVerification?: boolean } } }
      const data = error.response?.data
      setNeedsVerification(Boolean(data?.needsEmailVerification))
      setError(data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setError('')
    setSuccess('')
    setDevVerificationUrl('')
    try {
      const res = await api.post('/auth/resend-verification', { email })
      setSuccess(res.data.message || 'Verification email sent.')
      setDevVerificationUrl(res.data.devVerificationUrl || '')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Failed to resend verification email')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center -mt-8 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">Welcome back</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8">Sign in to your JobLink account</p>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/30 border border-green-800 text-green-300 px-4 py-3 rounded-lg mb-6">
            {success}
            {devVerificationUrl && (
              <div className="mt-2 text-xs break-all">
                Dev link:{' '}
                <a href={devVerificationUrl} className="underline text-green-200">
                  {devVerificationUrl}
                </a>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {needsVerification && (
            <button
              type="button"
              onClick={handleResendVerification}
              className="w-full bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 font-medium"
            >
              Resend verification email
            </button>
          )}
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
