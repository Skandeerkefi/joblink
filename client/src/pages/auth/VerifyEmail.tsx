import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const verify = async (tokenToVerify: string) => {
    if (!tokenToVerify) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.post('/auth/verify-email', { token: tokenToVerify })
      setSuccess(res.data.message || 'Email verified successfully')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) verify(token)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center -mt-8 px-4 bg-black">
      <div className="max-w-md w-full bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Verify your email</h2>
        <p className="text-gray-400 text-center mb-6">Confirm your JobLink account to start using the platform.</p>

        {!searchParams.get('token') && (
          <div className="space-y-2 mb-5">
            <label className="block text-sm font-medium text-gray-300">Verification token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-black border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste token from email"
            />
            <button
              onClick={() => verify(token)}
              disabled={loading || !token}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        )}

        {loading && searchParams.get('token') && (
          <div className="text-sm text-gray-300 text-center mb-5">Verifying your email...</div>
        )}
        {success && (
          <div className="bg-green-900/30 border border-green-800 text-green-300 px-4 py-3 rounded-lg mb-5">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <div className="text-center text-sm text-gray-400">
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Go to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
