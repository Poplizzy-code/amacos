import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  Users, Plus, ChevronRight, Loader2, X, Check, ChevronLeft,
  Image as ImageIcon, Link2, Crown, Shield, Clock, CheckCircle2,
} from 'lucide-react'

const TYPE_META = {
  community: { label: 'Community', cls: 'text-blue-600 bg-blue-50 border-blue-200' },
  club:      { label: 'Club',      cls: 'text-purple-600 bg-purple-50 border-purple-200' },
}
const STATUS_META = {
  pending:   { label: 'Pending Approval', cls: 'text-yellow-600 bg-yellow-50' },
  active:    { label: 'Active',           cls: 'text-green-600 bg-green-50' },
  suspended: { label: 'Suspended',        cls: 'text-red-600 bg-red-50' },
}

const emptyForm = {
  name: '', description: '', type: 'community',
  joinMode: 'approval', prerequisites: [''],
  groupChatLink: '',
}

export default function Communities() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const isAdmin    = user?.isStaffAdmin || user?.isStudentAdmin || user?.accountType === 'staff'

  const [communities, setCommunities] = useState([])
  const [loading, setLoading]         = useState(true)
  const [creating, setCreating]       = useState(false)
  const [step, setStep]               = useState(1)
  const [form, setForm]               = useState(emptyForm)
  const [coverFile, setCoverFile]     = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [saving, setSaving]           = useState(false)
  const [filter, setFilter]           = useState('all') // all | community | club

  useEffect(() => {
    axios.get('/api/communities')
      .then(r => setCommunities(r.data.communities || []))
      .catch(() => toast.error('Failed to load communities.'))
      .finally(() => setLoading(false))
  }, [])

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const setPrereq = (i, v) => setForm(f => ({
    ...f,
    prerequisites: f.prerequisites.map((p, j) => j === i ? v : p),
  }))
  const addPrereq    = () => setForm(f => ({ ...f, prerequisites: [...f.prerequisites, ''] }))
  const removePrereq = (i) => setForm(f => ({ ...f, prerequisites: f.prerequisites.filter((_, j) => j !== i) }))

  const cancelCreate = () => {
    setCreating(false); setStep(1); setForm(emptyForm)
    setCoverFile(null); setCoverPreview('')
  }

  const saveCreate = async () => {
    if (!form.name.trim()) return toast.error('Community name is required.')
    setSaving(true)
    try {
      const fd = new FormData()
      const body = {
        ...form,
        prerequisites: form.prerequisites.filter(p => p.trim()),
      }
      fd.append('data', JSON.stringify(body))
      if (coverFile) fd.append('coverImage', coverFile)
      const { data } = await axios.post('/api/communities', fd)
      setCommunities(prev => [{ ...data.community, memberCount: 1, isMember: true, isManager: true }, ...prev])
      cancelCreate()
      toast.success(isAdmin ? 'Community created!' : 'Submitted for admin approval!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const filtered = communities.filter(c => filter === 'all' || c.type === filter)

  // ── Create form ──────────────────────────────────────────────────────────
  if (creating) {
    const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1a3c5e]/40'
    const totalSteps = 3
    return (
      <div className="max-w-2xl mx-auto pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={cancelCreate} className="p-2 text-gray-500 hover:text-[#1a3c5e] transition">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-[#1a3c5e] font-black text-lg">Create Community</h1>
            <p className="text-gray-400 text-xs">{isAdmin ? 'Goes live immediately' : 'Submitted to admin for approval'}</p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1 mb-7">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all flex-shrink-0 ${
                s < step ? 'bg-[#1a3c5e] border-[#1a3c5e] text-white' :
                s === step ? 'border-[#1a3c5e] text-[#1a3c5e]' : 'border-gray-200 text-gray-400'
              }`}>{s < step ? <Check size={11} /> : s}</div>
              {s < totalSteps && <div className={`flex-1 h-0.5 ${s < step ? 'bg-[#1a3c5e]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Basic info */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-gray-800 font-bold">Basic Information</h2>

            {/* Cover image */}
            <div>
              <label className="text-gray-500 text-xs font-semibold mb-2 block">Cover Image</label>
              {coverPreview
                ? <div className="relative h-36 rounded-2xl overflow-hidden border border-gray-200">
                    <img src={coverPreview} className="w-full h-full object-cover" alt="cover" />
                    <button onClick={() => { setCoverFile(null); setCoverPreview('') }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center">
                      <X size={11} />
                    </button>
                  </div>
                : <label className="flex flex-col items-center gap-2 h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#1a3c5e]/30 transition">
                    <ImageIcon size={22} className="text-gray-300 mt-8" />
                    <span className="text-gray-400 text-sm">Upload cover photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0]; if (!f) return
                      setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); e.target.value = ''
                    }} />
                  </label>
              }
            </div>

            <div>
              <label className="text-gray-500 text-xs font-semibold mb-1.5 block">Name *</label>
              <input value={form.name} onChange={e => setF('name', e.target.value)}
                placeholder="e.g. AMACOS Tech Community" style={{ fontSize: 16 }} className={inputCls} />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={e => setF('description', e.target.value)}
                rows={3} placeholder="What is this community about?"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-[#1a3c5e]/40 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['community', 'club'].map(t => (
                <div key={t} onClick={() => setF('type', t)}
                  className={`p-3 rounded-xl border-2 cursor-pointer text-center transition ${form.type === t ? 'border-[#1a3c5e] bg-[#1a3c5e]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className={`font-bold text-sm capitalize ${form.type === t ? 'text-[#1a3c5e]' : 'text-gray-600'}`}>{t}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{t === 'community' ? 'Interest-based group' : 'Structured organisation'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Membership */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-gray-800 font-bold">Membership Settings</h2>
            <div>
              <label className="text-gray-500 text-xs font-semibold mb-2 block">Join Mode</label>
              <div className="space-y-2">
                {[
                  { id: 'open',     label: 'Open',              desc: 'Anyone can join instantly — no review needed' },
                  { id: 'approval', label: 'Requires Approval', desc: 'You review and approve each application' },
                ].map(m => (
                  <div key={m.id} onClick={() => setF('joinMode', m.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${form.joinMode === m.id ? 'border-[#1a3c5e] bg-[#1a3c5e]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.joinMode === m.id ? 'border-[#1a3c5e]' : 'border-gray-300'}`}>
                      {form.joinMode === m.id && <div className="w-2 h-2 rounded-full bg-[#1a3c5e]" />}
                    </div>
                    <div>
                      <p className="text-gray-800 text-sm font-semibold">{m.label}</p>
                      <p className="text-gray-500 text-xs">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold mb-2 block">Prerequisites <span className="text-gray-400 font-normal">(what members need before applying)</span></label>
              <div className="space-y-2">
                {form.prerequisites.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={p} onChange={e => setPrereq(i, e.target.value)}
                      placeholder={`Prerequisite ${i + 1}`} style={{ fontSize: 16 }}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-[#1a3c5e]/40" />
                    {form.prerequisites.length > 1 && (
                      <button onClick={() => removePrereq(i)} className="p-2 text-gray-400 hover:text-red-500 transition"><X size={13} /></button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addPrereq} className="mt-2 flex items-center gap-1.5 text-sm text-[#1a3c5e] hover:text-[#1a3c5e]/70 transition">
                <Plus size={13} /> Add prerequisite
              </button>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold mb-1.5 block">Group Chat Link <span className="text-gray-400 font-normal">(from Let's Talk — optional)</span></label>
              <input value={form.groupChatLink} onChange={e => setF('groupChatLink', e.target.value)}
                placeholder="Paste invite link from Let's Talk group" style={{ fontSize: 16 }} className={inputCls} />
              <p className="text-gray-400 text-xs mt-1">Go to Let's Talk → your group → Settings → Generate Invite Link, then paste it here.</p>
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-gray-800 font-bold">Review & Submit</h2>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
              {coverPreview && <img src={coverPreview} className="w-full h-32 object-cover rounded-xl" alt="cover" />}
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[#1a3c5e] font-bold">{form.name || '(no name)'}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold capitalize ${TYPE_META[form.type].cls}`}>{TYPE_META[form.type].label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border font-bold text-gray-500 border-gray-200 capitalize">{form.joinMode === 'open' ? 'Open join' : 'Requires approval'}</span>
              </div>
              {form.description && <p className="text-gray-600 text-sm">{form.description}</p>}
              {form.prerequisites.filter(p => p.trim()).length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs font-semibold mb-1">Prerequisites:</p>
                  {form.prerequisites.filter(p => p.trim()).map((p, i) => <p key={i} className="text-gray-600 text-xs">• {p}</p>)}
                </div>
              )}
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-blue-700 text-xs font-semibold">
                {isAdmin
                  ? 'As admin, your community goes live immediately. You can add onboarding materials, media, and your founder profile after creation.'
                  : 'Your community will be reviewed by an admin before going live. You can complete your community profile (onboarding, media, founder info) after approval.'}
              </p>
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="flex gap-2 mt-7">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 px-4 py-2.5 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200 transition">
              <ChevronLeft size={13} /> Back
            </button>
          )}
          {step < totalSteps ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold text-sm rounded-xl transition">
              Next <ChevronRight size={13} />
            </button>
          ) : (
            <button onClick={saveCreate} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold text-sm rounded-xl transition disabled:opacity-60">
              {saving && <Loader2 size={13} className="animate-spin" />}
              {isAdmin ? 'Create Community' : 'Submit for Approval'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── List ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#1a3c5e] font-black text-xl">Communities & Clubs</h1>
          <p className="text-gray-500 text-sm mt-0.5">Join a group that matches your interests</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold text-sm rounded-xl transition">
          <Plus size={14} /> Create
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {[['all', 'All'], ['community', 'Communities'], ['club', 'Clubs']].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${filter === val ? 'bg-[#1a3c5e] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {loading
        ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-[#1a3c5e]" /></div>
        : filtered.length === 0
          ? <div className="text-center py-20"><Users size={32} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-semibold">No communities yet</p></div>
          : filtered.map(c => {
              const typeMeta = TYPE_META[c.type] || TYPE_META.community
              return (
                <div key={c._id} onClick={() => navigate(`/app/communities/${c._id}`)}
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-[#1a3c5e]/30 hover:shadow-sm transition cursor-pointer">
                  {c.coverImage && <img src={c.coverImage} alt={c.name} className="w-full h-32 object-cover" />}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeMeta.cls}`}>{typeMeta.label}</span>
                          {c.status !== 'active' && isAdmin && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_META[c.status]?.cls}`}>{STATUS_META[c.status]?.label}</span>
                          )}
                          {c.isMember && <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5"><CheckCircle2 size={9} /> Member</span>}
                          {c.isPending && <span className="text-[10px] text-yellow-600 font-bold flex items-center gap-0.5"><Clock size={9} /> Pending</span>}
                          {c.isManager && <span className="text-[10px] text-[#1a3c5e] font-bold flex items-center gap-0.5"><Crown size={9} /> Manager</span>}
                        </div>
                        <h3 className="text-[#1a3c5e] font-bold">{c.name}</h3>
                        {c.description && <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{c.description}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-gray-400 text-xs flex items-center gap-1"><Users size={10} /> {c.memberCount} member{c.memberCount !== 1 ? 's' : ''}</span>
                          <span className="text-gray-400 text-xs capitalize">{c.joinMode === 'open' ? 'Open join' : 'Approval required'}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                    </div>

                    {!c.isMember && !c.isPending && c.status === 'active' && (
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3c5e]/8 text-[#1a3c5e] text-xs font-bold rounded-full">
                          <Plus size={10} /> {c.joinMode === 'open' ? 'Join now' : 'Apply to join'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
      }
    </div>
  )
}
