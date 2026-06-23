import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { CheckCircle2, XCircle, Loader2, BookOpen } from 'lucide-react'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setState('error'); setMessage('No verification token found in this link.'); return }

    axios.get(`/api/auth/verify-email?token=${token}`)
      .then(({ data }) => {
        if (data.user) {
          setUser(data.user)
          if (data.token) localStorage.setItem('amacos_token', data.token)
        }
        setState('success')
        setTimeout(() => navigate('/app', { replace: true }), 3000)
      })
      .catch(err => {
        setState('error')
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.')
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#060d1a] to-[#0d2137] px-6">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center">
            <BookOpen size={18} className="text-[#1a3c5e]" />
          </div>
          <span className="text-white text-lg font-bold tracking-wide">AMACOS</span>
        </div>

        {state === 'loading' && (
          <>
            <Loader2 size={48} className="mx-auto text-amber-400 animate-spin mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Verifying your email…</h2>
            <p className="text-gray-500 text-sm">Just a second</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2 size={56} className="mx-auto text-green-400 mb-4" />
            <h2 className="text-white text-2xl font-bold mb-2">You're verified!</h2>
            <p className="text-gray-400 text-sm mb-6">Your AMACOS account is now active. Redirecting you to the dashboard…</p>
            <Link to="/app"
              className="inline-block bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] font-bold px-8 py-3 rounded-xl text-sm transition">
              Go to Dashboard
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle size={56} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Verification failed</h2>
            <p className="text-gray-400 text-sm mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <Link to="/register"
                className="inline-block bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] font-bold px-8 py-3 rounded-xl text-sm transition">
                Register again
              </Link>
              <Link to="/login" className="text-gray-500 text-sm hover:text-gray-300 transition">
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
