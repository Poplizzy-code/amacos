import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, BookOpen } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
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
      navigate('/app/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-[#1a3c5e] flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <BookOpen size={28} className="text-amber-400" />
          <span className="text-xl font-semibold tracking-wide">AMACOS</span>
        </div>
        <div>
          <h1 className="text-5xl font-display leading-tight mb-4">
            Mass Communication,<br />
            <span className="text-amber-400">Adeleke University</span>
          </h1>
          <p className="text-blue-200 text-lg">Your academic hub — resources, community, CBT, and more.</p>
        </div>
        <p className="text-blue-300 text-sm">© 2025 AMACOS. Adeleke University.</p>
      </div>
      <div className="flex-1 flex items-center justify-center bg-white min-h-screen">
        <div className="w-full max-w-md px-6 py-10 sm:py-14">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#1a3c5e] rounded-xl flex items-center justify-center">
              <BookOpen size={16} className="text-amber-400" />
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} required placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] transition pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#1a3c5e] hover:bg-[#15324f] text-white py-3.5 rounded-xl font-medium text-sm transition disabled:opacity-60">
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