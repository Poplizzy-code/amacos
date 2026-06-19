import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  Star, Megaphone, FlaskConical, CalendarDays, Users,
  Trash2, Upload, Search, Image as ImageIcon, X, Loader2,
  Plus, RefreshCw, MapPin, ExternalLink, ShieldCheck, ShieldOff,
  ChevronDown, ChevronUp,
} from 'lucide-react'

const TABS = [
  { id: 'spotlight', label: 'Final Year Spotlight', icon: Star },
  { id: 'press',     label: 'Press Release',        icon: Megaphone },
  { id: 'research',  label: 'Research & Opps',       icon: FlaskConical },
  { id: 'events',    label: 'Events',                icon: CalendarDays },
  { id: 'students',  label: 'Student Admins',        icon: Users },
]

function CenteredSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={28} className="animate-spin text-[#1a3c5e]" />
    </div>
  )
}

function ConfirmButton({ label, icon: Icon, onClick, className = '' }) {
  const [confirming, setConfirming] = useState(false)
  return confirming ? (
    <div className="flex items-center gap-1">
      <button onClick={() => { onClick(); setConfirming(false) }}
        className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
        Confirm
      </button>
      <button onClick={() => setConfirming(false)}
        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
        Cancel
      </button>
    </div>
  ) : (
    <button onClick={() => setConfirming(true)} className={className} title={label}>
      <Icon size={15} />
    </button>
  )
}

// ── Spotlight Tab ─────────────────────────────────────────────────────────────
function SpotlightTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ studentName: '', projectTitle: '', level: '400', description: '' })
  const [image, setImage] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/student-admin/spotlights', { withCredentials: true })
      setItems(data.spotlights || [])
    } catch { toast.error('Failed to load spotlights.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.studentName || !form.projectTitle || !form.level) {
      return toast.error('Student name, project title, and level are required.')
    }
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (image) fd.append('image', image)
      const { data } = await axios.post('/api/student-admin/spotlights', fd, { withCredentials: true })
      setItems(prev => [data.spotlight, ...prev])
      setForm({ studentName: '', projectTitle: '', level: '400', description: '' })
      setImage(null)
      setShowForm(false)
      toast.success('Spotlight added!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.')
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    try {
      await axios.delete(`/api/student-admin/spotlights/${id}`, { withCredentials: true })
      setItems(prev => prev.filter(x => x._id !== id))
      toast.success('Deleted.')
    } catch { toast.error('Failed to delete.') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[#1a3c5e] text-lg">Final Year Spotlight</h2>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-[#1a3c5e] hover:bg-[#152f4a] text-white text-sm font-bold px-4 py-2 rounded-xl transition">
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Entry</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-[#1a3c5e] flex items-center gap-2"><Star size={16} /> New Spotlight Entry</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Student Name *</label>
              <input value={form.studentName} onChange={e => setForm(p => ({ ...p, studentName: e.target.value }))}
                placeholder="e.g. Amara Okafor" required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Project Title *</label>
              <input value={form.projectTitle} onChange={e => setForm(p => ({ ...p, projectTitle: e.target.value }))}
                placeholder="e.g. Digital Media Influence on Youth" required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Level *</label>
              <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] bg-white">
                {['100', '200', '300', '400'].map(l => <option key={l} value={l}>{l}L</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Photo</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                  <ImageIcon size={14} /> {image ? image.name : 'Choose image'}
                </button>
                {image && <button type="button" onClick={() => setImage(null)}><X size={14} className="text-gray-400 hover:text-red-400" /></button>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files[0] || null)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3} placeholder="Brief description of the project..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none" />
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] text-sm font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </form>
      )}

      {loading ? <CenteredSpinner /> : (
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Star size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400 text-sm">No spotlight entries yet.</p>
            </div>
          )}
          {items.map(item => (
            <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.studentName} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Star size={22} className="text-amber-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1a3c5e] truncate">{item.studentName}</p>
                <p className="text-sm text-gray-500 truncate">{item.projectTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.level}L · Added by {item.createdBy?.fullName}</p>
              </div>
              <ConfirmButton label="Delete" icon={Trash2} onClick={() => remove(item._id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Press Release Tab ─────────────────────────────────────────────────────────
function PressTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [image, setImage] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/student-admin/press', { withCredentials: true })
      setItems(data.releases || [])
    } catch { toast.error('Failed to load press releases.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.content) return toast.error('Title and content are required.')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title); fd.append('content', form.content)
      if (image) fd.append('image', image)
      const { data } = await axios.post('/api/student-admin/press', fd, { withCredentials: true })
      setItems(prev => [data.release, ...prev])
      setForm({ title: '', content: '' }); setImage(null); setShowForm(false)
      toast.success('Press release published!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.')
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    try {
      await axios.delete(`/api/student-admin/press/${id}`, { withCredentials: true })
      setItems(prev => prev.filter(x => x._id !== id))
      toast.success('Deleted.')
    } catch { toast.error('Failed to delete.') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[#1a3c5e] text-lg">Press Releases</h2>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-[#1a3c5e] hover:bg-[#152f4a] text-white text-sm font-bold px-4 py-2 rounded-xl transition">
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> New Release</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-[#1a3c5e] flex items-center gap-2"><Megaphone size={16} /> New Press Release</h3>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Press release title" required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Content *</label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              rows={6} placeholder="Press release body…" required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Cover Image</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                <ImageIcon size={14} /> {image ? image.name : 'Choose image'}
              </button>
              {image && <button type="button" onClick={() => setImage(null)}><X size={14} className="text-gray-400 hover:text-red-400" /></button>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files[0] || null)} />
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] text-sm font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {saving ? 'Publishing…' : 'Publish Release'}
          </button>
        </form>
      )}

      {loading ? <CenteredSpinner /> : (
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Megaphone size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400 text-sm">No press releases yet.</p>
            </div>
          )}
          {items.map(item => (
            <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Megaphone size={22} className="text-purple-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1a3c5e] truncate">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.content}</p>
                <p className="text-xs text-gray-400 mt-1">By {item.author?.fullName} · {new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
              <ConfirmButton label="Delete" icon={Trash2} onClick={() => remove(item._id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Research Tab ──────────────────────────────────────────────────────────────
const RESEARCH_CATS = [
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'internship',  label: 'Internship' },
  { value: 'fellowship',  label: 'Fellowship' },
  { value: 'competition', label: 'Competition' },
  { value: 'conference',  label: 'Conference' },
  { value: 'other',       label: 'Other' },
]

function ResearchTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', link: '', deadline: '', category: 'other' })
  const [image, setImage] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/student-admin/research', { withCredentials: true })
      setItems(data.research || [])
    } catch { toast.error('Failed to load research items.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description) return toast.error('Title and description are required.')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
      if (image) fd.append('image', image)
      const { data } = await axios.post('/api/student-admin/research', fd, { withCredentials: true })
      setItems(prev => [data.research, ...prev])
      setForm({ title: '', description: '', link: '', deadline: '', category: 'other' })
      setImage(null); setShowForm(false)
      toast.success('Research & Opportunity posted!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.')
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    try {
      await axios.delete(`/api/student-admin/research/${id}`, { withCredentials: true })
      setItems(prev => prev.filter(x => x._id !== id))
      toast.success('Deleted.')
    } catch { toast.error('Failed to delete.') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[#1a3c5e] text-lg">Research & Opportunities</h2>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-[#1a3c5e] hover:bg-[#152f4a] text-white text-sm font-bold px-4 py-2 rounded-xl transition">
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Opportunity</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-[#1a3c5e] flex items-center gap-2"><FlaskConical size={16} /> New Opportunity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Google Africa Developer Scholarship" required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] bg-white">
                {RESEARCH_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Description *</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={4} placeholder="Details about the opportunity…" required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Link</label>
              <input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                placeholder="https://..." type="url"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Image</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                  <ImageIcon size={14} /> {image ? image.name : 'Choose image'}
                </button>
                {image && <button type="button" onClick={() => setImage(null)}><X size={14} className="text-gray-400 hover:text-red-400" /></button>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files[0] || null)} />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] text-sm font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {saving ? 'Posting…' : 'Post Opportunity'}
          </button>
        </form>
      )}

      {loading ? <CenteredSpinner /> : (
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <FlaskConical size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400 text-sm">No research & opportunities yet.</p>
            </div>
          )}
          {items.map(item => (
            <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <FlaskConical size={22} className="text-emerald-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[#1a3c5e] truncate">{item.title}</p>
                  <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full capitalize font-medium flex-shrink-0">{item.category}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  {item.deadline && <span className="text-xs text-orange-500 font-medium">Deadline: {new Date(item.deadline).toLocaleDateString()}</span>}
                  {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-[#1a3c5e] flex items-center gap-1 hover:underline"><ExternalLink size={10} /> Apply</a>}
                </div>
              </div>
              <ConfirmButton label="Delete" icon={Trash2} onClick={() => remove(item._id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Events Tab ────────────────────────────────────────────────────────────────
function EventsTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', location: '' })
  const [image, setImage] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/student-admin/events', { withCredentials: true })
      setItems(data.events || [])
    } catch { toast.error('Failed to load events.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.date) return toast.error('Title, description and date are required.')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (image) fd.append('image', image)
      const { data } = await axios.post('/api/student-admin/events', fd, { withCredentials: true })
      setItems(prev => [...prev, data.event].sort((a, b) => new Date(a.date) - new Date(b.date)))
      setForm({ title: '', description: '', date: '', time: '', location: '' })
      setImage(null); setShowForm(false)
      toast.success('Event created!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.')
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    try {
      await axios.delete(`/api/student-admin/events/${id}`, { withCredentials: true })
      setItems(prev => prev.filter(x => x._id !== id))
      toast.success('Deleted.')
    } catch { toast.error('Failed to delete.') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[#1a3c5e] text-lg">Events</h2>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-[#1a3c5e] hover:bg-[#152f4a] text-white text-sm font-bold px-4 py-2 rounded-xl transition">
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Event</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-[#1a3c5e] flex items-center gap-2"><CalendarDays size={16} /> New Event</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. AMACOS Annual Media Week" required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Date *</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Time</label>
              <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Location</label>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Mass Comm Hall, AU"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Event Image</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                  <ImageIcon size={14} /> {image ? image.name : 'Choose image'}
                </button>
                {image && <button type="button" onClick={() => setImage(null)}><X size={14} className="text-gray-400 hover:text-red-400" /></button>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files[0] || null)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Description *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={4} placeholder="Event details…" required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none" />
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] text-sm font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {saving ? 'Creating…' : 'Create Event'}
          </button>
        </form>
      )}

      {loading ? <CenteredSpinner /> : (
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <CalendarDays size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400 text-sm">No events yet.</p>
            </div>
          )}
          {items.map(item => (
            <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <CalendarDays size={22} className="text-blue-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1a3c5e] truncate">{item.title}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}{item.time && ` at ${item.time}`}</span>
                  {item.location && (
                    <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} /> {item.location}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">By {item.author?.fullName}</p>
              </div>
              <ConfirmButton label="Delete" icon={Trash2} onClick={() => remove(item._id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Students Tab ──────────────────────────────────────────────────────────────
function StudentsTab() {
  const { user: currentUser } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/student-admin/students', { withCredentials: true })
      setStudents(data.students || [])
    } catch { toast.error('Failed to load students.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const toggleAdmin = async (student) => {
    const newStatus = !student.isStudentAdmin
    setActionLoading(student._id)
    try {
      const { data } = await axios.put(`/api/student-admin/students/${student._id}/admin`,
        { isStudentAdmin: newStatus }, { withCredentials: true })
      setStudents(prev => prev.map(s => s._id === student._id ? { ...s, isStudentAdmin: data.student.isStudentAdmin } : s))
      toast.success(newStatus ? `${student.fullName} is now a Student Admin.` : `${student.fullName} is no longer a Student Admin.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.')
    } finally { setActionLoading(null) }
  }

  const filtered = students.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.matricNumber?.toLowerCase().includes(search.toLowerCase())
  )

  const admins = filtered.filter(s => s.isStudentAdmin)
  const others = filtered.filter(s => !s.isStudentAdmin)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-[#1a3c5e] text-lg">Student Admin Management</h2>
        <button onClick={load} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500" title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
        <Search size={15} className="text-gray-400 flex-shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or matric…"
          className="flex-1 text-sm focus:outline-none text-gray-700 bg-transparent" />
      </div>

      {loading ? <CenteredSpinner /> : (
        <div className="space-y-5">
          {/* Current admins */}
          <div>
            <p className="text-xs font-bold text-[#1a3c5e] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-amber-500" /> Student Admins ({admins.length})
            </p>
            {admins.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
                <p className="text-gray-400 text-sm">No student admins yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {admins.map(s => (
                  <StudentRow key={s._id} student={s} isSelf={s._id === currentUser?._id}
                    loading={actionLoading === s._id} onToggle={toggleAdmin} />
                ))}
              </div>
            )}
          </div>

          {/* Regular students */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              All Students ({others.length})
            </p>
            {others.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
                <p className="text-gray-400 text-sm">No regular students found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {others.map(s => (
                  <StudentRow key={s._id} student={s} isSelf={false}
                    loading={actionLoading === s._id} onToggle={toggleAdmin} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StudentRow({ student, isSelf, loading, onToggle }) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-3 flex items-center gap-3 ${student.isStudentAdmin ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'}`}>
      {student.avatar ? (
        <img src={student.avatar} alt={student.fullName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {student.fullName?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[#1a3c5e] text-sm truncate">{student.fullName}</p>
          {student.isStudentAdmin && (
            <span className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Admin</span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{student.email} · {student.level}L{student.matricNumber ? ` · ${student.matricNumber}` : ''}</p>
      </div>
      {!isSelf && (
        <button
          onClick={() => onToggle(student)}
          disabled={loading}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition flex-shrink-0 ${
            student.isStudentAdmin
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-[#1a3c5e]/5 text-[#1a3c5e] hover:bg-[#1a3c5e]/10'
          } disabled:opacity-50`}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : student.isStudentAdmin ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
          {student.isStudentAdmin ? 'Demote' : 'Make Admin'}
        </button>
      )}
      {isSelf && <span className="text-xs text-gray-400 px-3 py-2 flex-shrink-0">You</span>}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StudentPanel() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('spotlight')
  const [mobileTabOpen, setMobileTabOpen] = useState(false)

  if (!user?.isStudentAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-[#1a3c5e]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={28} className="text-[#1a3c5e]/30" />
        </div>
        <h2 className="text-xl font-bold text-[#1a3c5e] mb-2">Student Admin Only</h2>
        <p className="text-gray-400 text-sm max-w-sm">You need student admin privileges to access this panel.</p>
      </div>
    )
  }

  const currentTab = TABS.find(t => t.id === activeTab)

  return (
    <div className="flex gap-6">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-52 flex-shrink-0 gap-1">
        <div className="bg-gradient-to-b from-[#0d1f35] to-[#060d1a] rounded-2xl p-3 mb-2">
          <p className="text-white text-xs font-bold uppercase tracking-wider px-2 py-1 mb-1">Student Panel</p>
          <p className="text-blue-400 text-xs px-2">{user.fullName?.split(' ')[0]}</p>
        </div>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all w-full text-left ${
              activeTab === t.id
                ? 'bg-amber-400/10 text-amber-600 font-semibold'
                : 'text-gray-600 hover:bg-gray-100 hover:text-[#1a3c5e]'
            }`}>
            <t.icon size={16} className={activeTab === t.id ? 'text-amber-500' : 'text-gray-400'} />
            {t.label}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Mobile tab selector */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileTabOpen(v => !v)}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-2">
              {currentTab && <currentTab.icon size={16} className="text-[#1a3c5e]" />}
              <span className="font-semibold text-[#1a3c5e] text-sm">{currentTab?.label}</span>
            </div>
            {mobileTabOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {mobileTabOpen && (
            <div className="absolute z-20 mt-1 w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
              {TABS.map(t => (
                <button key={t.id} onClick={() => { setActiveTab(t.id); setMobileTabOpen(false) }}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition hover:bg-gray-50 ${
                    activeTab === t.id ? 'text-amber-600 font-semibold bg-amber-50' : 'text-gray-700'
                  }`}>
                  <t.icon size={15} className={activeTab === t.id ? 'text-amber-500' : 'text-gray-400'} />
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab content */}
        {activeTab === 'spotlight' && <SpotlightTab />}
        {activeTab === 'press'     && <PressTab />}
        {activeTab === 'research'  && <ResearchTab />}
        {activeTab === 'events'    && <EventsTab />}
        {activeTab === 'students'  && <StudentsTab />}
      </div>
    </div>
  )
}
