import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, BookOpen, GraduationCap, Users, Lock } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState('student')
  const [form, setForm] = useState({ fullName: '', email: '', password: '', matricNumber: '', level: '100', staffCode: '' })
  const [showPass, setShowPass] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.')
    if (accountType === 'staff' && !form.staffCode.trim()) return toast.error('Staff access code is required.')
    setLoading(true)
    try {
      await register({ ...form, accountType })
      toast.success('Account created! Welcome to AMACOS.')
      navigate('/app/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const isStaff = accountType === 'staff'

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-[#1a3c5e] flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <BookOpen size={28} className="text-amber-400" />
          <span className="text-xl font-semibold tracking-wide">AMACOS</span>
        </div>
        <div>
          <h1 className="text-5xl font-display leading-tight mb-4">
            Join the<br />
            <span className="text-amber-400">AMACOS Community</span>
          </h1>
          <p className="text-blue-200 text-lg">Access past questions, resources, CBT, forums, and the tech community.</p>
        </div>
        <p className="text-blue-300 text-sm">© 2025 AMACOS. Adeleke University.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <BookOpen size={22} className="text-[#1a3c5e]" />
            <span className="font-semibold text-[#1a3c5e] text-lg">AMACOS</span>
          </div>

          <h2 className="text-3xl font-display text-[#1a3c5e] mb-1">Create account</h2>
          <p className="text-gray-500 mb-6 text-sm">Join the Mass Communication platform</p>

          {/* Account type toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setAccountType('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !isStaff ? 'bg-white text-[#1a3c5e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <GraduationCap size={16} /> I am a Student
            </button>
            <button
              type="button"
              onClick={() => setAccountType('staff')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isStaff ? 'bg-white text-[#1a3c5e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users size={16} /> I am Staff
            </button>
          </div>

          {isStaff && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-xs text-amber-700">
              <Lock size={14} className="flex-shrink-0 mt-0.5" />
              <span>Staff accounts require a verification code. Contact your HOD or department administrator to obtain it.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" name="fullName" value={form.fullName} onChange={handleChange} required
                placeholder="e.g. Adebayo Tunde"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required
                placeholder="you@adelekeuniversity.edu.ng"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] transition" />
            </div>

            {!isStaff && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matric Number</label>
                  <input type="text" name="matricNumber" value={form.matricNumber} onChange={handleChange}
                    placeholder="AUI/..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select name="level" value={form.level} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] transition bg-white">
                    <option value="100">100L</option>
                    <option value="200">200L</option>
                    <option value="300">300L</option>
                    <option value="400">400L</option>
                  </select>
                </div>
              </div>
            )}

            {isStaff && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff Access Code *</label>
                <div className="relative">
                  <input type={showCode ? 'text' : 'password'} name="staffCode" value={form.staffCode}
                    onChange={handleChange} placeholder="Enter staff verification code"
                    className="w-full px-4 py-3 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition pr-12" />
                  <button type="button" onClick={() => setShowCode(!showCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} required placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] transition pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#1a3c5e] hover:bg-[#15324f] text-white py-3 rounded-xl font-medium text-sm transition disabled:opacity-60 mt-2">
              {loading ? 'Creating account...' : `Create ${isStaff ? 'Staff' : 'Student'} Account`}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1a3c5e] font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
