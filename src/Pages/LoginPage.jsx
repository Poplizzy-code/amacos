import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, BookOpen } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* Hero panel — full width on mobile (compact), half on desktop */}
      <div className="relative lg:w-1/2 flex-shrink-0 flex flex-col justify-between text-white overflow-hidden"
        style={{
          backgroundImage: 'url(/bg-login.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '220px',
        }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, rgba(6,13,26,0.65) 0%, rgba(13,33,55,0.55) 50%, rgba(10,25,46,0.60) 100%)' }} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
        </div>

        {/* Logo row */}
        <div className="relative flex items-center gap-3 p-6 lg:p-12">
          <div className="w-9 h-9 lg:w-10 lg:h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <BookOpen size={18} className="text-[#1a3c5e]" />
          </div>
          <span className="text-lg lg:text-xl font-semibold tracking-wide">AMACOS</span>
        </div>

        {/* Hero copy — hidden on very small mobile, shown from sm up */}
        <div className="relative px-6 pb-6 lg:px-12 lg:pb-12 hidden sm:block">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-blue-200 text-xs font-medium">Adeleke University · Mass Communication</span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-display leading-tight mb-3">
            Welcome<br />
            <span className="text-amber-400">Back</span>
          </h1>
          <p className="text-blue-200 text-sm lg:text-lg">Your academic hub — resources, community, CBT, and more.</p>
        </div>

        {/* Credits — desktop only */}
        <div className="relative px-12 pb-6 hidden lg:block">
          <p className="text-blue-400 text-sm">© 2026 AMACOS. Adeleke University.</p>
          <p className="text-blue-600/60 text-xs mt-1">Built by Bukunmi · Flamedev Studio · NEXUS Team 2026/2027</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#f0f5fb] via-[#e8eef8] to-[#f4f8ff]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, #dbeafe 0%, transparent 70%)' }} />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #bfdbfe 0%, transparent 70%)' }} />
        </div>

        <div className="relative w-full max-w-md px-6 py-10 sm:py-12">
          <h2 className="text-2xl sm:text-3xl font-display text-[#1a3c5e] mb-1">Welcome back</h2>
          <p className="text-gray-500 mb-8 text-sm">Sign in to your AMACOS account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required
                placeholder="you@adelekeuniversity.edu.ng"
                style={{ fontSize: 16 }}
                className="w-full px-4 py-3 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] transition shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} required placeholder="••••••••"
                  style={{ fontSize: 16 }}
                  className="w-full px-4 py-3 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] transition pr-12 shadow-sm" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#1a3c5e] hover:bg-[#15324f] text-white py-3.5 rounded-xl font-medium text-sm transition disabled:opacity-60 shadow-lg shadow-[#1a3c5e]/25">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#1a3c5e] font-semibold hover:underline">Create one</Link>
          </p>

          <p className="text-center text-gray-300 text-[10px] mt-8">Built by Bukunmi · Flamedev Studio · NEXUS Team 2026/2027</p>
        </div>
      </div>
    </div>
  )
}
