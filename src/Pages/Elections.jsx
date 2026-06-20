import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  Award, Plus, Calendar, Clock, ChevronRight, Loader2, X,
  Check, ChevronLeft, Vote, Users, FileText, Trash2,
} from 'lucide-react'

const SB = '#0a1929'

const STATUS_META = {
  draft:             { label: 'Draft',          cls: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
  form_picking:      { label: 'Form Picking',   cls: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  reviewing:         { label: 'Under Review',   cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  voting:            { label: 'Voting Open',    cls: 'text-green-400 bg-green-400/10 border-green-400/20' },
  closed:            { label: 'Closed',         cls: 'text-red-400 bg-red-400/10 border-red-400/20' },
  results_published: { label: 'Results Out',   cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
}

const STATUS_NEXT_LABEL = {
  draft:        'Open Form Picking',
  form_picking: 'Start Reviewing',
  reviewing:    'Open Voting',
  voting:       'Close Voting',
  closed:       'Publish Results',
}

const REQUIREMENTS = [
  { id: 'student_id',        label: 'Student ID Card' },
  { id: 'school_gmail',      label: 'School Gmail' },
  { id: 'matric_number',     label: 'Matric Number on Record' },
  { id: 'active_member',     label: 'Active AMACOS Member' },
  { id: 'physical_presence', label: 'Physical Presence at Polling Unit' },
]

const VISIBILITY_OPTS = [
  { id: 'live',        label: 'Live Updates',  desc: 'Bar chart visible to everyone, updates in real-time as votes come in' },
  { id: 'after_close', label: 'After Close',   desc: 'Everyone sees results the moment voting ends' },
  { id: 'admin_only',  label: 'Admin Only',    desc: 'Only you (admin) see results — announce however you want' },
]

const emptyPos = { title: '', description: '', formFee: 0 }
const emptyForm = {
  title: '', description: '',
  resultsVisibility: 'after_close', votingRequirements: [],
  formPickingStart: '', formPickingDeadline: '',
  votingStart: '', votingDeadline: '',
  bankName: '', accountNumber: '', accountName: '', paymentNote: '',
}

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—'

export default function Elections() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const isAdmin    = user?.isStaffAdmin || user?.isStudentAdmin || user?.accountType === 'staff'

  const [elections, setElections] = useState([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [step, setStep]           = useState(1)
  const [form, setForm]           = useState(emptyForm)
  const [positions, setPositions] = useState([{ ...emptyPos }])
  const [saving, setSaving]       = useState(false)
  const [advancing, setAdvancing] = useState(null)

  useEffect(() => {
    axios.get('/api/elections')
      .then(r => setElections(r.data.elections || []))
      .catch(() => toast.error('Failed to load elections.'))
      .finally(() => setLoading(false))
  }, [])

  const setF        = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleReq   = (id) => setF('votingRequirements',
    form.votingRequirements.includes(id)
      ? form.votingRequirements.filter(r => r !== id)
      : [...form.votingRequirements, id]
  )
  const setPos = (i, k, v) => setPositions(p => p.map((x, j) => j === i ? { ...x, [k]: v } : x))
  const hasFees    = positions.some(p => Number(p.formFee) > 0)
  const totalSteps = hasFees ? 4 : 3

  const cancelCreate = () => { setCreating(false); setStep(1); setForm(emptyForm); setPositions([{ ...emptyPos }]) }

  const saveElection = async (asDraft) => {
    if (!form.title.trim()) return toast.error('Title is required.')
    if (positions.some(p => !p.title.trim())) return toast.error('All positions need a title.')
    setSaving(true)
    try {
      const { data } = await axios.post('/api/elections', {
        ...form,
        positions: positions.map(p => ({ ...p, formFee: Number(p.formFee) || 0 })),
        status: asDraft ? 'draft' : 'form_picking',
      })
      setElections(prev => [data.election, ...prev])
      cancelCreate()
      toast.success(asDraft ? 'Saved as draft.' : 'Election published!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const advance = async (el) => {
    if (!window.confirm(`Advance "${el.title}" to: ${STATUS_NEXT_LABEL[el.status]}?`)) return
    setAdvancing(el._id)
    try {
      const { data } = await axios.put(`/api/elections/${el._id}/advance`)
      setElections(p => p.map(e => e._id === data.election._id ? data.election : e))
      toast.success(`Stage updated: ${STATUS_META[data.election.status]?.label}`)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setAdvancing(null) }
  }

  const deleteElection = async (el, e) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${el.title}"? This is permanent.`)) return
    try {
      await axios.delete(`/api/elections/${el._id}`)
      setElections(p => p.filter(x => x._id !== el._id))
      toast.success('Election deleted.')
    } catch { toast.error('Failed.') }
  }

  // ── Create form ──────────────────────────────────────────────────────────
  if (creating) {
    const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/40'
    return (
      <div className="max-w-2xl mx-auto pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={cancelCreate} className="p-2 text-gray-500 hover:text-white transition">
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-white font-black text-lg">Create Election</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-7">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all flex-shrink-0 ${
                s < step  ? 'bg-amber-400 border-amber-400 text-[#060d1a]' :
                s === step ? 'border-amber-400 text-amber-400' :
                             'border-gray-700 text-gray-600'
              }`}>{s < step ? <Check size={11} /> : s}</div>
              {s < totalSteps && <div className={`flex-1 h-0.5 ${s < step ? 'bg-amber-400' : 'bg-gray-800'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Basic Info */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-white font-bold">Basic Information</h2>
            <div>
              <label className="text-gray-400 text-xs font-semibold mb-1.5 block">Election Title *</label>
              <input value={form.title} onChange={e => setF('title', e.target.value)}
                placeholder="e.g. AMACOS 2025/2026 General Elections"
                style={{ fontSize: 16 }} className={inputCls} />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={e => setF('description', e.target.value)}
                rows={2} placeholder="Brief description..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-amber-400/40 resize-none" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold mb-2 block">Voting Requirements <span className="text-gray-600 font-normal">(tick all that apply)</span></label>
              <div className="space-y-2.5">
                {REQUIREMENTS.map(r => (
                  <div key={r.id} onClick={() => toggleReq(r.id)} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                      form.votingRequirements.includes(r.id) ? 'bg-amber-400 border-amber-400' : 'border-gray-600 group-hover:border-gray-400'
                    }`}>
                      {form.votingRequirements.includes(r.id) && <Check size={10} className="text-[#060d1a]" />}
                    </div>
                    <span className="text-gray-300 text-sm">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold mb-2 block">Results Visibility</label>
              <div className="space-y-2">
                {VISIBILITY_OPTS.map(v => (
                  <div key={v.id} onClick={() => setF('resultsVisibility', v.id)}
                    className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition"
                    style={{
                      borderColor: form.resultsVisibility === v.id ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.07)',
                      background: form.resultsVisibility === v.id ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.02)',
                    }}>
                    <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                      form.resultsVisibility === v.id ? 'border-amber-400' : 'border-gray-600'
                    }`}>
                      {form.resultsVisibility === v.id && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{v.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Timeline */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-white font-bold">Election Timeline</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'formPickingStart',    label: 'Form Picking Opens' },
                { key: 'formPickingDeadline', label: 'Form Picking Closes' },
                { key: 'votingStart',         label: 'Voting Opens' },
                { key: 'votingDeadline',      label: 'Voting Deadline' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-gray-400 text-xs font-semibold mb-1.5 block">{label}</label>
                  <input type="datetime-local" value={form[key]} onChange={e => setF(key, e.target.value)}
                    style={{ fontSize: 16, colorScheme: 'dark' }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400/40" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Positions */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-white font-bold">Positions</h2>
            <p className="text-gray-500 text-sm">Add all positions to be contested. Set form fee to 0 for free.</p>
            <div className="space-y-3">
              {positions.map((p, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/8 space-y-3" style={{ background: 'rgba(255,255,255,0.025)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-xs font-bold w-5">#{i + 1}</span>
                    <input value={p.title} onChange={e => setPos(i, 'title', e.target.value)}
                      placeholder="Position (e.g. President)" style={{ fontSize: 16 }}
                      className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-amber-400/40" />
                    {positions.length > 1 && (
                      <button onClick={() => setPositions(px => px.filter((_, j) => j !== i))} className="p-1.5 text-gray-600 hover:text-red-400 transition">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <input value={p.description} onChange={e => setPos(i, 'description', e.target.value)}
                    placeholder="Brief role description (optional)" style={{ fontSize: 16 }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-amber-400/40" />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">Form Fee:</span>
                    <span className="text-gray-500 text-xs">₦</span>
                    <input type="number" min={0} value={p.formFee} onChange={e => setPos(i, 'formFee', e.target.value)}
                      placeholder="0" style={{ fontSize: 16 }}
                      className="w-28 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-amber-400/40" />
                    <span className="text-gray-600 text-xs">{Number(p.formFee) === 0 ? '(Free)' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setPositions(p => [...p, { ...emptyPos }])}
              className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition">
              <Plus size={13} /> Add another position
            </button>
          </div>
        )}

        {/* Step 4 — Payment Info */}
        {step === 4 && hasFees && (
          <div className="space-y-4">
            <h2 className="text-white font-bold">Payment Information</h2>
            <p className="text-gray-500 text-sm">Some positions require a form fee. Provide payment details for aspirants.</p>
            {[
              { key: 'bankName',      label: 'Bank Name',      ph: 'e.g. First Bank' },
              { key: 'accountNumber', label: 'Account Number', ph: 'e.g. 0123456789' },
              { key: 'accountName',   label: 'Account Name',   ph: 'e.g. AMACOS Exco' },
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <label className="text-gray-400 text-xs font-semibold mb-1.5 block">{label}</label>
                <input value={form[key]} onChange={e => setF(key, e.target.value)} placeholder={ph}
                  style={{ fontSize: 16 }} className={inputCls} />
              </div>
            ))}
            <div>
              <label className="text-gray-400 text-xs font-semibold mb-1.5 block">Note to Aspirants</label>
              <textarea value={form.paymentNote} onChange={e => setF('paymentNote', e.target.value)}
                rows={2} placeholder="e.g. Send payment evidence to the PRO via WhatsApp: 0812..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-amber-400/40 resize-none" />
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="flex gap-2 mt-7">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 px-4 py-2.5 bg-white/5 text-gray-300 text-sm rounded-xl hover:bg-white/10 transition">
              <ChevronLeft size={13} /> Back
            </button>
          )}
          {step < totalSteps ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#060d1a] font-bold text-sm rounded-xl transition">
              Next <ChevronRight size={13} />
            </button>
          ) : (
            <div className="flex-1 flex gap-2">
              <button onClick={() => saveElection(true)} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/8 text-gray-300 text-sm rounded-xl hover:bg-white/15 transition disabled:opacity-50">
                {saving && <Loader2 size={12} className="animate-spin" />} Save as Draft
              </button>
              <button onClick={() => saveElection(false)} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#060d1a] font-bold text-sm rounded-xl transition disabled:opacity-50">
                {saving && <Loader2 size={12} className="animate-spin" />} Publish
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Election list ────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#1a3c5e] font-black text-xl">Elections</h1>
          <p className="text-gray-500 text-sm mt-0.5">AMACOS electoral activities</p>
        </div>
        {isAdmin && (
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold text-sm rounded-xl transition">
            <Plus size={14} /> Create Election
          </button>
        )}
      </div>

      {loading
        ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-[#1a3c5e]" /></div>
        : elections.length === 0
          ? (
            <div className="text-center py-20">
              <Award size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">No elections yet</p>
              {isAdmin && <p className="text-gray-400 text-sm mt-1">Create the first election using the button above</p>}
            </div>
          )
          : elections.map(el => {
              const meta = STATUS_META[el.status] || STATUS_META.draft
              return (
                <div key={el._id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 hover:border-[#1a3c5e]/30 hover:shadow-sm transition cursor-pointer"
                  onClick={() => navigate(`/app/elections/${el._id}`)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}>{meta.label}</span>
                        <span className="text-gray-400 text-[10px]">{el.positions?.length || 0} positions</span>
                        <span className="text-gray-400 text-[10px]">
                          {el.resultsVisibility === 'live' ? '📊 Live results' :
                           el.resultsVisibility === 'admin_only' ? '🔒 Admin results' : '📊 Results after close'}
                        </span>
                      </div>
                      <h3 className="text-[#1a3c5e] font-bold">{el.title}</h3>
                      {el.description && <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{el.description}</p>}
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="text-gray-400 text-xs flex items-center gap-1"><FileText size={10} /> Forms close: {fmtDate(el.formPickingDeadline)}</span>
                        <span className="text-gray-400 text-xs flex items-center gap-1"><Vote size={10} /> Voting ends: {fmtDate(el.votingDeadline)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <ChevronRight size={16} className="text-gray-400" />
                      {isAdmin && STATUS_NEXT_LABEL[el.status] && (
                        <button onClick={e => { e.stopPropagation(); advance(el) }} disabled={advancing === el._id}
                          className="text-[10px] px-2.5 py-1 bg-[#1a3c5e]/8 text-[#1a3c5e] rounded-lg border border-[#1a3c5e]/15 hover:bg-[#1a3c5e]/15 transition whitespace-nowrap flex items-center gap-1">
                          {advancing === el._id ? <Loader2 size={9} className="animate-spin" /> : null}
                          {STATUS_NEXT_LABEL[el.status]}
                        </button>
                      )}
                      {isAdmin && el.status === 'draft' && (
                        <button onClick={e => deleteElection(el, e)} className="p-1 text-gray-400 hover:text-red-500 transition">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
      }
    </div>
  )
}
