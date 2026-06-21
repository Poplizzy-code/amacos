import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  Briefcase, User, Plus, Search, Loader2, X, Check,
  ChevronDown, ChevronUp, ExternalLink, Mail, Phone,
  MapPin, Calendar, Edit2, Save, Trash2, ArrowLeft, Send,
  BookOpen, Star, CheckCircle2, AlertCircle, GraduationCap,
} from 'lucide-react'

const FIELDS = [
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
  { id: 'all',        label: 'All'        },
  { id: 'job',        label: 'Job'        },
  { id: 'internship', label: 'Internship' },
  { id: 'freelance',  label: 'Freelance'  },
  { id: 'volunteer',  label: 'Volunteer'  },
]

const TYPE_COLORS = {
  job:        'text-blue-600   bg-blue-50',
  internship: 'text-green-600  bg-green-50',
  freelance:  'text-purple-600 bg-purple-50',
  volunteer:  'text-amber-600  bg-amber-50',
}

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
  const meta = FIELDS.find(f => f.id === field)
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${FIELD_COLORS[field] || FIELD_COLORS.other}`}>
      {meta?.label || field}
    </span>
  )
}

function Avatar({ name, src, size = 12 }) {
  const px = size * 4
  if (src) return <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: px, height: px }} />
  return (
    <div className="rounded-full flex-shrink-0 bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center text-white font-bold"
      style={{ width: px, height: px, fontSize: size > 10 ? 16 : 12 }}>
      {name?.charAt(0)?.toUpperCase()}
    </div>
  )
}

// ── Undergrad gate ────────────────────────────────────────────────────────────
function UndergradGate() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center select-none">
      <div className="text-7xl mb-5">😂</div>
      <div className="bg-white rounded-3xl border-2 border-dashed border-amber-300 px-8 py-8 max-w-sm shadow-sm">
        <p className="text-2xl font-black text-[#1a3c5e] mb-2">Oga, not yet!</p>
        <p className="text-gray-600 text-sm leading-relaxed">
          This section is strictly for <span className="font-bold text-amber-500">AMACOS Alumni</span> —
          the ones who have already survived Mass Comm. 🎓
        </p>
        <div className="mt-4 py-3 px-4 bg-amber-50 rounded-2xl border border-amber-200">
          <p className="text-amber-700 text-sm font-semibold">
            You're still an undergraduate. 📚
          </p>
          <p className="text-amber-600 text-xs mt-1">
            Close this tab, open your textbooks, and come back when you've collected your certificate. We'll be waiting. 😅
          </p>
        </div>
        <p className="text-gray-400 text-xs mt-4 italic">
          "Face your studies first, dear." — every alumni ever
        </p>
      </div>
    </div>
  )
}

// ── Profile detail view ───────────────────────────────────────────────────────
function ProfileDetail({ profileId, currentUserId, onBack, onMentorship }) {
  const [profile, setProfile]   = useState(null)
  const [opps, setOpps]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [expandedOpp, setExpOpp] = useState(null)

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/alumni/profiles/${profileId}`)
      .then(r => { setProfile(r.data.profile); setOpps(r.data.opportunities || []) })
      .catch(() => toast.error('Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [profileId])

  if (loading) return <div className="flex justify-center py-24"><Loader2 size={22} className="animate-spin text-[#1a3c5e]" /></div>
  if (!profile) return (
    <div className="text-center py-16">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[#1a3c5e] text-sm font-semibold mb-6"><ArrowLeft size={14} /> Back</button>
      <p className="text-gray-500">Profile not found.</p>
    </div>
  )

  const isOwnProfile = profile.user?._id?.toString() === currentUserId || profile.user?.toString() === currentUserId

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[#1a3c5e] text-sm font-semibold mb-5 hover:opacity-70 transition">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <div className="flex items-start gap-4">
          <Avatar name={profile.fullName} src={profile.avatar} size={16} />
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 font-black text-lg leading-tight">{profile.fullName}</p>
            {(profile.currentRole || profile.currentCompany) && (
              <p className="text-gray-500 text-sm mt-0.5">{[profile.currentRole, profile.currentCompany].filter(Boolean).join(' · ')}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <FieldBadge field={profile.field} />
              <span className="text-gray-400 text-xs flex items-center gap-1"><GraduationCap size={11} /> Class of {profile.graduationYear}</span>
              {profile.openToMentorship && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><BookOpen size={10} /> Open to mentorship</span>}
            </div>
            {profile.location && <p className="text-gray-400 text-xs mt-1.5 flex items-center gap-1"><MapPin size={10} /> {profile.location}</p>}
          </div>
        </div>

        {profile.bio && <p className="text-gray-600 text-sm mt-4 leading-relaxed">{profile.bio}</p>}

        {profile.achievements?.filter(Boolean).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Achievements</p>
            {profile.achievements.filter(Boolean).map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <Star size={11} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600 text-sm">{a}</p>
              </div>
            ))}
          </div>
        )}

        {/* Contact */}
        {Object.values(profile.contact || {}).some(Boolean) && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
            {profile.contact?.email && <a href={`mailto:${profile.contact.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Mail size={11} /> Email</a>}
            {profile.contact?.whatsapp && <a href={`https://wa.me/${profile.contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-green-600 hover:underline"><Phone size={11} /> WhatsApp</a>}
            {profile.contact?.linkedin && <a href={profile.contact.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline"><ExternalLink size={11} /> LinkedIn</a>}
            {profile.contact?.twitter && <a href={`https://twitter.com/${profile.contact.twitter.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-sky-500 hover:underline"><ExternalLink size={11} /> Twitter</a>}
            {profile.contact?.instagram && <a href={`https://instagram.com/${profile.contact.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-pink-500 hover:underline"><ExternalLink size={11} /> Instagram</a>}
          </div>
        )}

        {/* Mentorship CTA */}
        {profile.openToMentorship && !isOwnProfile && (
          <button onClick={() => onMentorship(profile)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#1a3c5e]/10 hover:bg-[#1a3c5e]/20 text-[#1a3c5e] font-bold text-sm rounded-xl transition">
            <BookOpen size={14} /> Request Mentorship
          </button>
        )}
      </div>

      {/* Their opportunities */}
      {opps.length > 0 && (
        <div>
          <p className="text-gray-600 font-bold text-sm mb-3 px-1">Opportunities from {profile.fullName?.split(' ')[0]}</p>
          {opps.map(o => {
            const open = expandedOpp === o._id
            const expired = o.deadline && new Date(o.deadline) < new Date()
            return (
              <div key={o._id} className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[o.type] || ''}`}>{o.type}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${o.locationType === 'remote' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{o.locationType}</span>
                      {expired && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Expired</span>}
                    </div>
                    <p className="text-gray-800 font-bold text-sm">{o.title}</p>
                    {o.company && <p className="text-gray-500 text-xs">{o.company}</p>}
                    {o.deadline && <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1"><Calendar size={10} /> {expired ? 'Closed' : `Deadline: ${new Date(o.deadline).toLocaleDateString()}`}</p>}
                  </div>
                  <button onClick={() => setExpOpp(open ? null : o._id)} className="p-1.5 text-gray-400">
                    {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
                {open && (
                  <div className="mt-3 space-y-3">
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{o.description}</p>
                    <div className="flex gap-2 flex-wrap pt-1">
                      {o.applyLink && <a href={o.applyLink} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#1a3c5e] text-white text-xs font-bold rounded-xl">
                        <ExternalLink size={12} /> Apply Now
                      </a>}
                      {o.applyEmail && <a href={`mailto:${o.applyEmail}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl">
                        <Mail size={12} /> {o.applyEmail}
                      </a>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
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
            <Avatar name={profile.fullName} src={profile.avatar} size={10} />
            <div>
              <p className="text-gray-800 font-bold text-sm">{profile.fullName}</p>
              <p className="text-gray-500 text-xs">{[profile.currentRole, profile.currentCompany].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
          placeholder="Introduce yourself and what you'd like to learn..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 text-sm focus:outline-none resize-none mb-3" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-semibold text-sm rounded-xl">Cancel</button>
          <button onClick={send} disabled={sending || !message.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition">
            {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Send
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Profile edit form ─────────────────────────────────────────────────────────
function ProfileForm({ profile, userAvatar, onSaved, onCancel }) {
  const [form, setForm] = useState({
    graduationYear: profile?.graduationYear || new Date().getFullYear(),
    field:          profile?.field || 'journalism',
    currentRole:    profile?.currentRole || '',
    currentCompany: profile?.currentCompany || '',
    location:       profile?.location || '',
    bio:            profile?.bio || '',
    achievements:   profile?.achievements?.length ? profile.achievements : [''],
    openToMentorship: profile?.openToMentorship ?? false,
    contact: profile?.contact || { email: '', whatsapp: '', linkedin: '', twitter: '', instagram: '' },
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || userAvatar || '')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setC = (k, v) => setForm(f => ({ ...f, contact: { ...f.contact, [k]: v } }))

  const save = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      const body = { ...form, achievements: form.achievements.filter(a => a.trim()) }
      fd.append('data', JSON.stringify(body))
      if (avatarFile) fd.append('avatar', avatarFile)
      const { data } = await axios.put(`/api/alumni/profiles/${profile._id}`, fd)
      toast.success('Profile updated!')
      onSaved(data.profile)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1a3c5e]/40'

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-[#1a3c5e] transition"><ArrowLeft size={18} /></button>
        <h2 className="text-[#1a3c5e] font-black text-lg">Edit Alumni Profile</h2>
      </div>

      <div className="rounded-2xl border border-gray-200 p-4">
        <p className="text-gray-600 font-bold text-xs uppercase tracking-wider mb-3">Profile Photo</p>
        <div className="flex items-center gap-4">
          <Avatar name={profile.fullName} src={avatarPreview} size={14} />
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files?.[0]; if (!f) return
              setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); e.target.value = ''
            }} />
            <button onClick={() => fileRef.current?.click()} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition">
              Upload Different Photo
            </button>
            <p className="text-gray-400 text-xs mt-1">Defaults to your account avatar. Upload a different one if you'd like.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
        <p className="text-gray-600 font-bold text-xs uppercase tracking-wider">Career Info</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-500 text-xs font-semibold mb-1 block">Graduation Year</label>
            <input type="number" min={1980} max={new Date().getFullYear()} value={form.graduationYear}
              onChange={e => setF('graduationYear', e.target.value)} style={{ fontSize: 16 }} className={inputCls} />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold mb-1 block">Field</label>
            <select value={form.field} onChange={e => setF('field', e.target.value)} style={{ fontSize: 16 }} className={inputCls}>
              {FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-500 text-xs font-semibold mb-1 block">Current Role</label>
            <input value={form.currentRole} onChange={e => setF('currentRole', e.target.value)} placeholder="e.g. Senior Reporter" style={{ fontSize: 16 }} className={inputCls} />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold mb-1 block">Company / Organisation</label>
            <input value={form.currentCompany} onChange={e => setF('currentCompany', e.target.value)} placeholder="e.g. NTA" style={{ fontSize: 16 }} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="text-gray-500 text-xs font-semibold mb-1 block">Location</label>
          <input value={form.location} onChange={e => setF('location', e.target.value)} placeholder="e.g. Lagos, Nigeria" style={{ fontSize: 16 }} className={inputCls} />
        </div>
        <div>
          <label className="text-gray-500 text-xs font-semibold mb-1 block">Bio</label>
          <textarea value={form.bio} onChange={e => setF('bio', e.target.value)} rows={3} placeholder="Tell students about your journey..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-[#1a3c5e]/40 resize-none" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
        <p className="text-gray-600 font-bold text-xs uppercase tracking-wider">Notable Achievements</p>
        {form.achievements.map((a, i) => (
          <div key={i} className="flex gap-2">
            <input value={a} onChange={e => setF('achievements', form.achievements.map((x, j) => j === i ? e.target.value : x))}
              placeholder="e.g. Award, publication, project…" style={{ fontSize: 16 }}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            {form.achievements.length > 1 && <button onClick={() => setF('achievements', form.achievements.filter((_, j) => j !== i))} className="p-2 text-gray-400 hover:text-red-500"><X size={13} /></button>}
          </div>
        ))}
        <button onClick={() => setF('achievements', [...form.achievements, ''])} className="text-xs text-[#1a3c5e] flex items-center gap-1"><Plus size={11} /> Add achievement</button>
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
        <p className="text-gray-600 font-bold text-xs uppercase tracking-wider">Contact <span className="text-gray-400 font-normal normal-case">(visible to members)</span></p>
        <div className="grid grid-cols-2 gap-3">
          {[['email','Email'],['whatsapp','WhatsApp'],['linkedin','LinkedIn URL'],['twitter','Twitter / X'],['instagram','Instagram']].map(([k, l]) => (
            <div key={k}>
              <label className="text-gray-500 text-xs font-semibold mb-1 block">{l}</label>
              <input value={form.contact[k] || ''} onChange={e => setC(k, e.target.value)} style={{ fontSize: 16 }} className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-gray-800 font-bold text-sm">Open to Mentorship</p>
          <p className="text-gray-500 text-xs mt-0.5">Members can send you mentorship requests</p>
        </div>
        <div onClick={() => setF('openToMentorship', !form.openToMentorship)}
          className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${form.openToMentorship ? 'bg-[#1a3c5e]' : 'bg-gray-300'}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.openToMentorship ? 'left-6' : 'left-1'}`} />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl">Cancel</button>
        <button onClick={save} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold rounded-xl disabled:opacity-50 transition">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
        </button>
      </div>
    </div>
  )
}

// ── Opportunity form ──────────────────────────────────────────────────────────
function OpportunityForm({ existing, onSaved, onCancel }) {
  const [form, setForm] = useState({
    type:        existing?.type        || 'job',
    title:       existing?.title       || '',
    company:     existing?.company     || '',
    description: existing?.description || '',
    requirements: existing?.requirements?.length ? existing.requirements : [''],
    locationType: existing?.locationType || 'onsite',
    city:         existing?.city       || '',
    deadline:     existing?.deadline   ? existing.deadline.slice(0, 10) : '',
    applyLink:    existing?.applyLink  || '',
    applyEmail:   existing?.applyEmail || '',
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
        <p className="text-gray-600 font-bold text-xs uppercase tracking-wider">Details</p>
        <div className="flex gap-2 flex-wrap">
          {OPP_TYPES.filter(t => t.id !== 'all').map(t => (
            <button key={t.id} onClick={() => setF('type', t.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition ${form.type === t.id ? 'bg-[#1a3c5e] text-white border-[#1a3c5e]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Title *</label><input value={form.title} onChange={e => setF('title', e.target.value)} placeholder="e.g. Digital Content Writer" style={{ fontSize: 16 }} className={inputCls} /></div>
        <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Company</label><input value={form.company} onChange={e => setF('company', e.target.value)} placeholder="e.g. Channels TV" style={{ fontSize: 16 }} className={inputCls} /></div>
        <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Description *</label>
          <textarea value={form.description} onChange={e => setF('description', e.target.value)} rows={5} placeholder="Describe the role and what you're looking for..."
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
        <p className="text-gray-600 font-bold text-xs uppercase tracking-wider">Location & Deadline</p>
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
        <p className="text-gray-600 font-bold text-xs uppercase tracking-wider">How to Apply *</p>
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Alumni() {
  const { user } = useAuth()
  const isAdmin = user?.isStaffAdmin || user?.isStudentAdmin || user?.accountType === 'staff'
  const isAlumni = user?.isAlumni

  // Non-alumni undergraduates see the fun gate; admins always pass through
  if (!isAlumni && !isAdmin) return <UndergradGate />

  const [tab, setTab]             = useState('opportunities')
  const [opps, setOpps]           = useState([])
  const [myProfile, setMyProfile] = useState(null)
  const [myOpps, setMyOpps]       = useState([])
  const [pending, setPending]     = useState({ profiles: [], opportunities: [] })
  const [oppsLoading, setOL]      = useState(false)
  const [profileLoading, setPL]   = useState(false)

  const [oppType, setOppType]     = useState('all')
  const [oppSearch, setOppSearch] = useState('')
  const [expandedOpp, setExpandedOpp] = useState(null)

  const [editingProfile, setEditingProfile] = useState(false)
  const [postingOpp, setPostingOpp]         = useState(false)
  const [editingOpp, setEditingOpp]         = useState(null)
  const [mentorProfile, setMentorProfile]   = useState(null)
  const [viewProfileId, setViewProfileId]   = useState(null)

  useEffect(() => {
    if (tab !== 'opportunities') return
    setOL(true)
    const params = new URLSearchParams()
    if (oppType !== 'all') params.set('type', oppType)
    if (oppSearch) params.set('search', oppSearch)
    axios.get(`/api/alumni/opportunities?${params}`)
      .then(r => setOpps(r.data.opportunities || []))
      .catch(() => toast.error('Failed to load.'))
      .finally(() => setOL(false))
  }, [tab, oppType, oppSearch])

  useEffect(() => {
    if (tab !== 'my-profile') return
    setPL(true)
    axios.get('/api/alumni/profiles/mine')
      .then(r => { setMyProfile(r.data.profile); setMyOpps(r.data.opportunities || []) })
      .catch(() => {})
      .finally(() => setPL(false))
  }, [tab])

  useEffect(() => {
    if (tab !== 'pending' || !isAdmin) return
    axios.get('/api/alumni/admin/pending').then(r => setPending(r.data)).catch(() => {})
  }, [tab])

  const approveProfile = async (id, status) => {
    await axios.put(`/api/alumni/profiles/${id}`, { data: JSON.stringify({ status }) })
    setPending(p => ({ ...p, profiles: p.profiles.filter(x => x._id !== id) }))
    toast.success(status === 'approved' ? 'Approved!' : 'Rejected.')
  }

  const approveOpp = async (id, approved) => {
    await axios.put(`/api/alumni/opportunities/${id}`, { approved })
    setPending(p => ({ ...p, opportunities: p.opportunities.filter(x => x._id !== id) }))
    toast.success(approved ? 'Approved!' : 'Rejected.')
  }

  const deleteOpp = async (id) => {
    if (!window.confirm('Delete this opportunity?')) return
    await axios.delete(`/api/alumni/opportunities/${id}`)
    setMyOpps(p => p.filter(o => o._id !== id))
    toast.success('Deleted.')
  }

  const pendingCount = pending.profiles.length + pending.opportunities.length

  const tabs = [
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'my-profile',   label: 'My Profile',    icon: User },
    ...(isAdmin ? [{ id: 'pending', label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: AlertCircle }] : []),
  ]

  // ── Sub-views ─────────────────────────────────────────────────────────────
  if (viewProfileId) return (
    <>
      {mentorProfile && <MentorshipModal profile={mentorProfile} onClose={() => setMentorProfile(null)} />}
      <ProfileDetail
        profileId={viewProfileId}
        currentUserId={user?._id}
        onBack={() => setViewProfileId(null)}
        onMentorship={p => setMentorProfile(p)}
      />
    </>
  )
  if (editingProfile && myProfile) return (
    <ProfileForm profile={myProfile} userAvatar={user?.avatar}
      onSaved={p => { setMyProfile(p); setEditingProfile(false) }}
      onCancel={() => setEditingProfile(false)} />
  )
  if (postingOpp) return (
    <OpportunityForm
      onSaved={o => { setMyOpps(p => [o, ...p]); setPostingOpp(false) }}
      onCancel={() => setPostingOpp(false)} />
  )
  if (editingOpp) return (
    <OpportunityForm existing={editingOpp}
      onSaved={o => { setMyOpps(p => p.map(x => x._id === o._id ? o : x)); setEditingOpp(null) }}
      onCancel={() => setEditingOpp(null)} />
  )

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {mentorProfile && <MentorshipModal profile={mentorProfile} onClose={() => setMentorProfile(null)} />}

      <div className="mb-5">
        <h1 className="text-[#1a3c5e] font-black text-xl">Alumni Network</h1>
        <p className="text-gray-500 text-sm mt-0.5">Opportunities and connections from AMACOS graduates</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition -mb-px whitespace-nowrap ${tab === t.id ? 'border-[#1a3c5e] text-[#1a3c5e]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Opportunities ── */}
      {tab === 'opportunities' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {OPP_TYPES.map(t => (
              <button key={t.id} onClick={() => setOppType(t.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${oppType === t.id ? 'bg-[#1a3c5e] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {t.label}
              </button>
            ))}
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
              ? <div className="text-center py-20">
                  <Briefcase size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold">No opportunities yet</p>
                  {isAlumni && <p className="text-gray-400 text-sm mt-1">Go to My Profile to post one</p>}
                </div>
              : opps.map(o => {
                  const open = expandedOpp === o._id
                  const expired = o.deadline && new Date(o.deadline) < new Date()
                  const posterProfileId = o.alumniProfile?._id
                  return (
                    <div key={o._id} className={`bg-white rounded-2xl border transition ${expired ? 'border-gray-200 opacity-70' : 'border-gray-200 hover:border-[#1a3c5e]/30 hover:shadow-sm'}`}>
                      <div className="p-4">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[o.type] || ''}`}>{o.type}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${o.locationType === 'remote' ? 'bg-green-50 text-green-600' : o.locationType === 'hybrid' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                {o.locationType}{o.city && o.locationType !== 'remote' ? ` · ${o.city}` : ''}
                              </span>
                              {expired && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Expired</span>}
                            </div>
                            <p className="text-gray-800 font-bold">{o.title}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{o.company || ''}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-gray-400 text-xs flex-wrap">
                              {o.deadline && <span className="flex items-center gap-1"><Calendar size={10} /> {expired ? 'Closed' : `Deadline: ${new Date(o.deadline).toLocaleDateString()}`}</span>}
                              {o.alumniProfile && (
                                <button
                                  onClick={() => posterProfileId && setViewProfileId(posterProfileId)}
                                  className="flex items-center gap-1 hover:text-[#1a3c5e] transition font-medium">
                                  <User size={10} /> {o.alumniProfile.fullName}
                                </button>
                              )}
                            </div>
                          </div>
                          <button onClick={() => setExpandedOpp(open ? null : o._id)} className="p-1.5 text-gray-400 flex-shrink-0">
                            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
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
                                    <div key={i} className="flex items-start gap-2">
                                      <CheckCircle2 size={11} className="text-[#1a3c5e] mt-0.5 flex-shrink-0" />
                                      <p className="text-gray-600 text-sm">{r}</p>
                                    </div>
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

                            {/* View poster profile + mentorship */}
                            {posterProfileId && (
                              <div className="flex items-center gap-3 pt-1">
                                <button onClick={() => setViewProfileId(posterProfileId)}
                                  className="flex items-center gap-1.5 text-xs text-[#1a3c5e] font-semibold hover:underline">
                                  <User size={11} /> View {o.alumniProfile?.fullName?.split(' ')[0]}'s profile
                                </button>
                                {o.alumniProfile?.openToMentorship && o.alumniProfile?.user?.toString() !== user?._id && (
                                  <button onClick={() => setMentorProfile(o.alumniProfile)}
                                    className="flex items-center gap-1.5 text-xs text-green-600 font-semibold hover:underline">
                                    <BookOpen size={11} /> Request mentorship
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
          }
        </div>
      )}

      {/* ── My Profile ── */}
      {tab === 'my-profile' && (
        <div className="space-y-5">
          {profileLoading
            ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-[#1a3c5e]" /></div>
            : !isAlumni
              ? <div className="text-center py-16">
                  <User size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-semibold">Admin view</p>
                  <p className="text-gray-400 text-sm mt-1">Alumni profiles are created automatically when students graduate.</p>
                </div>
              : myProfile
                ? <>
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                      <div className="flex items-start gap-4">
                        <Avatar name={myProfile.fullName} src={myProfile.avatar || user?.avatar} size={14} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-gray-800 font-bold text-base">{myProfile.fullName}</p>
                              <p className="text-gray-500 text-sm">{[myProfile.currentRole, myProfile.currentCompany].filter(Boolean).join(' · ')}</p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <FieldBadge field={myProfile.field} />
                                <span className="text-gray-400 text-xs">Class of {myProfile.graduationYear}</span>
                                {myProfile.openToMentorship && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><BookOpen size={10} /> Open to mentorship</span>}
                              </div>
                            </div>
                            <button onClick={() => setEditingProfile(true)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition flex-shrink-0">
                              <Edit2 size={11} /> Edit
                            </button>
                          </div>
                          {myProfile.location && <p className="text-gray-400 text-xs mt-2 flex items-center gap-1"><MapPin size={10} /> {myProfile.location}</p>}
                          {myProfile.bio && <p className="text-gray-600 text-sm mt-2">{myProfile.bio}</p>}
                        </div>
                      </div>

                      {myProfile.achievements?.filter(Boolean).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
                          {myProfile.achievements.filter(Boolean).map((a, i) => (
                            <div key={i} className="flex items-start gap-2"><Star size={11} className="text-amber-400 mt-0.5 flex-shrink-0" /><p className="text-gray-600 text-sm">{a}</p></div>
                          ))}
                        </div>
                      )}

                      {Object.values(myProfile.contact || {}).some(Boolean) && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                          {myProfile.contact?.email && <a href={`mailto:${myProfile.contact.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Mail size={11} /> Email</a>}
                          {myProfile.contact?.whatsapp && <a href={`https://wa.me/${myProfile.contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-green-600 hover:underline"><Phone size={11} /> WhatsApp</a>}
                          {myProfile.contact?.linkedin && <a href={myProfile.contact.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline"><ExternalLink size={11} /> LinkedIn</a>}
                          {myProfile.contact?.twitter && <a href={`https://twitter.com/${myProfile.contact.twitter.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-sky-500 hover:underline"><ExternalLink size={11} /> Twitter</a>}
                          {myProfile.contact?.instagram && <a href={`https://instagram.com/${myProfile.contact.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-pink-500 hover:underline"><ExternalLink size={11} /> Instagram</a>}
                        </div>
                      )}

                      {!myProfile.currentRole && !myProfile.bio && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                          <p className="text-blue-700 text-xs font-semibold">Your profile was auto-created. Tap Edit to complete it with your current role, bio, and contact info.</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-700 font-bold">My Posted Opportunities</p>
                        <button onClick={() => setPostingOpp(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3c5e] text-white text-xs font-bold rounded-xl hover:bg-[#1a3c5e]/80 transition">
                          <Plus size={12} /> Post Opportunity
                        </button>
                      </div>
                      {myOpps.length === 0
                        ? <div className="text-center py-10 bg-white rounded-2xl border border-gray-200">
                            <Briefcase size={24} className="text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No opportunities posted yet</p>
                            <p className="text-gray-400 text-xs mt-1">Post jobs or internships for current students</p>
                          </div>
                        : myOpps.map(o => (
                            <div key={o._id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[o.type] || ''}`}>{o.type}</span>
                                  {!o.approved && <span className="text-[10px] text-yellow-600 font-bold">Pending approval</span>}
                                  {o.status === 'closed' && <span className="text-[10px] text-gray-500 font-bold">Closed</span>}
                                </div>
                                <p className="text-gray-800 font-bold text-sm">{o.title}</p>
                                {o.company && <p className="text-gray-500 text-xs">{o.company}</p>}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => setEditingOpp(o)} className="p-1.5 text-gray-400 hover:text-[#1a3c5e] transition"><Edit2 size={13} /></button>
                                <button onClick={() => deleteOpp(o._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition"><Trash2 size={13} /></button>
                              </div>
                            </div>
                          ))
                      }
                    </div>
                  </>
                : <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-[#1a3c5e]" /></div>
          }
        </div>
      )}

      {/* ── Admin Pending ── */}
      {tab === 'pending' && isAdmin && (
        <div className="space-y-6">
          <div>
            <p className="text-gray-700 font-bold mb-3">Pending Profiles ({pending.profiles.length})</p>
            {pending.profiles.length === 0
              ? <div className="text-center py-8 bg-white rounded-2xl border border-gray-200"><CheckCircle2 size={22} className="text-green-400 mx-auto mb-2" /><p className="text-gray-500 text-sm">All clear</p></div>
              : pending.profiles.map(p => (
                  <div key={p._id} className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar name={p.fullName} src={p.avatar} size={10} />
                      <div>
                        <p className="text-gray-800 font-bold text-sm">{p.fullName}</p>
                        <p className="text-gray-500 text-xs">Class of {p.graduationYear} · {p.currentRole || 'No role set'}</p>
                      </div>
                    </div>
                    {p.bio && <p className="text-gray-500 text-sm line-clamp-2 mb-3">{p.bio}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => approveProfile(p._id, 'approved')} className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 hover:bg-green-400 text-white text-xs font-bold rounded-xl transition"><Check size={12} /> Approve</button>
                      <button onClick={() => approveProfile(p._id, 'rejected')} className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-xl transition"><X size={12} /> Reject</button>
                    </div>
                  </div>
                ))
            }
          </div>
          <div>
            <p className="text-gray-700 font-bold mb-3">Pending Opportunities ({pending.opportunities.length})</p>
            {pending.opportunities.length === 0
              ? <div className="text-center py-8 bg-white rounded-2xl border border-gray-200"><CheckCircle2 size={22} className="text-green-400 mx-auto mb-2" /><p className="text-gray-500 text-sm">All clear</p></div>
              : pending.opportunities.map(o => (
                  <div key={o._id} className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[o.type] || ''}`}>{o.type}</span>
                    </div>
                    <p className="text-gray-800 font-bold text-sm">{o.title}</p>
                    <p className="text-gray-500 text-xs mb-2">{o.company} · Posted by {o.postedBy?.fullName}</p>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-3">{o.description}</p>
                    <div className="flex gap-2">
                      <button onClick={() => approveOpp(o._id, true)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 hover:bg-green-400 text-white text-xs font-bold rounded-xl transition"><Check size={12} /> Approve</button>
                      <button onClick={() => approveOpp(o._id, false)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-xl transition"><X size={12} /> Reject</button>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
