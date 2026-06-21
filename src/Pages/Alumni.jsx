import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  Users, Briefcase, User, Plus, Search, Loader2, X, Check,
  ChevronDown, ChevronUp, ExternalLink, Mail, Phone, Linkedin,
  MapPin, Calendar, Edit2, Save, Trash2, ArrowLeft, Send,
  BookOpen, Star, CheckCircle2, AlertCircle, Globe,
} from 'lucide-react'

const FIELDS = [
  { id: 'all',              label: 'All Fields' },
  { id: 'journalism',       label: 'Journalism' },
  { id: 'broadcasting',     label: 'Broadcasting' },
  { id: 'pr',               label: 'Public Relations' },
  { id: 'content_creation', label: 'Content Creation' },
  { id: 'advertising',      label: 'Advertising' },
  { id: 'media_production', label: 'Media Production' },
  { id: 'filmmaking',       label: 'Filmmaking' },
  { id: 'other',            label: 'Other' },
]

const OPP_TYPES = [
  { id: 'all',        label: 'All',        color: 'text-gray-600  bg-gray-100'   },
  { id: 'job',        label: 'Job',        color: 'text-blue-600  bg-blue-50'    },
  { id: 'internship', label: 'Internship', color: 'text-green-600 bg-green-50'   },
  { id: 'freelance',  label: 'Freelance',  color: 'text-purple-600 bg-purple-50' },
  { id: 'volunteer',  label: 'Volunteer',  color: 'text-amber-600 bg-amber-50'   },
]

const FIELD_COLORS = {
  journalism:       'text-blue-600   bg-blue-50   border-blue-200',
  broadcasting:     'text-red-600    bg-red-50    border-red-200',
  pr:               'text-pink-600   bg-pink-50   border-pink-200',
  content_creation: 'text-purple-600 bg-purple-50 border-purple-200',
  advertising:      'text-orange-600 bg-orange-50 border-orange-200',
  media_production: 'text-teal-600   bg-teal-50   border-teal-200',
  filmmaking:       'text-indigo-600 bg-indigo-50 border-indigo-200',
  other:            'text-gray-600   bg-gray-100  border-gray-200',
}

function FieldBadge({ field }) {
  const meta = FIELDS.find(f => f.id === field) || FIELDS[FIELDS.length - 1]
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${FIELD_COLORS[field] || FIELD_COLORS.other}`}>
      {meta.label}
    </span>
  )
}

function TypeBadge({ type }) {
  const meta = OPP_TYPES.find(t => t.id === type) || OPP_TYPES[0]
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${meta.color}`}>
      {meta.label}
    </span>
  )
}

function AlumniAvatar({ name, src, size = 12 }) {
  const px = size * 4
  if (src) return <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: px, height: px }} />
  return (
    <div className="rounded-full flex-shrink-0 bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center text-white font-bold"
      style={{ width: px, height: px, fontSize: size > 10 ? 16 : 12 }}>
      {name?.charAt(0)?.toUpperCase()}
    </div>
  )
}

// ── Mentorship modal ──────────────────────────────────────────────────────────
function MentorshipModal({ profile, onClose }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    setSending(true)
    try {
      await axios.post(`/api/alumni/profiles/${profile._id}/mentorship`, { message })
      toast.success('Mentorship request sent!')
      onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-3 pb-3 sm:pb-0">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlumniAvatar name={profile.fullName} src={profile.avatar} size={10} />
            <div>
              <p className="text-gray-800 font-bold text-sm">{profile.fullName}</p>
              <p className="text-gray-500 text-xs">{profile.currentRole || ''}{profile.currentCompany ? ` · ${profile.currentCompany}` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <p className="text-gray-600 text-sm mb-3">Send a mentorship request to {profile.fullName?.split(' ')[0]}. They'll receive a notification.</p>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
          placeholder="Introduce yourself and explain what you'd like to learn or discuss..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 text-sm focus:outline-none focus:border-[#1a3c5e]/40 resize-none mb-3" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-semibold text-sm rounded-xl">Cancel</button>
          <button onClick={send} disabled={sending || !message.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition">
            {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Send Request
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Profile form ──────────────────────────────────────────────────────────────
function ProfileForm({ existing, onSaved, onCancel }) {
  const [form, setForm] = useState({
    fullName: existing?.fullName || '',
    graduationYear: existing?.graduationYear || new Date().getFullYear() - 1,
    field: existing?.field || 'journalism',
    currentRole: existing?.currentRole || '',
    currentCompany: existing?.currentCompany || '',
    location: existing?.location || '',
    bio: existing?.bio || '',
    achievements: existing?.achievements?.length ? existing.achievements : [''],
    openToMentorship: existing?.openToMentorship ?? false,
    contact: existing?.contact || { email: '', whatsapp: '', linkedin: '', twitter: '', instagram: '' },
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(existing?.avatar || '')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setC = (k, v) => setForm(f => ({ ...f, contact: { ...f.contact, [k]: v } }))

  const save = async () => {
    if (!form.fullName.trim()) return toast.error('Full name required.')
    if (!form.graduationYear) return toast.error('Graduation year required.')
    setSaving(true)
    try {
      const fd = new FormData()
      const body = { ...form, achievements: form.achievements.filter(a => a.trim()) }
      fd.append('data', JSON.stringify(body))
      if (avatarFile) fd.append('avatar', avatarFile)

      const { data } = existing
        ? await axios.put(`/api/alumni/profiles/${existing._id}`, fd)
        : await axios.post('/api/alumni/profiles', fd)

      toast.success(existing ? 'Profile updated!' : (data.autoApproved ? 'Profile live!' : 'Profile submitted for approval!'))
      onSaved(data.profile)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1a3c5e]/40'

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-[#1a3c5e] transition"><ArrowLeft size={18} /></button>
        <h2 className="text-[#1a3c5e] font-black text-lg">{existing ? 'Edit Profile' : 'Create Alumni Profile'}</h2>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        {avatarPreview
          ? <img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
          : <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center text-white text-2xl font-bold">
              {form.fullName?.charAt(0) || '?'}
            </div>
        }
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
            const f = e.target.files?.[0]; if (!f) return
            setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); e.target.value = ''
          }} />
          <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition">
            {avatarPreview ? 'Change Photo' : 'Upload Photo'}
          </button>
          {avatarPreview && <button onClick={() => { setAvatarFile(null); setAvatarPreview('') }} className="ml-2 text-xs text-red-500 hover:underline">Remove</button>}
        </div>
      </div>

      {/* Basic info */}
      <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-gray-600 font-bold text-xs uppercase tracking-wider">Basic Info</h3>
        <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Full Name *</label><input value={form.fullName} onChange={e => setF('fullName', e.target.value)} style={{ fontSize: 16 }} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Graduation Year *</label>
            <input type="number" min={1980} max={new Date().getFullYear()} value={form.graduationYear} onChange={e => setF('graduationYear', e.target.value)} style={{ fontSize: 16 }} className={inputCls} />
          </div>
          <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Field</label>
            <select value={form.field} onChange={e => setF('field', e.target.value)} style={{ fontSize: 16 }} className={inputCls}>
              {FIELDS.filter(f => f.id !== 'all').map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Current Role</label><input value={form.currentRole} onChange={e => setF('currentRole', e.target.value)} placeholder="e.g. Senior Reporter" style={{ fontSize: 16 }} className={inputCls} /></div>
          <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Company / Organisation</label><input value={form.currentCompany} onChange={e => setF('currentCompany', e.target.value)} placeholder="e.g. NTA" style={{ fontSize: 16 }} className={inputCls} /></div>
        </div>
        <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Location</label><input value={form.location} onChange={e => setF('location', e.target.value)} placeholder="e.g. Lagos, Nigeria" style={{ fontSize: 16 }} className={inputCls} /></div>
        <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Bio</label><textarea value={form.bio} onChange={e => setF('bio', e.target.value)} rows={3} placeholder="Tell students about your journey..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-[#1a3c5e]/40 resize-none" /></div>
      </div>

      {/* Achievements */}
      <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-gray-600 font-bold text-xs uppercase tracking-wider">Notable Achievements</h3>
        {form.achievements.map((a, i) => (
          <div key={i} className="flex gap-2">
            <input value={a} onChange={e => setF('achievements', form.achievements.map((x, j) => j === i ? e.target.value : x))}
              placeholder={`Achievement ${i + 1}`} style={{ fontSize: 16 }}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            {form.achievements.length > 1 && <button onClick={() => setF('achievements', form.achievements.filter((_, j) => j !== i))} className="p-2 text-gray-400 hover:text-red-500"><X size={13} /></button>}
          </div>
        ))}
        <button onClick={() => setF('achievements', [...form.achievements, ''])} className="text-xs text-[#1a3c5e] flex items-center gap-1"><Plus size={11} /> Add achievement</button>
      </div>

      {/* Contact */}
      <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-gray-600 font-bold text-xs uppercase tracking-wider">Contact Info <span className="text-gray-400 font-normal normal-case">(visible to members)</span></h3>
        <div className="grid grid-cols-2 gap-3">
          {[['email','Email'],['whatsapp','WhatsApp'],['linkedin','LinkedIn URL'],['twitter','Twitter / X'],['instagram','Instagram']].map(([k, l]) => (
            <div key={k}><label className="text-gray-500 text-xs font-semibold mb-1 block">{l}</label>
              <input value={form.contact[k] || ''} onChange={e => setC(k, e.target.value)} style={{ fontSize: 16 }} className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      {/* Mentorship toggle */}
      <div className="rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-gray-800 font-bold text-sm">Open to Mentorship</p>
          <p className="text-gray-500 text-xs mt-0.5">Students will be able to send you mentorship requests</p>
        </div>
        <div onClick={() => setF('openToMentorship', !form.openToMentorship)}
          className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${form.openToMentorship ? 'bg-[#1a3c5e]' : 'bg-gray-300'}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.openToMentorship ? 'left-6' : 'left-1'}`} />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition">Cancel</button>
        <button onClick={save} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold rounded-xl disabled:opacity-50 transition">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {existing ? 'Save Changes' : 'Submit Profile'}
        </button>
      </div>
    </div>
  )
}

// ── Opportunity form ──────────────────────────────────────────────────────────
function OpportunityForm({ existing, onSaved, onCancel }) {
  const [form, setForm] = useState({
    type: existing?.type || 'job',
    title: existing?.title || '',
    company: existing?.company || '',
    description: existing?.description || '',
    requirements: existing?.requirements?.length ? existing.requirements : [''],
    locationType: existing?.locationType || 'onsite',
    city: existing?.city || '',
    deadline: existing?.deadline ? existing.deadline.slice(0, 10) : '',
    applyLink: existing?.applyLink || '',
    applyEmail: existing?.applyEmail || '',
  })
  const [saving, setSaving] = useState(false)
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.title.trim() || !form.description.trim()) return toast.error('Title and description required.')
    if (!form.applyLink.trim() && !form.applyEmail.trim()) return toast.error('Provide at least an apply link or email.')
    setSaving(true)
    try {
      const body = { ...form, requirements: form.requirements.filter(r => r.trim()) }
      const { data } = existing
        ? await axios.put(`/api/alumni/opportunities/${existing._id}`, body)
        : await axios.post('/api/alumni/opportunities', body)
      toast.success(existing ? 'Updated!' : 'Opportunity posted!')
      onSaved(data.opportunity)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1a3c5e]/40'

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-[#1a3c5e] transition"><ArrowLeft size={18} /></button>
        <h2 className="text-[#1a3c5e] font-black text-lg">{existing ? 'Edit Opportunity' : 'Post an Opportunity'}</h2>
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-gray-600 font-bold text-xs uppercase tracking-wider">Details</h3>

        <div>
          <label className="text-gray-500 text-xs font-semibold mb-2 block">Type</label>
          <div className="flex gap-2 flex-wrap">
            {OPP_TYPES.filter(t => t.id !== 'all').map(t => (
              <button key={t.id} onClick={() => setF('type', t.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition ${form.type === t.id ? 'bg-[#1a3c5e] text-white border-[#1a3c5e]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Job Title *</label><input value={form.title} onChange={e => setF('title', e.target.value)} placeholder="e.g. Digital Content Writer" style={{ fontSize: 16 }} className={inputCls} /></div>
        <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Company / Organisation</label><input value={form.company} onChange={e => setF('company', e.target.value)} placeholder="e.g. Channels TV" style={{ fontSize: 16 }} className={inputCls} /></div>
        <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Description *</label><textarea value={form.description} onChange={e => setF('description', e.target.value)} rows={5} placeholder="Describe the role, responsibilities, what you're looking for..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-[#1a3c5e]/40 resize-none" /></div>

        <div>
          <label className="text-gray-500 text-xs font-semibold mb-2 block">Requirements</label>
          {form.requirements.map((r, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input value={r} onChange={e => setF('requirements', form.requirements.map((x, j) => j === i ? e.target.value : x))}
                placeholder={`Requirement ${i + 1}`} style={{ fontSize: 16 }}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              {form.requirements.length > 1 && <button onClick={() => setF('requirements', form.requirements.filter((_, j) => j !== i))} className="p-2 text-gray-400 hover:text-red-500"><X size={13} /></button>}
            </div>
          ))}
          <button onClick={() => setF('requirements', [...form.requirements, ''])} className="text-xs text-[#1a3c5e] flex items-center gap-1"><Plus size={11} /> Add requirement</button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-gray-600 font-bold text-xs uppercase tracking-wider">Location & Deadline</h3>
        <div className="grid grid-cols-3 gap-2">
          {['remote', 'onsite', 'hybrid'].map(l => (
            <button key={l} onClick={() => setF('locationType', l)}
              className={`py-2 text-xs font-bold rounded-xl border capitalize transition ${form.locationType === l ? 'bg-[#1a3c5e] text-white border-[#1a3c5e]' : 'bg-white text-gray-600 border-gray-200'}`}>{l}</button>
          ))}
        </div>
        {form.locationType !== 'remote' && (
          <div><label className="text-gray-500 text-xs font-semibold mb-1 block">City</label><input value={form.city} onChange={e => setF('city', e.target.value)} placeholder="e.g. Abuja" style={{ fontSize: 16 }} className={inputCls} /></div>
        )}
        <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Application Deadline</label><input type="date" value={form.deadline} onChange={e => setF('deadline', e.target.value)} style={{ fontSize: 16 }} className={inputCls} /></div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-gray-600 font-bold text-xs uppercase tracking-wider">How to Apply *</h3>
        <p className="text-gray-500 text-xs">Provide at least one of the following:</p>
        <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Application Link</label><input value={form.applyLink} onChange={e => setF('applyLink', e.target.value)} placeholder="https://..." style={{ fontSize: 16 }} className={inputCls} /></div>
        <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Email to Apply</label><input value={form.applyEmail} onChange={e => setF('applyEmail', e.target.value)} placeholder="hr@company.com" style={{ fontSize: 16 }} className={inputCls} /></div>
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl">Cancel</button>
        <button onClick={save} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold rounded-xl disabled:opacity-50 transition">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Briefcase size={14} />}
          {existing ? 'Save Changes' : 'Post Opportunity'}
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Alumni() {
  const { user } = useAuth()
  const isAdmin = user?.isStaffAdmin || user?.isStudentAdmin || user?.accountType === 'staff'

  const [tab, setTab]               = useState('directory')
  const [profiles, setProfiles]     = useState([])
  const [opps, setOpps]             = useState([])
  const [myProfile, setMyProfile]   = useState(null)
  const [myOpps, setMyOpps]         = useState([])
  const [pending, setPending]       = useState({ profiles: [], opportunities: [] })
  const [loading, setLoading]       = useState(true)
  const [oppsLoading, setOppsLoading] = useState(false)

  // Directory filters
  const [search, setSearch]         = useState('')
  const [fieldFilter, setField]     = useState('all')
  const [mentorOnly, setMentorOnly] = useState(false)

  // Opportunities filter
  const [oppType, setOppType]       = useState('all')
  const [oppSearch, setOppSearch]   = useState('')

  // UI state
  const [editingProfile, setEditingProfile]   = useState(false)
  const [postingOpp, setPostingOpp]           = useState(false)
  const [editingOpp, setEditingOpp]           = useState(null)
  const [mentorProfile, setMentorProfile]     = useState(null)
  const [expandedOpp, setExpandedOpp]         = useState(null)

  // Load directory
  useEffect(() => {
    if (tab !== 'directory') return
    setLoading(true)
    const params = new URLSearchParams()
    if (fieldFilter !== 'all') params.set('field', fieldFilter)
    if (mentorOnly) params.set('mentorship', 'true')
    if (search) params.set('search', search)
    axios.get(`/api/alumni/profiles?${params}`)
      .then(r => setProfiles(r.data.profiles || []))
      .catch(() => toast.error('Failed to load alumni.'))
      .finally(() => setLoading(false))
  }, [tab, fieldFilter, mentorOnly, search])

  // Load opportunities
  useEffect(() => {
    if (tab !== 'opportunities') return
    setOppsLoading(true)
    const params = new URLSearchParams()
    if (oppType !== 'all') params.set('type', oppType)
    if (oppSearch) params.set('search', oppSearch)
    axios.get(`/api/alumni/opportunities?${params}`)
      .then(r => setOpps(r.data.opportunities || []))
      .catch(() => toast.error('Failed to load opportunities.'))
      .finally(() => setOppsLoading(false))
  }, [tab, oppType, oppSearch])

  // Load my profile
  useEffect(() => {
    if (tab !== 'my-profile') return
    axios.get('/api/alumni/profiles/mine')
      .then(r => { setMyProfile(r.data.profile); setMyOpps(r.data.opportunities || []) })
      .catch(() => {})
  }, [tab])

  // Load pending (admin)
  useEffect(() => {
    if (tab !== 'pending' || !isAdmin) return
    axios.get('/api/alumni/admin/pending')
      .then(r => setPending(r.data))
      .catch(() => {})
  }, [tab])

  const approveProfile = async (id, status) => {
    await axios.put(`/api/alumni/profiles/${id}`, { data: JSON.stringify({ status }) })
    setPending(p => ({ ...p, profiles: p.profiles.filter(x => x._id !== id) }))
    toast.success(status === 'approved' ? 'Profile approved!' : 'Profile rejected.')
  }

  const approveOpp = async (id, approved) => {
    await axios.put(`/api/alumni/opportunities/${id}`, { approved })
    setPending(p => ({ ...p, opportunities: p.opportunities.filter(x => x._id !== id) }))
    toast.success(approved ? 'Opportunity approved!' : 'Opportunity rejected.')
  }

  const deleteOpp = async (id) => {
    if (!window.confirm('Delete this opportunity?')) return
    await axios.delete(`/api/alumni/opportunities/${id}`)
    setMyOpps(p => p.filter(o => o._id !== id))
    toast.success('Deleted.')
  }

  const pendingCount = pending.profiles.length + pending.opportunities.length

  const tabs = [
    { id: 'directory',     label: 'Directory',    icon: Users },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'my-profile',   label: 'My Profile',   icon: User },
    ...(isAdmin ? [{ id: 'pending', label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: AlertCircle }] : []),
  ]

  // ── Sub-views (forms) ─────────────────────────────────────────────────────
  if (editingProfile) return (
    <ProfileForm
      existing={myProfile}
      onSaved={p => { setMyProfile(p); setEditingProfile(false) }}
      onCancel={() => setEditingProfile(false)}
    />
  )
  if (postingOpp) return (
    <OpportunityForm
      onSaved={o => { setMyOpps(p => [o, ...p.filter(x => x._id !== o._id)]); setPostingOpp(false) }}
      onCancel={() => setPostingOpp(false)}
    />
  )
  if (editingOpp) return (
    <OpportunityForm
      existing={editingOpp}
      onSaved={o => { setMyOpps(p => p.map(x => x._id === o._id ? o : x)); setEditingOpp(null) }}
      onCancel={() => setEditingOpp(null)}
    />
  )

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {mentorProfile && <MentorshipModal profile={mentorProfile} onClose={() => setMentorProfile(null)} />}

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[#1a3c5e] font-black text-xl">Alumni Network</h1>
        <p className="text-gray-500 text-sm mt-0.5">Connect with AMACOS graduates, find opportunities, get mentored</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition -mb-px whitespace-nowrap ${tab === t.id ? 'border-[#1a3c5e] text-[#1a3c5e]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Directory ── */}
      {tab === 'directory' && (
        <div className="space-y-4">
          {/* Search + filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, role, or company…"
                style={{ fontSize: 16 }} className="flex-1 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-sm" />
              {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-400" /></button>}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {FIELDS.map(f => (
                <button key={f.id} onClick={() => setField(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${fieldFilter === f.id ? 'bg-[#1a3c5e] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => setMentorOnly(m => !m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${mentorOnly ? 'bg-[#1a3c5e] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              <BookOpen size={11} /> Mentors only
            </button>
          </div>

          {loading
            ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-[#1a3c5e]" /></div>
            : profiles.length === 0
              ? <div className="text-center py-20"><Users size={32} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-semibold">No alumni found</p></div>
              : <div className="grid sm:grid-cols-2 gap-4">
                  {profiles.map(p => (
                    <div key={p._id} className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-[#1a3c5e]/30 hover:shadow-sm transition">
                      <div className="flex items-start gap-3">
                        <AlumniAvatar name={p.fullName} src={p.avatar} size={12} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <p className="text-gray-800 font-bold text-sm">{p.fullName}</p>
                            {p.openToMentorship && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded-full">Mentor</span>}
                          </div>
                          <p className="text-gray-500 text-xs truncate">{p.currentRole}{p.currentCompany ? ` · ${p.currentCompany}` : ''}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <FieldBadge field={p.field} />
                            <span className="text-gray-400 text-[10px]">Class of {p.graduationYear}</span>
                            {p.location && <span className="text-gray-400 text-[10px] flex items-center gap-0.5"><MapPin size={9} /> {p.location}</span>}
                          </div>
                        </div>
                      </div>

                      {p.bio && <p className="text-gray-500 text-xs mt-3 line-clamp-2">{p.bio}</p>}

                      {p.achievements?.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {p.achievements.slice(0, 2).map((a, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <Star size={10} className="text-amber-400 mt-0.5 flex-shrink-0" />
                              <p className="text-gray-600 text-xs">{a}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Contact + Mentorship actions */}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                        {p.contact?.email && <a href={`mailto:${p.contact.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Mail size={11} /> Email</a>}
                        {p.contact?.whatsapp && <a href={`https://wa.me/${p.contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-green-600 hover:underline"><Phone size={11} /> WhatsApp</a>}
                        {p.contact?.linkedin && <a href={p.contact.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline"><Linkedin size={11} /> LinkedIn</a>}
                        {p.contact?.twitter && <a href={`https://twitter.com/${p.contact.twitter.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-sky-500 hover:underline"><ExternalLink size={11} /> Twitter</a>}
                        {p.openToMentorship && p.user && p.user.toString() !== user?._id && (
                          <button onClick={() => setMentorProfile(p)}
                            className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-[#1a3c5e]/8 text-[#1a3c5e] text-xs font-bold rounded-full hover:bg-[#1a3c5e]/15 transition">
                            <BookOpen size={10} /> Request Mentorship
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
          }
        </div>
      )}

      {/* ── Opportunities ── */}
      {tab === 'opportunities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {OPP_TYPES.map(t => (
                <button key={t.id} onClick={() => setOppType(t.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${oppType === t.id ? 'bg-[#1a3c5e] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input value={oppSearch} onChange={e => setOppSearch(e.target.value)} placeholder="Search opportunities…"
              style={{ fontSize: 16 }} className="flex-1 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-sm" />
            {oppSearch && <button onClick={() => setOppSearch('')}><X size={13} className="text-gray-400" /></button>}
          </div>

          {oppsLoading
            ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-[#1a3c5e]" /></div>
            : opps.length === 0
              ? <div className="text-center py-20"><Briefcase size={32} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-semibold">No opportunities yet</p><p className="text-gray-400 text-sm mt-1">Check your alumni profile tab to post one</p></div>
              : <div className="space-y-3">
                  {opps.map(o => {
                    const open = expandedOpp === o._id
                    const expired = o.deadline && new Date(o.deadline) < new Date()
                    return (
                      <div key={o._id} className={`bg-white rounded-2xl border transition ${expired ? 'border-gray-200 opacity-75' : 'border-gray-200 hover:border-[#1a3c5e]/30 hover:shadow-sm'}`}>
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <TypeBadge type={o.type} />
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${o.locationType === 'remote' ? 'bg-green-50 text-green-600' : o.locationType === 'hybrid' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                  {o.locationType}{o.city && o.locationType !== 'remote' ? ` · ${o.city}` : ''}
                                </span>
                                {expired && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Expired</span>}
                              </div>
                              <p className="text-gray-800 font-bold">{o.title}</p>
                              <p className="text-gray-500 text-xs mt-0.5">{o.company || (o.alumniProfile?.currentCompany) || ''}</p>
                            </div>
                            <button onClick={() => setExpandedOpp(open ? null : o._id)} className="p-1.5 text-gray-400 flex-shrink-0">
                              {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                          </div>

                          <div className="flex items-center gap-3 mt-2 text-gray-400 text-xs flex-wrap">
                            {o.deadline && <span className="flex items-center gap-1"><Calendar size={10} /> {expired ? 'Closed' : `Deadline: ${new Date(o.deadline).toLocaleDateString()}`}</span>}
                            {o.alumniProfile && <span className="flex items-center gap-1"><User size={10} /> Posted by {o.alumniProfile.fullName}</span>}
                          </div>

                          {!open && <p className="text-gray-500 text-sm mt-2 line-clamp-2">{o.description}</p>}

                          {open && (
                            <div className="mt-3 space-y-3">
                              <p className="text-gray-600 text-sm whitespace-pre-wrap">{o.description}</p>
                              {o.requirements?.length > 0 && (
                                <div>
                                  <p className="text-gray-700 font-bold text-xs mb-1.5">Requirements</p>
                                  <div className="space-y-1">
                                    {o.requirements.map((r, i) => (
                                      <div key={i} className="flex items-start gap-2"><CheckCircle2 size={11} className="text-[#1a3c5e] mt-0.5 flex-shrink-0" /><p className="text-gray-600 text-sm">{r}</p></div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="pt-2 flex gap-2 flex-wrap">
                                {o.applyLink && <a href={o.applyLink} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white text-xs font-bold rounded-xl transition">
                                  <ExternalLink size={12} /> Apply Now
                                </a>}
                                {o.applyEmail && <a href={`mailto:${o.applyEmail}`}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition">
                                  <Mail size={12} /> {o.applyEmail}
                                </a>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
          }
        </div>
      )}

      {/* ── My Profile ── */}
      {tab === 'my-profile' && (
        <div className="space-y-5">
          {myProfile ? (
            <>
              {myProfile.status === 'pending' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center gap-2">
                  <AlertCircle size={14} className="text-yellow-600" />
                  <p className="text-yellow-700 text-sm font-semibold">Your profile is pending admin approval.</p>
                </div>
              )}

              {/* Profile card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-start gap-4">
                  <AlumniAvatar name={myProfile.fullName} src={myProfile.avatar} size={14} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-gray-800 font-bold">{myProfile.fullName}</p>
                        <p className="text-gray-500 text-sm">{myProfile.currentRole}{myProfile.currentCompany ? ` · ${myProfile.currentCompany}` : ''}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <FieldBadge field={myProfile.field} />
                          <span className="text-gray-400 text-xs">Class of {myProfile.graduationYear}</span>
                          {myProfile.openToMentorship && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><BookOpen size={10} /> Open to mentorship</span>}
                        </div>
                      </div>
                      <button onClick={() => setEditingProfile(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition flex-shrink-0">
                        <Edit2 size={11} /> Edit
                      </button>
                    </div>
                    {myProfile.bio && <p className="text-gray-600 text-sm mt-3">{myProfile.bio}</p>}
                    {myProfile.location && <p className="text-gray-400 text-xs mt-1 flex items-center gap-1"><MapPin size={10} /> {myProfile.location}</p>}
                  </div>
                </div>

                {myProfile.achievements?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-gray-600 font-bold text-xs mb-2 uppercase tracking-wider">Achievements</p>
                    <div className="space-y-1">
                      {myProfile.achievements.map((a, i) => (
                        <div key={i} className="flex items-start gap-2"><Star size={11} className="text-amber-400 mt-0.5 flex-shrink-0" /><p className="text-gray-600 text-sm">{a}</p></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* My Opportunities */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-700 font-bold">My Posted Opportunities</p>
                  <button onClick={() => setPostingOpp(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3c5e] text-white text-xs font-bold rounded-xl hover:bg-[#1a3c5e]/80 transition">
                    <Plus size={12} /> Post Opportunity
                  </button>
                </div>
                {myOpps.length === 0
                  ? <div className="text-center py-10 bg-white rounded-2xl border border-gray-200"><Briefcase size={24} className="text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">No opportunities posted yet</p></div>
                  : <div className="space-y-3">
                      {myOpps.map(o => (
                        <div key={o._id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <TypeBadge type={o.type} />
                              {!o.approved && <span className="text-[10px] text-yellow-600 font-bold">Pending approval</span>}
                              {o.status === 'closed' && <span className="text-[10px] text-gray-500 font-bold">Closed</span>}
                            </div>
                            <p className="text-gray-800 font-bold text-sm">{o.title}</p>
                            <p className="text-gray-500 text-xs">{o.company}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => setEditingOpp(o)} className="p-1.5 text-gray-400 hover:text-[#1a3c5e] transition"><Edit2 size={13} /></button>
                            <button onClick={() => deleteOpp(o._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition"><Trash2 size={13} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#1a3c5e]/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User size={28} className="text-[#1a3c5e]" />
              </div>
              <h2 className="text-[#1a3c5e] font-bold text-lg mb-2">Create Your Alumni Profile</h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                {user?.isAlumni
                  ? 'Add yourself to the alumni directory so current students can connect with you.'
                  : 'Are you an AMACOS graduate? Create your profile to appear in the alumni directory. An admin will verify and approve it.'}
              </p>
              <button onClick={() => setEditingProfile(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold rounded-xl transition">
                <Plus size={15} /> Create Profile
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Admin Pending ── */}
      {tab === 'pending' && isAdmin && (
        <div className="space-y-6">
          {/* Pending profiles */}
          <div>
            <p className="text-gray-700 font-bold mb-3">Pending Profiles ({pending.profiles.length})</p>
            {pending.profiles.length === 0
              ? <div className="text-center py-8 bg-white rounded-2xl border border-gray-200"><CheckCircle2 size={22} className="text-green-400 mx-auto mb-2" /><p className="text-gray-500 text-sm">All clear</p></div>
              : <div className="space-y-3">
                  {pending.profiles.map(p => (
                    <div key={p._id} className="bg-white rounded-2xl border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        <AlumniAvatar name={p.fullName} src={p.avatar} size={10} />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 font-bold text-sm">{p.fullName}</p>
                          <p className="text-gray-500 text-xs">{p.currentRole} · Class of {p.graduationYear}</p>
                          <FieldBadge field={p.field} />
                        </div>
                      </div>
                      {p.bio && <p className="text-gray-500 text-sm mt-2 line-clamp-2">{p.bio}</p>}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => approveProfile(p._id, 'approved')}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 hover:bg-green-400 text-white text-xs font-bold rounded-xl transition">
                          <Check size={12} /> Approve
                        </button>
                        <button onClick={() => approveProfile(p._id, 'rejected')}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-xl transition">
                          <X size={12} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* Pending opportunities */}
          <div>
            <p className="text-gray-700 font-bold mb-3">Pending Opportunities ({pending.opportunities.length})</p>
            {pending.opportunities.length === 0
              ? <div className="text-center py-8 bg-white rounded-2xl border border-gray-200"><CheckCircle2 size={22} className="text-green-400 mx-auto mb-2" /><p className="text-gray-500 text-sm">All clear</p></div>
              : <div className="space-y-3">
                  {pending.opportunities.map(o => (
                    <div key={o._id} className="bg-white rounded-2xl border border-gray-200 p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1"><TypeBadge type={o.type} /></div>
                          <p className="text-gray-800 font-bold text-sm">{o.title}</p>
                          <p className="text-gray-500 text-xs">{o.company} · Posted by {o.postedBy?.fullName}</p>
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-3">{o.description}</p>
                      <div className="flex gap-2">
                        <button onClick={() => approveOpp(o._id, true)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 hover:bg-green-400 text-white text-xs font-bold rounded-xl transition">
                          <Check size={12} /> Approve
                        </button>
                        <button onClick={() => approveOpp(o._id, false)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-xl transition">
                          <X size={12} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      )}
    </div>
  )
}
