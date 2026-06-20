import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import {
  ArrowLeft, Loader2, CheckCircle2, Clock, FileText, Vote,
  BarChart3, ChevronDown, ChevronUp, Image as ImageIcon,
  X, Check, AlertCircle, Users, Trophy, Shield,
} from 'lucide-react'

const BG = '#060d1a'
const SB = '#0a1929'
const B2 = '#0d2137'

const STATUS_META = {
  draft:             { label: 'Draft',          cls: 'text-gray-400 bg-gray-400/10' },
  form_picking:      { label: 'Form Picking',   cls: 'text-blue-400 bg-blue-400/10' },
  reviewing:         { label: 'Under Review',   cls: 'text-yellow-400 bg-yellow-400/10' },
  voting:            { label: 'Voting Open',    cls: 'text-green-400 bg-green-400/10' },
  closed:            { label: 'Closed',         cls: 'text-red-400 bg-red-400/10' },
  results_published: { label: 'Results Out',   cls: 'text-amber-400 bg-amber-400/10' },
}

const REQUIREMENT_LABELS = {
  student_id:        'Student ID Card',
  school_gmail:      'School Gmail',
  matric_number:     'Matric Number on Record',
  active_member:     'Active AMACOS Member',
  physical_presence: 'Physical Presence at Polling Unit',
}

const fmtDate = (d) => d
  ? new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—'

// ── Results bar chart ──────────────────────────────────────────────────────
function ResultsChart({ results, totalVoters, positions }) {
  const [expanded, setExpanded] = useState({})
  return (
    <div className="space-y-6">
      <p className="text-gray-500 text-xs">{totalVoters} member{totalVoters !== 1 ? 's' : ''} voted</p>
      {(positions || []).map(pos => {
        const contestants = results[pos.title] || []
        const maxVotes    = Math.max(...contestants.map(c => c.votes), 1)
        const winner      = contestants[0]
        const open        = expanded[pos.title] !== false
        return (
          <div key={pos.title} className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: SB }}>
            <button onClick={() => setExpanded(e => ({ ...e, [pos.title]: !open }))}
              className="w-full flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-amber-400" />
                <span className="text-white font-bold text-sm">{pos.title}</span>
                {contestants.length > 0 && <span className="text-gray-500 text-xs">{contestants.length} contestant{contestants.length !== 1 ? 's' : ''}</span>}
              </div>
              {open ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
            </button>
            {open && (
              <div className="px-4 pb-4 space-y-3">
                {contestants.length === 0
                  ? <p className="text-gray-600 text-sm">No contestants for this position.</p>
                  : contestants.map((c, i) => {
                      const pct = Math.round((c.votes / Math.max(totalVoters, 1)) * 100)
                      const barPct = Math.round((c.votes / maxVotes) * 100)
                      const isWinner = i === 0 && c.votes > 0
                      return (
                        <div key={c.contestant?._id || i}>
                          <div className="flex items-center gap-2.5 mb-1.5">
                            {c.contestant?.avatar
                              ? <img src={c.contestant.avatar} alt={c.contestant.fullName} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                              : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                                  {c.contestant?.fullName?.charAt(0)}
                                </div>
                            }
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-sm font-semibold ${isWinner ? 'text-amber-400' : 'text-white'}`}>{c.contestant?.fullName || 'Unknown'}</span>
                                {isWinner && <Trophy size={11} className="text-amber-400" />}
                              </div>
                              {c.statement && <p className="text-gray-500 text-xs truncate">{c.statement}</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-bold ${isWinner ? 'text-amber-400' : 'text-white'}`}>{c.votes}</p>
                              <p className="text-gray-600 text-[10px]">{pct}%</p>
                            </div>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${isWinner ? 'bg-amber-400' : 'bg-[#2a5298]'}`}
                              style={{ width: `${barPct}%` }} />
                          </div>
                        </div>
                      )
                    })
                }
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ElectionDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const { getSocket } = useSocket()
  const isAdmin    = user?.isStaffAdmin || user?.isStudentAdmin || user?.accountType === 'staff'

  const [election, setElection]           = useState(null)
  const [aspirants, setAspirants]         = useState([])   // approved contestants for students
  const [allAspirants, setAllAspirants]   = useState([])   // all aspirants for admin
  const [myApp, setMyApp]                 = useState(null)
  const [hasVoted, setHasVoted]           = useState(false)
  const [myVotedPositions, setMVP]        = useState([])
  const [results, setResults]             = useState(null)
  const [loadingResults, setLoadingR]     = useState(false)
  const [loading, setLoading]             = useState(true)
  const [adminTab, setAdminTab]           = useState('overview') // overview | aspirants | results
  const [advancing, setAdvancing]         = useState(false)

  // Form picking state
  const [applyPos, setApplyPos]   = useState('')
  const [statement, setStatement] = useState('')
  const [evidenceFile, setEvidFile] = useState(null)
  const [evidencePreview, setEvidPrev] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Ballot state
  const [ballot, setBallot]   = useState({}) // { position: contestantUserId }
  const [voting, setVoting]   = useState(false)

  // Admin aspirant review
  const [rejectNote, setRejectNote] = useState({})
  const [reviewing, setReviewing]   = useState(null)

  const loadElection = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/elections/${id}`)
      setElection(data.election)
      setAspirants(data.aspirants || [])
      setMyApp(data.myApplication)
      setHasVoted(data.hasVoted)
      setMVP(data.myVotedPositions || [])
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load.'); navigate('/app/elections') }
    finally { setLoading(false) }
  }, [id])

  const loadAllAspirants = useCallback(async () => {
    if (!isAdmin) return
    try {
      const { data } = await axios.get(`/api/elections/${id}/aspirants`)
      setAllAspirants(data.aspirants || [])
    } catch {}
  }, [id, isAdmin])

  const loadResults = useCallback(async () => {
    setLoadingR(true)
    try {
      const { data } = await axios.get(`/api/elections/${id}/results`)
      setResults(data)
    } catch {} finally { setLoadingR(false) }
  }, [id])

  useEffect(() => {
    loadElection()
  }, [loadElection])

  useEffect(() => {
    if (!election) return
    // Auto-load results for admin always, or if visibility allows
    const showResults = isAdmin ||
      election.resultsVisibility === 'live' ||
      (election.resultsVisibility === 'after_close' && ['closed', 'results_published'].includes(election.status)) ||
      election.status === 'results_published'
    if (showResults) loadResults()
    if (isAdmin && adminTab === 'aspirants') loadAllAspirants()
  }, [election?.status, election?.resultsVisibility, isAdmin, adminTab])

  // Socket: live vote updates + results published
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !election) return

    const onVoteUpdate = ({ electionId, position, tally }) => {
      if (electionId !== id || election.resultsVisibility !== 'live') return
      setResults(prev => {
        if (!prev) return prev
        const updated = { ...prev, results: { ...prev.results } }
        const posResults = (updated.results[position] || []).map(c => {
          const t = tally.find(x => x._id?.toString() === c.contestant?._id?.toString())
          return t ? { ...c, votes: t.count } : c
        })
        updated.results[position] = posResults
        return updated
      })
    }

    const onPublished = ({ electionId }) => {
      if (electionId !== id) return
      setElection(prev => prev ? { ...prev, status: 'results_published' } : prev)
      loadResults()
      toast('Election results have been published!')
    }

    socket.on('vote_update', onVoteUpdate)
    socket.on('election_results_published', onPublished)
    return () => {
      socket.off('vote_update', onVoteUpdate)
      socket.off('election_results_published', onPublished)
    }
  }, [getSocket, id, election?.resultsVisibility])

  const advance = async () => {
    if (!window.confirm('Advance this election to the next stage?')) return
    setAdvancing(true)
    try {
      const { data } = await axios.put(`/api/elections/${id}/advance`)
      setElection(data.election)
      toast.success(`Moved to: ${STATUS_META[data.election.status]?.label}`)
      if (['closed', 'results_published'].includes(data.election.status)) loadResults()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setAdvancing(false) }
  }

  const submitApplication = async () => {
    if (!applyPos) return toast.error('Select a position.')
    const pos = election.positions.find(p => p.title === applyPos)
    if (pos?.formFee > 0 && !evidenceFile) return toast.error('Upload payment evidence.')
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('position', applyPos); fd.append('statement', statement.trim())
      if (evidenceFile) fd.append('paymentEvidence', evidenceFile)
      const { data } = await axios.post(`/api/elections/${id}/aspirants`, fd)
      setMyApp(data.aspirant)
      toast.success('Application submitted! You will be notified once reviewed.')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSubmitting(false) }
  }

  const submitVotes = async () => {
    const unvoted = election.positions.filter(p => !myVotedPositions.includes(p.title) && !ballot[p.title])
    if (unvoted.length > 0 && !window.confirm(`You haven't voted for: ${unvoted.map(p => p.title).join(', ')}. Submit anyway?`)) return
    setVoting(true)
    try {
      const votes = Object.entries(ballot).map(([position, contestant]) => ({ position, contestant }))
      await axios.post(`/api/elections/${id}/vote`, { votes })
      setHasVoted(true)
      setMVP(prev => [...new Set([...prev, ...votes.map(v => v.position)])])
      toast.success('Your votes have been cast!')
      if (election.resultsVisibility !== 'admin_only') loadResults()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cast votes.') }
    finally { setVoting(false) }
  }

  const reviewAspirant = async (aid, status) => {
    setReviewing(aid)
    try {
      const { data } = await axios.put(`/api/elections/${id}/aspirants/${aid}`, { status, adminNote: rejectNote[aid] || '' })
      setAllAspirants(p => p.map(a => a._id === aid ? data.aspirant : a))
      setRejectNote(r => { const n = { ...r }; delete n[aid]; return n })
      toast.success(status === 'approved' ? 'Approved!' : 'Rejected.')
    } catch { toast.error('Failed.') }
    finally { setReviewing(null) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-[#1a3c5e]" /></div>
  if (!election) return null

  const meta      = STATUS_META[election.status]
  const STATUS_NL = { draft: 'Open Form Picking', form_picking: 'Start Reviewing', reviewing: 'Open Voting', voting: 'Close Voting', closed: 'Publish Results' }
  const canSeeResults = isAdmin ||
    election.resultsVisibility === 'live' ||
    (election.resultsVisibility === 'after_close' && ['closed', 'results_published'].includes(election.status)) ||
    election.status === 'results_published'

  // Group approved aspirants by position
  const byPosition = {}
  aspirants.forEach(a => { if (!byPosition[a.position]) byPosition[a.position] = []; byPosition[a.position].push(a) })
  const selectedPos = election.positions.find(p => p.title === applyPos)

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/app/elections')} className="p-2 text-gray-500 hover:text-[#1a3c5e] transition">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.cls}`}>{meta.label}</span>
            {election.resultsVisibility === 'live' && election.status === 'voting' && (
              <span className="text-[10px] text-green-400 animate-pulse">● Live results</span>
            )}
          </div>
          <h1 className="text-[#1a3c5e] font-black text-lg leading-tight">{election.title}</h1>
          {election.description && <p className="text-gray-500 text-sm mt-0.5">{election.description}</p>}
        </div>
      </div>

      {/* Admin tabs */}
      {isAdmin && (
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {[
            { id: 'overview',  label: 'Overview' },
            { id: 'aspirants', label: `Aspirants${allAspirants.length ? ` (${allAspirants.length})` : ''}` },
            { id: 'results',   label: 'Results' },
          ].map(t => (
            <button key={t.id} onClick={() => { setAdminTab(t.id); if (t.id === 'aspirants') loadAllAspirants(); if (t.id === 'results') loadResults() }}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition -mb-px ${
                adminTab === t.id ? 'border-[#1a3c5e] text-[#1a3c5e]' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Admin: Overview ── */}
      {(isAdmin && adminTab === 'overview') && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Form Picking" start={election.formPickingStart} end={election.formPickingDeadline} />
            <InfoCard label="Voting Window" start={election.votingStart} end={election.votingDeadline} />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="text-[#1a3c5e] font-bold text-sm mb-3">Positions</h3>
            <div className="space-y-2">
              {election.positions.map(p => (
                <div key={p.title} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-gray-800 text-sm font-semibold">{p.title}</p>
                    {p.description && <p className="text-gray-500 text-xs">{p.description}</p>}
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">{Number(p.formFee) === 0 ? 'Free' : `₦${Number(p.formFee).toLocaleString()}`}</span>
                </div>
              ))}
            </div>
          </div>
          {election.votingRequirements?.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <h3 className="text-[#1a3c5e] font-bold text-sm mb-2">Voting Requirements</h3>
              <div className="space-y-1.5">
                {election.votingRequirements.map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{REQUIREMENT_LABELS[r] || r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {STATUS_NL[election.status] && (
            <button onClick={advance} disabled={advancing}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold text-sm rounded-xl transition disabled:opacity-60">
              {advancing ? <Loader2 size={14} className="animate-spin" /> : null}
              {STATUS_NL[election.status]}
            </button>
          )}
        </div>
      )}

      {/* ── Admin: Aspirants ── */}
      {(isAdmin && adminTab === 'aspirants') && (
        <div className="space-y-4">
          {allAspirants.length === 0
            ? <div className="text-center py-12"><Users size={28} className="text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">No applications yet</p></div>
            : election.positions.map(pos => {
                const posApps = allAspirants.filter(a => a.position === pos.title)
                if (!posApps.length) return null
                return (
                  <div key={pos.title} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                      <p className="text-[#1a3c5e] font-bold text-sm">{pos.title}</p>
                      <p className="text-gray-400 text-xs">{posApps.length} application{posApps.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {posApps.map(a => (
                        <div key={a._id} className="p-4">
                          <div className="flex items-start gap-3">
                            {a.applicant?.avatar
                              ? <img src={a.applicant.avatar} alt={a.applicant.fullName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                              : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                  {a.applicant?.fullName?.charAt(0)}
                                </div>
                            }
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-gray-800 font-semibold text-sm">{a.applicant?.fullName}</p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                  a.status === 'approved' ? 'bg-green-100 text-green-700' :
                                  a.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>{a.status}</span>
                              </div>
                              <p className="text-gray-500 text-xs">{a.applicant?.level ? `${a.applicant.level}L` : ''} · Applied {new Date(a.createdAt).toLocaleDateString()}</p>
                              {a.statement && <p className="text-gray-600 text-sm mt-1.5 italic">"{a.statement}"</p>}
                              {a.paymentEvidence && (
                                <a href={a.paymentEvidence} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-1 mt-1.5 text-xs text-blue-500 hover:underline">
                                  <ImageIcon size={11} /> View payment evidence
                                </a>
                              )}
                              {a.adminNote && <p className="text-gray-500 text-xs mt-1">Note: {a.adminNote}</p>}
                            </div>
                          </div>
                          {a.status === 'pending' && (
                            <div className="mt-3 space-y-2">
                              <input value={rejectNote[a._id] || ''} onChange={e => setRejectNote(r => ({ ...r, [a._id]: e.target.value }))}
                                placeholder="Rejection note (optional)" style={{ fontSize: 16 }}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:border-[#1a3c5e]/40" />
                              <div className="flex gap-2">
                                <button onClick={() => reviewAspirant(a._id, 'approved')} disabled={reviewing === a._id}
                                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 hover:bg-green-400 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                                  {reviewing === a._id ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />} Approve
                                </button>
                                <button onClick={() => reviewAspirant(a._id, 'rejected')} disabled={reviewing === a._id}
                                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500 hover:bg-red-400 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                                  <X size={13} /> Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
          }
        </div>
      )}

      {/* ── Admin: Results ── */}
      {(isAdmin && adminTab === 'results') && (
        <div>
          {loadingResults
            ? <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-amber-400" /></div>
            : results
              ? <ResultsChart results={results.results} totalVoters={results.totalVoters} positions={election.positions} />
              : <p className="text-gray-500 text-sm text-center py-10">No votes yet.</p>
          }
        </div>
      )}

      {/* ── Student views ── */}
      {!isAdmin && (
        <>
          {/* Draft */}
          {election.status === 'draft' && (
            <div className="text-center py-16">
              <Clock size={28} className="text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">This election is not yet open.</p>
            </div>
          )}

          {/* Form Picking */}
          {election.status === 'form_picking' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={15} className="text-[#1a3c5e]" />
                  <h2 className="text-[#1a3c5e] font-bold">Pick a Form</h2>
                </div>
                <p className="text-gray-500 text-sm mb-1">Form picking closes: <span className="font-semibold text-gray-700">{fmtDate(election.formPickingDeadline)}</span></p>
                {election.votingRequirements?.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl text-sm">
                    <p className="text-blue-700 font-semibold text-xs mb-1.5">Voting requirements (must have to vote):</p>
                    {election.votingRequirements.map(r => <p key={r} className="text-blue-600 text-xs">• {REQUIREMENT_LABELS[r]}</p>)}
                  </div>
                )}
              </div>

              {myApp ? (
                <div className="rounded-2xl border p-4" style={{
                  borderColor: myApp.status === 'approved' ? '#22c55e50' : myApp.status === 'rejected' ? '#ef444450' : '#f59e0b50',
                  background: myApp.status === 'approved' ? '#22c55e08' : myApp.status === 'rejected' ? '#ef444408' : '#f59e0b08',
                }}>
                  <div className="flex items-start gap-2">
                    {myApp.status === 'approved' ? <CheckCircle2 size={16} className="text-green-500 mt-0.5" /> :
                     myApp.status === 'rejected' ? <X size={16} className="text-red-400 mt-0.5" /> :
                     <Clock size={16} className="text-amber-400 mt-0.5" />}
                    <div>
                      <p className={`font-bold text-sm ${myApp.status === 'approved' ? 'text-green-600' : myApp.status === 'rejected' ? 'text-red-500' : 'text-amber-600'}`}>
                        {myApp.status === 'approved' ? 'Application Approved 🎉' :
                         myApp.status === 'rejected' ? 'Application Not Approved' :
                         'Application Under Review'}
                      </p>
                      <p className="text-gray-500 text-sm">Position: <span className="font-semibold">{myApp.position}</span></p>
                      {myApp.adminNote && <p className="text-gray-500 text-sm mt-1">Note: {myApp.adminNote}</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
                  <h3 className="text-gray-800 font-bold text-sm">Submit Application</h3>
                  <div>
                    <label className="text-gray-500 text-xs font-semibold mb-1.5 block">Choose Position *</label>
                    <select value={applyPos} onChange={e => setApplyPos(e.target.value)}
                      style={{ fontSize: 16 }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 focus:outline-none focus:border-[#1a3c5e]/40">
                      <option value="">— Select a position —</option>
                      {election.positions.map(p => (
                        <option key={p.title} value={p.title}>{p.title}{Number(p.formFee) > 0 ? ` (₦${Number(p.formFee).toLocaleString()})` : ' (Free)'}</option>
                      ))}
                    </select>
                  </div>
                  {applyPos && selectedPos && Number(selectedPos.formFee) > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                      <p className="text-amber-800 font-bold mb-1">Form Fee: ₦{Number(selectedPos.formFee).toLocaleString()}</p>
                      {election.bankName && <p className="text-amber-700 text-xs">Bank: {election.bankName}</p>}
                      {election.accountNumber && <p className="text-amber-700 text-xs">Account: {election.accountNumber}</p>}
                      {election.accountName && <p className="text-amber-700 text-xs">Name: {election.accountName}</p>}
                      {election.paymentNote && <p className="text-amber-700 text-xs mt-1">{election.paymentNote}</p>}
                    </div>
                  )}
                  <div>
                    <label className="text-gray-500 text-xs font-semibold mb-1.5 block">Manifesto / Statement <span className="text-gray-400 font-normal">(max 300 chars)</span></label>
                    <textarea value={statement} onChange={e => setStatement(e.target.value.slice(0, 300))} rows={3}
                      placeholder="Why should members vote for you? What will you do for the association?"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:border-[#1a3c5e]/40 resize-none" />
                    <p className="text-gray-400 text-xs text-right mt-0.5">{statement.length}/300</p>
                  </div>
                  {applyPos && selectedPos && Number(selectedPos.formFee) > 0 && (
                    <div>
                      <label className="text-gray-500 text-xs font-semibold mb-1.5 block">Payment Evidence *</label>
                      {evidencePreview
                        ? <div className="relative inline-block">
                            <img src={evidencePreview} alt="Evidence" className="max-h-36 rounded-xl object-cover border border-gray-200" />
                            <button onClick={() => { setEvidFile(null); setEvidPrev('') }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                              <X size={10} />
                            </button>
                          </div>
                        : <label className="flex flex-col items-center gap-2 py-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1a3c5e]/30 transition">
                            <ImageIcon size={20} className="text-gray-400" />
                            <span className="text-gray-500 text-sm">Tap to upload screenshot</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => {
                              const f = e.target.files?.[0]; if (!f) return
                              setEvidFile(f); setEvidPrev(URL.createObjectURL(f)); e.target.value = ''
                            }} />
                          </label>
                      }
                    </div>
                  )}
                  <button onClick={submitApplication} disabled={submitting || !applyPos}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold text-sm rounded-xl transition disabled:opacity-50">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                    Submit Application
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reviewing */}
          {election.status === 'reviewing' && (
            <div className="text-center py-16">
              <Shield size={28} className="text-yellow-500 mx-auto mb-3" />
              <p className="text-gray-700 font-bold">Applications are being reviewed</p>
              <p className="text-gray-500 text-sm mt-1">You will be notified once a decision is made.</p>
              {myApp && (
                <div className="mt-4 inline-block">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                    myApp.status === 'approved' ? 'bg-green-100 text-green-700' :
                    myApp.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>Your application for {myApp.position}: {myApp.status}</span>
                </div>
              )}
            </div>
          )}

          {/* Voting */}
          {election.status === 'voting' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Vote size={15} className="text-green-500" />
                  <h2 className="text-[#1a3c5e] font-bold">Cast Your Vote</h2>
                </div>
                <p className="text-gray-500 text-sm">Voting closes: <span className="font-semibold text-gray-700">{fmtDate(election.votingDeadline)}</span></p>
                {election.votingRequirements?.length > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-xl">
                    <p className="text-blue-600 text-xs font-semibold mb-1">Requirements:</p>
                    {election.votingRequirements.map(r => <p key={r} className="text-blue-600 text-xs">• {REQUIREMENT_LABELS[r]}</p>)}
                  </div>
                )}
              </div>

              {hasVoted && myVotedPositions.length === election.positions.length ? (
                <div className="text-center py-10">
                  <CheckCircle2 size={28} className="text-green-500 mx-auto mb-3" />
                  <p className="text-gray-700 font-bold">You have voted!</p>
                  <p className="text-gray-500 text-sm mt-1">Your votes have been recorded anonymously.</p>
                  {canSeeResults && results && (
                    <div className="mt-6 text-left">
                      <h3 className="text-[#1a3c5e] font-bold mb-4">Live Results</h3>
                      <ResultsChart results={results.results} totalVoters={results.totalVoters} positions={election.positions} />
                    </div>
                  )}
                  {election.resultsVisibility === 'admin_only' && (
                    <p className="text-gray-400 text-sm mt-4">Results will be announced by the admin.</p>
                  )}
                </div>
              ) : (
                <>
                  {election.positions.map(pos => {
                    const contestants = byPosition[pos.title] || []
                    const alreadyVoted = myVotedPositions.includes(pos.title)
                    return (
                      <div key={pos.title} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                          <p className="text-[#1a3c5e] font-bold text-sm">{pos.title}</p>
                          {alreadyVoted && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 size={11} /> Voted</span>}
                        </div>
                        {contestants.length === 0 ? (
                          <p className="px-4 py-4 text-gray-400 text-sm">No approved contestants for this position.</p>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {contestants.map(a => {
                              const selected = ballot[pos.title] === a.applicant._id
                              return (
                                <label key={a._id} className={`flex items-start gap-3 p-4 cursor-pointer transition ${selected ? 'bg-[#1a3c5e]/5' : 'hover:bg-gray-50'} ${alreadyVoted ? 'pointer-events-none opacity-60' : ''}`}>
                                  <div onClick={() => !alreadyVoted && setBallot(b => ({ ...b, [pos.title]: a.applicant._id }))}
                                    className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                                      selected ? 'border-[#1a3c5e]' : 'border-gray-300'
                                    }`}>
                                    {selected && <div className="w-2 h-2 rounded-full bg-[#1a3c5e]" />}
                                  </div>
                                  {a.applicant.avatar
                                    ? <img src={a.applicant.avatar} alt={a.applicant.fullName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                                    : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        {a.applicant.fullName?.charAt(0)}
                                      </div>
                                  }
                                  <div className="flex-1 min-w-0" onClick={() => !alreadyVoted && setBallot(b => ({ ...b, [pos.title]: a.applicant._id }))}>
                                    <p className="text-gray-800 font-semibold text-sm">{a.applicant.fullName}</p>
                                    <p className="text-gray-500 text-xs">{a.applicant.level ? `${a.applicant.level}L` : ''}</p>
                                    {a.statement && <p className="text-gray-600 text-sm mt-1 italic">"{a.statement}"</p>}
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {Object.keys(ballot).length > 0 && (
                    <button onClick={submitVotes} disabled={voting}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-400 text-white font-bold text-sm rounded-xl transition disabled:opacity-60 sticky bottom-4 shadow-lg">
                      {voting ? <Loader2 size={14} className="animate-spin" /> : <Vote size={14} />}
                      Submit {Object.keys(ballot).length} Vote{Object.keys(ballot).length !== 1 ? 's' : ''}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Closed / Results Published */}
          {['closed', 'results_published'].includes(election.status) && (
            <div className="space-y-4">
              {canSeeResults ? (
                <>
                  {loadingResults
                    ? <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-amber-400" /></div>
                    : results
                      ? <ResultsChart results={results.results} totalVoters={results.totalVoters} positions={election.positions} />
                      : <p className="text-gray-500 text-sm text-center py-10">No results yet.</p>
                  }
                </>
              ) : (
                <div className="text-center py-16">
                  <BarChart3 size={28} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-bold">Results pending announcement</p>
                  <p className="text-gray-500 text-sm mt-1">The admin will announce the results shortly.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Small info card helper
function InfoCard({ label, start, end }) {
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3">
      <p className="text-gray-500 text-xs font-semibold mb-1.5">{label}</p>
      <p className="text-gray-600 text-xs">Opens: <span className="text-gray-800 font-semibold">{fmt(start)}</span></p>
      <p className="text-gray-600 text-xs mt-0.5">Closes: <span className="text-gray-800 font-semibold">{fmt(end)}</span></p>
    </div>
  )
}
