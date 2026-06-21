import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  User, Lock, Eye, EyeOff, Copy, Check, Pencil, X,
  ShieldCheck, ShieldOff, GraduationCap, UserCheck,
  UserX, KeyRound, RefreshCw, Loader2, Camera,
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────────

function Toggle({ on, onToggle, disabled }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        on ? 'bg-[#1a3c5e]' : 'bg-gray-200'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
        active
          ? 'bg-[#1a3c5e] text-white shadow-sm'
          : 'text-gray-500 hover:text-[#1a3c5e] hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

// ── Profile tab ────────────────────────────────────────────────────────────────
function ProfileTab({ user, setUser: setCtxUser }) {
  const [form, setForm] = useState({ fullName: user?.fullName || '', bio: user?.bio || '' })
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef(null)

  const [showPw, setShowPw] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '', show: false })
  const [savingPw, setSavingPw] = useState(false)

  const uploadAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const { data } = await axios.put('/api/settings/personal/avatar', fd, { withCredentials: true })
      setCtxUser(data.user)
      toast.success('Profile photo updated.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo.')
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { data } = await axios.put('/api/settings/personal', form, { withCredentials: true })
      setCtxUser(data.user)
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setSavingPw(true)
    try {
      await axios.put('/api/settings/personal/password', { currentPassword: pw.current, newPassword: pw.next }, { withCredentials: true })
      toast.success('Password changed.')
      setPw({ current: '', next: '', show: false })
      setShowPw(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-[#1a3c5e] flex items-center gap-2 mb-4"><Camera size={16} /> Profile Photo</h3>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 shadow-sm" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-100 shadow-sm">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute bottom-0 right-0 w-7 h-7 bg-[#1a3c5e] hover:bg-[#162f4a] text-white rounded-full flex items-center justify-center shadow-md transition"
            >
              {avatarUploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="text-xs text-[#1a3c5e] hover:underline mt-1 disabled:opacity-50"
            >
              {avatarUploading ? 'Uploading...' : 'Change photo'}
            </button>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP — max 10 MB</p>
          </div>
        </div>
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-[#1a3c5e] flex items-center gap-2"><User size={16} /> Profile</h3>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
          <input
            value={form.fullName}
            onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
            rows={3}
            placeholder="Tell the community a bit about yourself..."
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none"
          />
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] font-medium disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save Profile
        </button>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#1a3c5e] flex items-center gap-2"><Lock size={16} /> Password</h3>
          <button
            onClick={() => setShowPw(v => !v)}
            className="text-xs text-[#1a3c5e] font-medium hover:underline"
          >
            {showPw ? 'Cancel' : 'Change password'}
          </button>
        </div>

        {showPw && (
          <form onSubmit={changePassword} className="space-y-3">
            <div className="relative">
              <input
                type={pw.show ? 'text' : 'password'}
                value={pw.current}
                onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                placeholder="Current password"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] pr-10"
              />
              <button type="button" onClick={() => setPw(p => ({ ...p, show: !p.show }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {pw.show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <input
              type={pw.show ? 'text' : 'password'}
              value={pw.next}
              onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
              placeholder="New password (min 6 characters)"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
            />
            <button
              type="submit"
              disabled={savingPw || !pw.current || pw.next.length < 6}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] font-medium disabled:opacity-60"
            >
              {savingPw ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Update Password
            </button>
          </form>
        )}

        {!showPw && (
          <p className="text-sm text-gray-400">••••••••••••</p>
        )}
      </div>

      {/* Read-only info */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Account Info</h3>
        <Row label="Email" value={user?.email} />
        <Row label="Account type" value={user?.accountType === 'staff' ? 'Staff' : 'Student'} />
        {user?.accountType === 'student' && <Row label="Level" value={user?.level ? `${user.level}L` : '—'} />}
        {user?.accountType === 'student' && <Row label="Matric No." value={user?.matricNumber || '—'} />}
        {user?.accountType === 'staff' && <Row label="Role" value={[user.isStaffAdmin && 'Staff Admin', user.isLecturer && 'Lecturer'].filter(Boolean).join(', ') || 'Staff'} />}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-700">{value}</span>
    </div>
  )
}

// ── Staff settings tab ─────────────────────────────────────────────────────────
function StaffSettingsTab() {
  const [loading, setLoading] = useState(true)
  const [staffCode, setStaffCode] = useState('')
  const [editingCode, setEditingCode] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [savingCode, setSavingCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [staff, setStaff] = useState([])
  const [busy, setBusy] = useState({})

  useEffect(() => {
    axios.get('/api/settings/staff', { withCredentials: true })
      .then(res => { setStaffCode(res.data.staffCode); setStaff(res.data.staff) })
      .catch(() => toast.error('Failed to load staff settings.'))
      .finally(() => setLoading(false))
  }, [])

  const saveCode = async () => {
    if (!newCode.trim()) return
    setSavingCode(true)
    try {
      const { data } = await axios.put('/api/settings/staff/code', { staffCode: newCode }, { withCredentials: true })
      setStaffCode(data.staffCode)
      setEditingCode(false)
      toast.success('Staff code updated.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setSavingCode(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(staffCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const updateStaff = async (id, updates) => {
    setBusy(b => ({ ...b, [id]: true }))
    try {
      const { data } = await axios.put(`/api/settings/staff/${id}`, updates, { withCredentials: true })
      setStaff(prev => prev.map(s => s._id === id ? data.user : s))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setBusy(b => ({ ...b, [id]: false }))
    }
  }

  const toggleActive = async (id) => {
    setBusy(b => ({ ...b, [`active-${id}`]: true }))
    try {
      const { data } = await axios.put(`/api/settings/staff/${id}/toggle-active`, {}, { withCredentials: true })
      setStaff(prev => prev.map(s => s._id === id ? data.user : s))
      toast.success(data.user.isActive ? 'Account reactivated.' : 'Account deactivated.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setBusy(b => ({ ...b, [`active-${id}`]: false }))
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#1a3c5e]" /></div>

  return (
    <div className="space-y-6">
      {/* Staff Registration Code */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-[#1a3c5e] flex items-center gap-2"><KeyRound size={16} /> Staff Registration Code</h3>
        <p className="text-xs text-gray-400">Share this code with new staff members so they can sign up. Change it anytime to revoke old invites.</p>

        {!editingCode ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-sm text-gray-700 tracking-wider">
              {staffCode || <span className="text-gray-400 italic font-sans">No code set — staff registration disabled</span>}
            </div>
            <button onClick={copyCode} disabled={!staffCode} className="p-2 text-gray-400 hover:text-[#1a3c5e] hover:bg-gray-100 rounded-xl transition disabled:opacity-30" title="Copy">
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
            <button onClick={() => { setNewCode(staffCode); setEditingCode(true) }} className="p-2 text-gray-400 hover:text-[#1a3c5e] hover:bg-gray-100 rounded-xl transition" title="Edit">
              <Pencil size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="Enter new code..."
              className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] font-mono"
            />
            <button onClick={saveCode} disabled={savingCode || !newCode.trim()} className="px-4 py-2.5 bg-[#1a3c5e] text-white text-sm rounded-xl font-medium disabled:opacity-60">
              {savingCode ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
            </button>
            <button onClick={() => setEditingCode(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
              <X size={16} />
            </button>
          </div>
        )}

        <button
          onClick={() => { setNewCode(Math.random().toString(36).slice(2, 10).toUpperCase()); setEditingCode(true) }}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#1a3c5e] font-medium"
        >
          <RefreshCw size={12} /> Generate random code
        </button>
      </div>

      {/* Staff Members */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-[#1a3c5e] flex items-center gap-2"><GraduationCap size={16} /> Staff Members</h3>
          <p className="text-xs text-gray-400 mt-0.5">{staff.length} staff account{staff.length !== 1 ? 's' : ''}</p>
        </div>

        {staff.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No staff accounts yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {staff.map(s => (
              <div key={s._id} className={`px-5 py-4 ${!s.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{s.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{s.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${s.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {s.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                    <Toggle
                      on={s.isLecturer}
                      disabled={busy[s._id]}
                      onToggle={() => updateStaff(s._id, { isLecturer: !s.isLecturer })}
                    />
                    Lecturer
                  </label>

                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                    <Toggle
                      on={s.isStaffAdmin}
                      disabled={busy[s._id]}
                      onToggle={() => updateStaff(s._id, { isStaffAdmin: !s.isStaffAdmin })}
                    />
                    Staff Admin
                  </label>

                  <button
                    onClick={() => toggleActive(s._id)}
                    disabled={busy[`active-${s._id}`]}
                    className={`ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                      s.isActive
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {s.isActive ? <><UserX size={13} /> Deactivate</> : <><UserCheck size={13} /> Reactivate</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Student settings tab ────────────────────────────────────────────────────────
function StudentSettingsTab() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [busy, setBusy] = useState({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    axios.get('/api/settings/students', { withCredentials: true })
      .then(res => setStudents(res.data.students))
      .catch(() => toast.error('Failed to load students.'))
      .finally(() => setLoading(false))
  }, [])

  const updateStudent = async (id, updates) => {
    setBusy(b => ({ ...b, [id]: true }))
    try {
      const { data } = await axios.put(`/api/settings/students/${id}`, updates, { withCredentials: true })
      setStudents(prev => prev.map(s => s._id === id ? data.user : s))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setBusy(b => ({ ...b, [id]: false }))
    }
  }

  const toggleActive = async (id) => {
    setBusy(b => ({ ...b, [`active-${id}`]: true }))
    try {
      const { data } = await axios.put(`/api/settings/students/${id}/toggle-active`, {}, { withCredentials: true })
      setStudents(prev => prev.map(s => s._id === id ? data.user : s))
      toast.success(data.user.isActive ? 'Account reactivated.' : 'Account deactivated.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setBusy(b => ({ ...b, [`active-${id}`]: false }))
    }
  }

  const filtered = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.matricNumber || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#1a3c5e]" /></div>

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[#1a3c5e]">Student Accounts</h3>
            <p className="text-xs text-gray-400 mt-0.5">{students.length} student{students.length !== 1 ? 's' : ''}</p>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or matric..."
            className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] w-full sm:w-56"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">{search ? 'No matches found.' : 'No student accounts yet.'}</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(s => (
              <div key={s._id} className={`px-5 py-4 ${!s.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{s.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{s.email} {s.matricNumber ? `· ${s.matricNumber}` : ''} {s.level ? `· ${s.level}L` : ''}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${s.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {s.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                    <Toggle
                      on={s.isStudentAdmin}
                      disabled={busy[s._id]}
                      onToggle={() => updateStudent(s._id, { isStudentAdmin: !s.isStudentAdmin })}
                    />
                    Student Admin
                  </label>

                  <button
                    onClick={() => toggleActive(s._id)}
                    disabled={busy[`active-${s._id}`]}
                    className={`ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                      s.isActive
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {s.isActive ? <><UserX size={13} /> Deactivate</> : <><UserCheck size={13} /> Reactivate</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Settings() {
  const { user, setUser } = useAuth()

  const tabs = [
    { id: 'profile', label: 'Profile' },
    ...(user?.isStaffAdmin  ? [{ id: 'staff',   label: 'Staff Settings'   }] : []),
    ...(user?.isStudentAdmin ? [{ id: 'students', label: 'Student Settings' }] : []),
  ]

  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1a3c5e]">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your profile and administrative settings</p>
      </div>

      <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm w-fit flex-wrap">
        {tabs.map(tab => (
          <TabBtn key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </TabBtn>
        ))}
      </div>

      {activeTab === 'profile'   && <ProfileTab user={user} setUser={setUser} />}
      {activeTab === 'staff'     && <StaffSettingsTab />}
      {activeTab === 'students'  && <StudentSettingsTab />}

      {/* About this platform */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden mt-2">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">About this Platform</p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="AMACOS" className="w-10 h-10 rounded-xl object-cover shadow-sm flex-shrink-0" />
            <div>
              <p className="text-[#1a3c5e] font-black text-sm">AMACOS Campus Platform</p>
              <p className="text-gray-400 text-xs">Adeleke University · Mass Communication</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <p className="text-gray-400 font-semibold">Executive Session</p>
              <p className="text-gray-700 font-bold mt-0.5">NEXUS Team 2026/2027</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold">Version</p>
              <p className="text-gray-700 font-bold mt-0.5">1.0.0</p>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-black">F</span>
            </div>
            <div>
              <p className="text-gray-500 text-[11px]">Designed & developed by</p>
              <p className="text-[#1a3c5e] font-black text-xs">Bukunmi <span className="text-gray-400 font-normal">·</span> <span className="text-amber-500">Flamedev Studio</span></p>
            </div>
          </div>
          <p className="text-gray-300 text-[10px]">© 2026 AMACOS. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
