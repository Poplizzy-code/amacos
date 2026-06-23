import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, BookOpen, GraduationCap, Users, Lock } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const isStaff = accountType === 'staff'

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* Hero panel — full width on mobile (compact), half on desktop */}
      <div className="relative lg:w-1/2 flex-shrink-0 flex flex-col justify-between text-white overflow-hidden"
        style={{
          backgroundImage: 'url(/bg-signup.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '200px',
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
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-blue-200 text-xs font-medium">Join hundreds of Mass Comm students</span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-display leading-tight mb-3">
            Join the<br />
            <span className="text-amber-400">AMACOS Community</span>
          </h1>
          <p className="text-blue-200 text-sm lg:text-lg">Access past questions, resources, CBT, forums, and the tech community.</p>
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

        <div className="relative w-full max-w-md px-6 py-8 sm:py-12">
          <h2 className="text-2xl sm:text-3xl font-display text-[#1a3c5e] mb-1">Create account</h2>
          <p className="text-gray-500 mb-5 text-sm">Join the Mass Communication platform</p>

          {/* Account type toggle */}
          <div className="flex gap-2 mb-5 p-1 bg-gray-100 rounded-xl">
            <button type="button" onClick={() => setAccountType('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${!isStaff ? 'bg-white text-[#1a3c5e] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <GraduationCap size={16} /> I am a Student
            </button>
            <button type="button" onClick={() => setAccountType('staff')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${isStaff ? 'bg-white text-[#1a3c5e] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
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
                style={{ fontSize: 16 }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required
                placeholder="you@adelekeuniversity.edu.ng"
                style={{ fontSize: 16 }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] transition" />
            </div>

            {!isStaff && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matric Number</label>
                  <input type="text" name="matricNumber" value={form.matricNumber} onChange={handleChange}
                    placeholder="AUI/..."
                    style={{ fontSize: 16 }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select name="level" value={form.level} onChange={handleChange}
                    style={{ fontSize: 16 }}
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
                    style={{ fontSize: 16 }}
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
                  style={{ fontSize: 16 }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e] transition pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#1a3c5e] hover:bg-[#15324f] text-white py-3 rounded-xl font-medium text-sm transition disabled:opacity-60 mt-2 shadow-lg shadow-[#1a3c5e]/25">
              {loading ? 'Creating account...' : `Create ${isStaff ? 'Staff' : 'Student'} Account`}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1a3c5e] font-medium hover:underline">Sign in</Link>
          </p>

          <p className="text-center text-gray-300 text-[10px] mt-6">Built by Bukunmi · Flamedev Studio · NEXUS Team 2026/2027</p>
        </div>
      </div>
    </div>
  )
}
