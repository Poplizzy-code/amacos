import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, BookOpen, Newspaper, FileQuestion,
  CalendarDays, FlaskConical, Megaphone, Star,
  ShieldCheck, ShieldOff, Trash2, Upload, Search,
  FileText, Image as ImageIcon, Film, File, X, Loader2, Plus,
  RefreshCw, Eye, Calendar, MapPin, ExternalLink, User, Download
} from 'lucide-react'

const TABS = [
  { id: 'overview',       label: 'Overview',       icon: LayoutDashboard },
  { id: 'users',          label: 'Users',           icon: Users },
  { id: 'resources',      label: 'Resources',       icon: BookOpen },
  { id: 'past-questions', label: 'Past Questions',  icon: FileQuestion },
  { id: 'events',         label: 'Events',          icon: CalendarDays },
  { id: 'research',       label: 'Research & Opps', icon: FlaskConical },
  { id: 'press',          label: 'Press Release',   icon: Megaphone },
  { id: 'spotlight',      label: 'Spotlight',       icon: Star },
  { id: 'news',           label: 'News',            icon: Newspaper },
]

const UPLOAD_TYPES = [
  { value: 'document', label: 'Document', icon: File,     accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt' },
  { value: 'image',    label: 'Image',    icon: ImageIcon, accept: 'image/*' },
  { value: 'video',    label: 'Video',    icon: Film,      accept: 'video/*' },
]

const CATEGORIES = [
  { value: 'lecture-note', label: 'Lecture Note' },
  { value: 'past-question', label: 'Past Question' },
  { value: 'textbook', label: 'Textbook' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'other', label: 'Other' },
]

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  lecturer: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1a3c5e]">{value ?? '—'}</p>
        <p className="text-gray-500 text-sm">{label}</p>
      </div>
    </div>
  )
}

function ConfirmButton({ label, icon: Icon, onClick, className = '' }) {
  const [confirming, setConfirming] = useState(false)
  return confirming ? (
    <div className="flex items-center gap-1">
      <button
        onClick={() => { onClick(); setConfirming(false) }}
        className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
      >
        Confirm
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
      >
        Cancel
      </button>
    </div>
  ) : (
    <button onClick={() => setConfirming(true)} className={className} title={label}>
      <Icon size={15} />
    </button>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          axios.get('/api/admin/stats', { withCredentials: true }),
          axios.get('/api/admin/users', { withCredentials: true }),
        ])
        setStats(statsRes.data.stats)
        setRecentUsers(usersRes.data.users.slice(0, 6))
      } catch {
        toast.error('Failed to load stats.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <CenteredSpinner />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="bg-blue-50 text-blue-600" />
        <StatCard icon={ShieldCheck} label="Admins" value={stats?.totalAdmins} color="bg-purple-50 text-purple-600" />
        <StatCard icon={BookOpen} label="Resources" value={stats?.totalResources} color="bg-amber-50 text-amber-600" />
        <StatCard icon={Newspaper} label="News Articles" value={stats?.totalNews} color="bg-green-50 text-green-600" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-[#1a3c5e]">Recent Members</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {recentUsers.length === 0 ? (
            <p className="text-gray-400 text-sm p-5">No users found.</p>
          ) : (
            recentUsers.map(u => (
              <div key={u._id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-[#1a3c5e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {u.fullName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.fullName}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                  {u.role}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/admin/users', { withCredentials: true })
      setUsers(data.users)
    } catch {
      toast.error('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const changeRole = async (userId, newRole) => {
    setActionLoading(userId + newRole)
    try {
      const { data } = await axios.put(`/api/admin/users/${userId}/role`, { role: newRole }, { withCredentials: true })
      setUsers(prev => prev.map(u => u._id === userId ? data.user : u))
      toast.success(`Role updated to ${newRole}.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role.')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteUser = async (userId) => {
    setActionLoading(userId + 'delete')
    try {
      await axios.delete(`/api/admin/users/${userId}`, { withCredentials: true })
      setUsers(prev => prev.filter(u => u._id !== userId))
      toast.success('User deleted.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <CenteredSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
          />
        </div>
        <button
          onClick={fetchUsers}
          className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Member</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Level</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Joined</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-10">No users found.</td>
                </tr>
              ) : (
                filtered.map(u => {
                  const isSelf = u._id === currentUser?._id
                  return (
                    <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1a3c5e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {u.fullName}
                              {isSelf && <span className="ml-1.5 text-xs text-amber-500 font-semibold">(you)</span>}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-gray-600">{u.level}L</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-gray-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {!isSelf && (
                            <>
                              {u.role === 'admin' ? (
                                <ConfirmButton
                                  label="Remove Admin"
                                  icon={ShieldOff}
                                  onClick={() => changeRole(u._id, 'student')}
                                  className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                                />
                              ) : (
                                <ConfirmButton
                                  label="Make Admin"
                                  icon={ShieldCheck}
                                  onClick={() => changeRole(u._id, 'admin')}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                />
                              )}
                              <ConfirmButton
                                label="Delete User"
                                icon={Trash2}
                                onClick={() => deleteUser(u._id)}
                                className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                              />
                            </>
                          )}
                          {actionLoading?.startsWith(u._id) && (
                            <Loader2 size={14} className="animate-spin text-gray-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          {filtered.length} of {users.length} members
        </div>
      </div>
    </div>
  )
}

// ─── Resources Tab ────────────────────────────────────────────────────────────
function ResourcesTab() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [uploadType, setUploadType] = useState('document')
  const [form, setForm] = useState({ title: '', description: '', category: 'other' })
  const [file, setFile] = useState(null)
  const fileRef = useRef()

  const fetchResources = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/admin/resources', { withCredentials: true })
      setResources(data.resources)
    } catch {
      toast.error('Failed to load resources.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchResources() }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file.')
    if (!form.title.trim()) return toast.error('Title is required.')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('category', form.category)
      fd.append('file', file)
      const { data } = await axios.post('/api/admin/resources', fd, {
        withCredentials: true,
      })
      setResources(prev => [data.resource, ...prev])
      setForm({ title: '', description: '', category: 'other' })
      setFile(null)
      fileRef.current.value = ''
      setShowForm(false)
      toast.success('Resource uploaded!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const deleteResource = async (id) => {
    try {
      await axios.delete(`/api/admin/resources/${id}`, { withCredentials: true })
      setResources(prev => prev.filter(r => r._id !== id))
      toast.success('Resource deleted.')
    } catch {
      toast.error('Failed to delete resource.')
    }
  }

  const catLabel = (val) => CATEGORIES.find(c => c.value === val)?.label || val

  if (loading) return <CenteredSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{resources.length} resource{resources.length !== 1 ? 's' : ''} uploaded</p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] transition-colors font-medium"
        >
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Upload Resource</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-[#1a3c5e]">Upload New Resource</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. COM 301 Lecture Note"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] bg-white"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description (optional)"
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">File Type</label>
            <div className="flex gap-2 mb-3">
              {UPLOAD_TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => { setUploadType(t.value); setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition ${uploadType === t.value ? 'bg-[#1a3c5e] text-white border-[#1a3c5e]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#1a3c5e]/40'}`}>
                  <t.icon size={13} /> {t.label}
                </button>
              ))}
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#1a3c5e]/40 hover:bg-gray-50 transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-[#1a3c5e] font-medium">
                  <FileText size={18} />
                  <span className="truncate max-w-xs">{file.name}</span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setFile(null); fileRef.current.value = '' }}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-400">Click to browse — {UPLOAD_TYPES.find(t => t.value === uploadType)?.label}</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept={UPLOAD_TYPES.find(t => t.value === uploadType)?.accept}
              onChange={e => setFile(e.target.files[0] || null)}
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] transition-colors font-medium disabled:opacity-60"
          >
            {uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading...</> : <><Upload size={15} /> Upload</>}
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {resources.length === 0 ? (
          <div className="p-10 text-center">
            <BookOpen size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-sm">No resources uploaded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {resources.map(r => (
              <div key={r._id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{r.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{catLabel(r.category)}</span>
                    {r.description && <span className="text-xs text-gray-400 truncate max-w-xs">{r.description}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    by {r.uploadedBy?.fullName} · {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View file"
                  >
                    <Eye size={15} />
                  </a>
                  <ConfirmButton
                    label="Delete"
                    icon={Trash2}
                    onClick={() => deleteResource(r._id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── News Tab ─────────────────────────────────────────────────────────────────
function NewsTab() {
  const [newsItems, setNewsItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const imageRef = useRef()

  const fetchNews = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/admin/news', { withCredentials: true })
      setNewsItems(data.news)
    } catch {
      toast.error('Failed to load news.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNews() }, [])

  const handleImageChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setImage(f)
    setImagePreview(URL.createObjectURL(f))
  }

  const clearImage = () => {
    setImage(null)
    setImagePreview(null)
    if (imageRef.current) imageRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return toast.error('Title and content are required.')
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('content', form.content)
      if (image) fd.append('image', image)
      const { data } = await axios.post('/api/admin/news', fd, {
        withCredentials: true,
      })
      setNewsItems(prev => [data.news, ...prev])
      setForm({ title: '', content: '' })
      clearImage()
      setShowForm(false)
      toast.success('News article published!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish news.')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteNews = async (id) => {
    try {
      await axios.delete(`/api/admin/news/${id}`, { withCredentials: true })
      setNewsItems(prev => prev.filter(n => n._id !== id))
      toast.success('News deleted.')
    } catch {
      toast.error('Failed to delete news.')
    }
  }

  if (loading) return <CenteredSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{newsItems.length} article{newsItems.length !== 1 ? 's' : ''} published</p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] transition-colors font-medium"
        >
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> New Article</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-[#1a3c5e]">Publish News Article</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Article headline..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Content *</label>
            <textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="Write the full article content here..."
              rows={6}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Cover Image (optional)</label>
            {imagePreview ? (
              <div className="relative w-full max-w-sm">
                <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => imageRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#1a3c5e]/40 hover:bg-gray-50 transition-colors max-w-sm"
              >
                <ImageIcon size={22} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">Click to add cover image</p>
                <p className="text-xs text-gray-300 mt-0.5">JPG, PNG, WebP</p>
              </div>
            )}
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] transition-colors font-medium disabled:opacity-60"
          >
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Publishing...</> : <><Newspaper size={15} /> Publish</>}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {newsItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
            <Newspaper size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-sm">No news articles published yet.</p>
          </div>
        ) : (
          newsItems.map(n => (
            <div key={n._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex gap-4 p-4">
                {n.imageUrl && (
                  <img
                    src={n.imageUrl}
                    alt={n.title}
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{n.title}</p>
                    <ConfirmButton
                      label="Delete"
                      icon={Trash2}
                      onClick={() => deleteNews(n._id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{n.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><User size={11} />{n.author?.fullName}</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function SpotlightTab() {
  const [spotlights, setSpotlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ studentName: '', projectTitle: '', level: '400L', description: '' })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const imageRef = useRef()
  const levels = ['100L', '200L', '300L', '400L', '500L']

  const fetchSpotlights = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/admin/spotlights', { withCredentials: true })
      setSpotlights(data.spotlights || [])
    } catch {
      toast.error('Failed to load spotlight entries.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSpotlights() }, [])

  const clearImage = () => {
    setImage(null)
    setImagePreview(null)
    if (imageRef.current) imageRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.studentName.trim() || !form.projectTitle.trim() || !form.level.trim()) {
      return toast.error('Student name, project title, and level are required.')
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('studentName', form.studentName)
      fd.append('projectTitle', form.projectTitle)
      fd.append('level', form.level)
      fd.append('description', form.description)
      if (image) fd.append('image', image)
      const { data } = await axios.post('/api/admin/spotlights', fd, { withCredentials: true })
      setSpotlights(prev => [data.spotlight, ...prev])
      setForm({ studentName: '', projectTitle: '', level: '400L', description: '' })
      clearImage()
      setShowForm(false)
      toast.success('Spotlight entry published!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish spotlight entry.')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteSpotlight = async (id) => {
    try {
      await axios.delete(`/api/admin/spotlights/${id}`, { withCredentials: true })
      setSpotlights(prev => prev.filter(item => item._id !== id))
      toast.success('Spotlight entry deleted.')
    } catch {
      toast.error('Failed to delete spotlight entry.')
    }
  }

  if (loading) return <CenteredSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{spotlights.length} spotlight entr{spotlights.length === 1 ? 'y' : 'ies'} published</p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] transition-colors font-medium"
        >
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> New Spotlight</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-[#1a3c5e]">Publish Final Year Spotlight</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Student Name *</label>
              <input
                value={form.studentName}
                onChange={e => setForm(p => ({ ...p, studentName: e.target.value }))}
                placeholder="e.g. Oluchi Nnadi"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Level *</label>
              <select
                value={form.level}
                onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
              >
                {levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Project Title *</label>
            <input
              value={form.projectTitle}
              onChange={e => setForm(p => ({ ...p, projectTitle: e.target.value }))}
              placeholder="e.g. Impact of Social Media on Youth Voting Behaviour"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Short Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Optional summary of the project or student achievement"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Image (optional)</label>
            {imagePreview ? (
              <div className="relative w-full max-w-sm">
                <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => imageRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#1a3c5e]/40 hover:bg-gray-50 transition-colors max-w-sm"
              >
                <ImageIcon size={22} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">Click to add student photo or project image</p>
              </div>
            )}
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files[0]
              if (!f) return
              setImage(f)
              setImagePreview(URL.createObjectURL(f))
            }} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] transition-colors font-medium disabled:opacity-60"
          >
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Publishing...</> : <><Star size={15} /> Publish</>}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {spotlights.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
            <Star size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-sm">No spotlight entries yet. Publish one from the admin panel to make it visible here.</p>
          </div>
        ) : (
          spotlights.map(item => (
            <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-colors">
              <div className="flex items-start gap-4">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.studentName} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#1a3c5e]/10 flex items-center justify-center text-2xl font-bold text-[#1a3c5e] flex-shrink-0">
                    {item.studentName?.charAt(0) || 'F'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[#1a3c5e] text-sm truncate">{item.studentName}</h3>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{item.level}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">{item.projectTitle}</p>
                  {item.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{item.description}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><User size={11} />{item.createdBy?.fullName || 'Admin'}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <ConfirmButton
                  label="Delete"
                  icon={Trash2}
                  onClick={() => deleteSpotlight(item._id)}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Events Tab ───────────────────────────────────────────────────────────────
function EventsTab() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', location: '' })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const imageRef = useRef()

  useEffect(() => {
    axios.get('/api/admin/events', { withCredentials: true })
      .then(res => setEvents(res.data.events || []))
      .catch(() => toast.error('Failed to load events.'))
      .finally(() => setLoading(false))
  }, [])

  const clearImage = () => { setImage(null); setImagePreview(null); if (imageRef.current) imageRef.current.value = '' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.date) return toast.error('Title, description and date are required.')
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (image) fd.append('image', image)
      const { data } = await axios.post('/api/admin/events', fd, { withCredentials: true })
      setEvents(prev => [...prev, data.event].sort((a, b) => new Date(a.date) - new Date(b.date)))
      setForm({ title: '', description: '', date: '', time: '', location: '' })
      clearImage(); setShowForm(false)
      toast.success('Event created!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event.')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteEvent = async (id) => {
    try {
      await axios.delete(`/api/admin/events/${id}`, { withCredentials: true })
      setEvents(prev => prev.filter(e => e._id !== id))
      toast.success('Event deleted.')
    } catch { toast.error('Failed.') }
  }

  if (loading) return <CenteredSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] font-medium">
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Event</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-[#1a3c5e]">Create Event</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Event title"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe the event..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Date *</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Time</label>
              <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Location</label>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Main Hall"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Cover Image (optional)</label>
            {imagePreview ? (
              <div className="relative w-full max-w-sm">
                <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                <button type="button" onClick={clearImage} className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"><X size={12} /></button>
              </div>
            ) : (
              <div onClick={() => imageRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#1a3c5e]/40 hover:bg-gray-50 max-w-sm">
                <ImageIcon size={22} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">Click to add event image</p>
              </div>
            )}
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) { setImage(f); setImagePreview(URL.createObjectURL(f)) } }} />
          </div>
          <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] font-medium disabled:opacity-60">
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Creating...</> : <><CalendarDays size={15} /> Create Event</>}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm"><CalendarDays size={32} className="mx-auto mb-3 text-gray-200" /><p className="text-gray-400 text-sm">No events yet.</p></div>
        ) : events.map(ev => (
          <div key={ev._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
            {ev.imageUrl && <img src={ev.imageUrl} alt={ev.title} className="w-24 h-auto object-cover flex-shrink-0" />}
            <div className="p-4 flex-1 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{ev.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(ev.date).toLocaleDateString()}</span>
                  {ev.time && <span>{ev.time}</span>}
                  {ev.location && <span className="flex items-center gap-1"><MapPin size={11} /> {ev.location}</span>}
                </p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ev.description}</p>
              </div>
              <ConfirmButton label="Delete" icon={Trash2} onClick={() => deleteEvent(ev._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Research Tab ──────────────────────────────────────────────────────────────
const RESEARCH_CATS = [
  { value: 'research', label: 'Research' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'internship', label: 'Internship' },
  { value: 'other', label: 'Other' },
]

function ResearchTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', link: '', deadline: '', category: 'opportunity' })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const imageRef = useRef()

  useEffect(() => {
    axios.get('/api/admin/research', { withCredentials: true })
      .then(res => setItems(res.data.research || []))
      .catch(() => toast.error('Failed to load.'))
      .finally(() => setLoading(false))
  }, [])

  const clearImage = () => { setImage(null); setImagePreview(null); if (imageRef.current) imageRef.current.value = '' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description) return toast.error('Title and description are required.')
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (image) fd.append('image', image)
      const { data } = await axios.post('/api/admin/research', fd, { withCredentials: true })
      setItems(prev => [data.research, ...prev])
      setForm({ title: '', description: '', link: '', deadline: '', category: 'opportunity' })
      clearImage(); setShowForm(false)
      toast.success('Posted!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteItem = async (id) => {
    try {
      await axios.delete(`/api/admin/research/${id}`, { withCredentials: true })
      setItems(prev => prev.filter(i => i._id !== id))
      toast.success('Deleted.')
    } catch { toast.error('Failed.') }
  }

  if (loading) return <CenteredSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] font-medium">
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Item</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-[#1a3c5e]">Post Research / Opportunity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Title"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]">
                {RESEARCH_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} placeholder="Full description..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Link / URL</label>
              <input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="https://..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Cover Image (optional)</label>
            {imagePreview ? (
              <div className="relative w-full max-w-sm">
                <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                <button type="button" onClick={clearImage} className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"><X size={12} /></button>
              </div>
            ) : (
              <div onClick={() => imageRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#1a3c5e]/40 hover:bg-gray-50 max-w-sm">
                <ImageIcon size={22} className="mx-auto mb-2 text-gray-300" /><p className="text-sm text-gray-400">Click to add image</p>
              </div>
            )}
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) { setImage(f); setImagePreview(URL.createObjectURL(f)) } }} />
          </div>
          <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] font-medium disabled:opacity-60">
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Posting...</> : <><FlaskConical size={15} /> Post</>}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm"><FlaskConical size={32} className="mx-auto mb-3 text-gray-200" /><p className="text-gray-400 text-sm">No items yet.</p></div>
        ) : items.map(it => (
          <div key={it._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3">
            {it.imageUrl && <img src={it.imageUrl} alt={it.title} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{it.title}</p>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{it.category}</span>
                </div>
                <ConfirmButton label="Delete" icon={Trash2} onClick={() => deleteItem(it._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg flex-shrink-0" />
              </div>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{it.description}</p>
              {it.link && <a href={it.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 flex items-center gap-1 mt-1"><ExternalLink size={10} /> {it.link}</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Past Questions Tab ───────────────────────────────────────────────────────
function PastQuestionsTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [file, setFile] = useState(null)
  const fileRef = useRef()

  const fetchItems = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/admin/resources', { withCredentials: true })
      setItems((data.resources || []).filter(r => r.category === 'past-question'))
    } catch {
      toast.error('Failed to load past questions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file.')
    if (!form.title.trim()) return toast.error('Title is required.')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('category', 'past-question')
      fd.append('file', file)
      const { data } = await axios.post('/api/admin/resources', fd, {
        withCredentials: true,
      })
      setItems(prev => [data.resource, ...prev])
      setForm({ title: '', description: '' })
      setFile(null)
      fileRef.current.value = ''
      setShowForm(false)
      toast.success('Past question uploaded!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const deleteItem = async (id) => {
    try {
      await axios.delete(`/api/admin/resources/${id}`, { withCredentials: true })
      setItems(prev => prev.filter(r => r._id !== id))
      toast.success('Deleted.')
    } catch {
      toast.error('Failed to delete.')
    }
  }

  if (loading) return <CenteredSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{items.length} past question{items.length !== 1 ? 's' : ''} uploaded</p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] transition-colors font-medium"
        >
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Upload Past Question</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-[#1a3c5e]">Upload Past Question</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. COM 301 2023/2024 Past Question"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
              <div className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-amber-50 text-amber-700 font-medium">
                Past Question (fixed)
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. 100L semester 1 exam (optional)"
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">File * (PDF, DOCX, etc.)</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#1a3c5e]/40 hover:bg-gray-50 transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-[#1a3c5e] font-medium">
                  <FileText size={18} />
                  <span className="truncate max-w-xs">{file.name}</span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setFile(null); fileRef.current.value = '' }}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-400">Click to browse or drag & drop</p>
                  <p className="text-xs text-gray-300 mt-1">PDF, DOCX, images supported</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files[0] || null)} />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] transition-colors font-medium disabled:opacity-60"
          >
            {uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading...</> : <><Upload size={15} /> Upload</>}
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center">
            <FileQuestion size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-sm">No past questions uploaded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map(r => (
              <div key={r._id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{r.title}</p>
                  {r.description && <p className="text-xs text-gray-400 truncate">{r.description}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
                    by {r.uploadedBy?.fullName} · {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors" title="View file">
                    <Eye size={15} />
                  </a>
                  <ConfirmButton
                    label="Delete"
                    icon={Trash2}
                    onClick={() => deleteItem(r._id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Press Release Tab ─────────────────────────────────────────────────────────
function PressTab() {
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const imageRef = useRef()

  useEffect(() => {
    axios.get('/api/admin/press', { withCredentials: true })
      .then(res => setReleases(res.data.releases || []))
      .catch(() => toast.error('Failed to load.'))
      .finally(() => setLoading(false))
  }, [])

  const clearImage = () => { setImage(null); setImagePreview(null); if (imageRef.current) imageRef.current.value = '' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.content) return toast.error('Title and content are required.')
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('content', form.content)
      if (image) fd.append('image', image)
      const { data } = await axios.post('/api/admin/press', fd, { withCredentials: true })
      setReleases(prev => [data.release, ...prev])
      setForm({ title: '', content: '' })
      clearImage(); setShowForm(false)
      toast.success('Press release published!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteRelease = async (id) => {
    try {
      await axios.delete(`/api/admin/press/${id}`, { withCredentials: true })
      setReleases(prev => prev.filter(r => r._id !== id))
      toast.success('Deleted.')
    } catch { toast.error('Failed.') }
  }

  if (loading) return <CenteredSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{releases.length} release{releases.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] font-medium">
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> New Release</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-[#1a3c5e]">Publish Press Release</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Press release headline"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Content *</label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={8} placeholder="Full press release content..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Cover Image (optional)</label>
            {imagePreview ? (
              <div className="relative w-full max-w-sm">
                <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                <button type="button" onClick={clearImage} className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center"><X size={12} /></button>
              </div>
            ) : (
              <div onClick={() => imageRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#1a3c5e]/40 hover:bg-gray-50 max-w-sm">
                <ImageIcon size={22} className="mx-auto mb-2 text-gray-300" /><p className="text-sm text-gray-400">Click to add image</p>
              </div>
            )}
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) { setImage(f); setImagePreview(URL.createObjectURL(f)) } }} />
          </div>
          <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] font-medium disabled:opacity-60">
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Publishing...</> : <><Megaphone size={15} /> Publish</>}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {releases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm"><Megaphone size={32} className="mx-auto mb-3 text-gray-200" /><p className="text-gray-400 text-sm">No press releases yet.</p></div>
        ) : releases.map(r => (
          <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
            {r.imageUrl && <img src={r.imageUrl} alt={r.title} className="w-24 h-auto object-cover flex-shrink-0" />}
            <div className="p-4 flex-1 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{r.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{r.content}</p>
              </div>
              <ConfirmButton label="Delete" icon={Trash2} onClick={() => deleteRelease(r._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CenteredSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={24} className="animate-spin text-[#1a3c5e]" />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1a3c5e]">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-1">Manage users, content, and resources</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[#1a3c5e] text-white shadow-sm'
                : 'text-gray-500 hover:text-[#1a3c5e] hover:bg-gray-50'
            }`}
          >
            <tab.icon size={15} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview'       && <OverviewTab />}
      {activeTab === 'users'          && <UsersTab />}
      {activeTab === 'resources'      && <ResourcesTab />}
      {activeTab === 'past-questions' && <PastQuestionsTab />}
      {activeTab === 'events'         && <EventsTab />}
      {activeTab === 'research'       && <ResearchTab />}
      {activeTab === 'press'          && <PressTab />}
      {activeTab === 'spotlight'      && <SpotlightTab />}
      {activeTab === 'news'           && <NewsTab />}
    </div>
  )
}
