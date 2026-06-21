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
      // route guard in App.jsx handles the redirect once user state updates
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{
          backgroundImage: 'url(/bg-login.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, rgba(6,13,26,0.82) 0%, rgba(13,33,55,0.75) 50%, rgba(10,25,46,0.80) 100%)' }} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen size={20} className="text-[#1a3c5e]" />
          </div>
          <span className="text-xl font-semibold tracking-wide">AMACOS</span>
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full mb-5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-blue-200 text-xs font-medium">Adeleke University · Mass Communication</span>
          </div>
          <h1 className="text-5xl font-display leading-tight mb-4">
            Welcome<br />
            <span className="text-amber-400">Back</span>
          </h1>
          <p className="text-blue-200 text-lg">Your academic hub — resources, community, CBT, and more.</p>
        </div>
        <p className="relative text-blue-400 text-sm">© 2026 AMACOS. Adeleke University.</p>
        <p className="relative text-blue-600/60 text-xs mt-1">Built by Bukunmi · Flamedev Studio · NEXUS Team 2026/2027</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center min-h-screen relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #f0f5fb 0%, #e8eef8 50%, #f4f8ff 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-40"
            style={{ background: 'radial-gradient(circle, #dbeafe 0%, transparent 70%)' }} />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, #bfdbfe 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #93c5fd 0%, transparent 60%)' }} />
        </div>
        <div className="relative w-full max-w-md px-6 py-10 sm:py-14">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-[#1a3c5e] rounded-xl flex items-center justify-center shadow-md">
              <BookOpen size={17} className="text-amber-400" />
            </div>
            <span className="font-bold text-[#1a3c5e] text-lg tracking-wide">AMACOS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display text-[#1a3c5e] mb-1">Welcome back</h2>
          <p className="text-gray-500 mb-8 text-sm">Sign in to your AMACOS account</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required
                placeholder="you@adelekeuniversity.edu.ng"
                className="w-full px-4 py-3 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] transition shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} required placeholder="••••••••"
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
        </div>
      </div>
    </div>
  )
}