import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  ArrowLeft, Loader2, Users, Crown, Shield, CheckCircle2, Clock,
  X, Check, ChevronDown, ChevronUp, Link2, Copy, Image as ImageIcon,
  Video, Globe, Lock, Trash2, Plus, ExternalLink, Mail, Phone,
  Edit2, Save, AlertCircle, Play,
} from 'lucide-react'

const PLAN_LIMITS = {
  free:      { images: 2, videos: 0, label: 'Free' },
  premium:   { images: 10, videos: 3, label: 'Premium' },
  unlimited: { images: Infinity, videos: Infinity, label: 'Unlimited' },
}

// ── Embed/media renderer ──────────────────────────────────────────────────
function MediaItem({ item }) {
  const isYT = item.url?.includes('youtube.com') || item.url?.includes('youtu.be')
  const embedUrl = isYT
    ? item.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
    : null

  if (item.kind === 'embed' || (item.kind === 'video' && isYT)) {
    return (
      <div className="rounded-2xl overflow-hidden border border-gray-200">
        <div className="aspect-video">
          <iframe src={embedUrl || item.url} className="w-full h-full" allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
        </div>
        {item.caption && <p className="px-3 py-2 text-gray-500 text-xs">{item.caption}</p>}
      </div>
    )
  }
  if (item.kind === 'video') {
    return (
      <div className="rounded-2xl overflow-hidden border border-gray-200">
        <video src={item.url} controls className="w-full" />
        {item.caption && <p className="px-3 py-2 text-gray-500 text-xs">{item.caption}</p>}
      </div>
    )
  }
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200">
      <img src={item.url} alt={item.caption || ''} className="w-full object-cover max-h-96" />
      {item.caption && <p className="px-3 py-2 text-gray-500 text-xs">{item.caption}</p>}
    </div>
  )
}

export default function CommunityDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const isAdmin   = user?.isStaffAdmin || user?.isStudentAdmin || user?.accountType === 'staff'

  const [community, setCommunity]   = useState(null)
  const [membership, setMembership] = useState(null)
  const [memberCount, setMemberCount] = useState(0)
  const [isManager, setIsManager]   = useState(false)
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('info') // info | onboarding | join | members | settings

  // Onboarding flow
  const [onbStep, setOnbStep]           = useState('media') // media | questions | done
  const [answers, setAnswers]           = useState({})
  const [joinMessage, setJoinMessage]   = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [onbResult, setOnbResult]       = useState(null) // null | { passed, wrongQuestions }

  // Members management
  const [members, setMembers]       = useState([])
  const [loadingMembers, setLM]     = useState(false)
  const [reviewNote, setReviewNote] = useState({})
  const [reviewing, setReviewing]   = useState(null)

  // Settings / edit
  const [editMode, setEditMode]         = useState(false)
  const [editData, setEditData]         = useState({})
  const [savingSettings, setSavingS]    = useState(false)
  const [newInfoMediaUrl, setNewIMUrl]  = useState('')
  const [newOnbMediaUrl, setNewOMUrl]   = useState('')
  const [infoMediaFiles, setIMFiles]    = useState([])
  const [onbMediaFiles, setOMFiles]     = useState([])
  const [newQuestion, setNewQuestion]   = useState({ text: '', type: 'free_text', options: ['', ''], correctAnswer: '', required: true })
  const [addingQ, setAddingQ]           = useState(false)
  const infoFileRef = useRef()
  const onbFileRef  = useRef()

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/communities/${id}`)
      setCommunity(data.community)
      setMembership(data.membership)
      setMemberCount(data.memberCount)
      setIsManager(data.isManager)
      setEditData({
        name: data.community.name,
        description: data.community.description,
        type: data.community.type,
        joinMode: data.community.joinMode,
        prerequisites: data.community.prerequisites?.length ? data.community.prerequisites : [''],
        groupChatLink: data.community.groupChatLink || '',
        infoNotes: data.community.infoNotes || '',
        founderProfile: data.community.founderProfile || {},
        onboarding: data.community.onboarding || { enabled: false, notes: '', questions: [], passingScore: 0, feedbackMode: 'just_fail' },
        infoMedia: data.community.infoMedia || [],
      })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load.'); navigate('/app/communities') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const loadMembers = async () => {
    setLM(true)
    try {
      const { data } = await axios.get(`/api/communities/${id}/members`)
      setMembers(data.members || [])
    } catch { toast.error('Failed to load members.') }
    finally { setLM(false) }
  }

  useEffect(() => {
    if (tab === 'members' && (isManager || isAdmin)) loadMembers()
  }, [tab])

  // ── Submit join / onboarding ──────────────────────────────────────────
  const submitJoin = async () => {
    setSubmitting(true)
    try {
      const onboardingAnswers = community.onboarding?.enabled
        ? community.onboarding.questions.map(q => ({
            questionId: q._id,
            question: q.text,
            answer: answers[q._id] || '',
          }))
        : []

      const { data } = await axios.post(`/api/communities/${id}/join`, {
        joinMessage,
        onboardingAnswers,
      })
      setMembership(data.member)
      if (data.autoApproved) {
        toast.success('You are now a member!')
        setMemberCount(c => c + 1)
      } else {
        toast.success('Application submitted! You will be notified when reviewed.')
      }
      setTab('info')
    } catch (err) {
      const e = err.response?.data
      if (e?.score !== undefined) {
        setOnbResult({
          passed: false,
          score: e.score,
          passing: e.passing,
          feedbackMode: e.feedbackMode,
          wrongQuestions: e.wrongQuestions,
        })
      } else {
        toast.error(e?.message || 'Failed to submit.')
      }
    }
    finally { setSubmitting(false) }
  }

  // ── Manager: approve/reject member ───────────────────────────────────
  const reviewMember = async (memberId, userId, status) => {
    setReviewing(memberId)
    try {
      const { data } = await axios.put(`/api/communities/${id}/members/${userId}`, {
        status, adminNote: reviewNote[memberId] || '',
      })
      setMembers(p => p.map(m => m._id === memberId ? data.member : m))
      if (status === 'approved') setMemberCount(c => c + 1)
      toast.success(status === 'approved' ? 'Approved!' : 'Rejected.')
    } catch { toast.error('Failed.') }
    finally { setReviewing(null) }
  }

  // ── Manager: remove member ────────────────────────────────────────────
  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return
    try {
      await axios.delete(`/api/communities/${id}/members/${userId}`)
      setMembers(p => p.filter(m => m.user._id !== userId))
      setMemberCount(c => Math.max(0, c - 1))
      toast.success('Member removed.')
    } catch { toast.error('Failed.') }
  }

  // ── Settings save ──────────────────────────────────────────────────────
  const saveSettings = async () => {
    setSavingS(true)
    try {
      const fd = new FormData()
      const body = {
        ...editData,
        prerequisites: editData.prerequisites?.filter(p => p.trim()),
        infoMedia: editData.infoMedia || [],
      }
      fd.append('data', JSON.stringify(body))
      infoMediaFiles.forEach(f => fd.append('infoMedia', f))
      onbMediaFiles.forEach(f => fd.append('onboardingMedia', f))

      const { data } = await axios.put(`/api/communities/${id}`, fd)
      setCommunity(data.community)
      setIMFiles([]); setOMFiles([])
      setNewIMUrl(''); setNewOMUrl('')
      setEditMode(false)
      toast.success('Saved!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save.') }
    finally { setSavingS(false) }
  }

  // Admin: approve/reject community
  const approveCommunity = async (status) => {
    try {
      const { data } = await axios.put(`/api/communities/${id}`, { data: JSON.stringify({ status }) })
      setCommunity(data.community)
      toast.success(status === 'active' ? 'Community approved!' : 'Community suspended.')
    } catch { toast.error('Failed.') }
  }

  const setED = (k, v) => setEditData(d => ({ ...d, [k]: v }))
  const setFP = (k, v) => setEditData(d => ({ ...d, founderProfile: { ...(d.founderProfile || {}), [k]: v } }))
  const setFPC = (k, v) => setEditData(d => ({ ...d, founderProfile: { ...(d.founderProfile || {}), contact: { ...(d.founderProfile?.contact || {}), [k]: v } } }))
  const setONB = (k, v) => setEditData(d => ({ ...d, onboarding: { ...(d.onboarding || {}), [k]: v } }))

  const addInfoMediaEmbed = () => {
    if (!newInfoMediaUrl.trim()) return
    setEditData(d => ({ ...d, infoMedia: [...(d.infoMedia || []), { kind: 'embed', url: newInfoMediaUrl.trim(), caption: '', order: 999 }] }))
    setNewIMUrl('')
  }
  const addOnbMediaEmbed = () => {
    if (!newOnbMediaUrl.trim()) return
    setONB('media', [...(editData.onboarding?.media || []), { kind: 'embed', url: newOnbMediaUrl.trim(), caption: '', order: 999 }])
    setNewOMUrl('')
  }
  const removeInfoMedia = (i) => setEditData(d => ({ ...d, infoMedia: d.infoMedia.filter((_, j) => j !== i) }))
  const removeOnbMedia  = (i) => setONB('media', (editData.onboarding?.media || []).filter((_, j) => j !== i))

  const addQuestion = () => {
    if (!newQuestion.text.trim()) return toast.error('Question text required.')
    const q = { ...newQuestion, _id: Date.now().toString(), options: newQuestion.type === 'mcq' ? newQuestion.options.filter(o => o.trim()) : [] }
    setONB('questions', [...(editData.onboarding?.questions || []), q])
    setNewQuestion({ text: '', type: 'free_text', options: ['', ''], correctAnswer: '', required: true })
    setAddingQ(false)
  }
  const removeQuestion = (i) => setONB('questions', (editData.onboarding?.questions || []).filter((_, j) => j !== i))

  const limits = PLAN_LIMITS[community?.plan || 'free']

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-[#1a3c5e]" /></div>
  if (!community) return null

  const canManage    = isManager || isAdmin
  const isMember     = membership?.status === 'approved'
  const isPending    = membership?.status === 'pending'
  const hasOnboarding = community.onboarding?.enabled && community.onboarding?.questions?.length > 0
  const fp = community.founderProfile || {}

  // Tabs available
  const tabs = [
    { id: 'info',       label: 'Info' },
    ...(isMember || canManage ? [{ id: 'join',  label: 'Group Chat' }] : []),
    ...(!isMember && !isPending && community.status === 'active' ? [{ id: 'join', label: hasOnboarding ? 'Onboarding & Apply' : 'Apply' }] : []),
    ...(canManage ? [{ id: 'members',  label: 'Members' }, { id: 'settings', label: 'Settings' }] : []),
  ]

  // deduplicate tabs by id
  const uniqueTabs = tabs.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i)

  const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1a3c5e]/40'

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {/* Header */}
      <div className="relative mb-5">
        <button onClick={() => navigate('/app/communities')} className="absolute top-0 left-0 z-10 p-2 text-gray-500 hover:text-[#1a3c5e] transition">
          <ArrowLeft size={18} />
        </button>
        {community.coverImage
          ? <div className="h-40 rounded-2xl overflow-hidden">
              <img src={community.coverImage} alt={community.name} className="w-full h-full object-cover" />
            </div>
          : <div className="h-24 rounded-2xl bg-gradient-to-r from-[#060d1a] to-[#1a3c5e]" />
        }
        <div className="px-1 mt-3">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${community.type === 'club' ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-blue-600 bg-blue-50 border-blue-200'}`}>{community.type}</span>
            {community.status !== 'active' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600">{community.status}</span>}
            {community.plan !== 'free' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">{PLAN_LIMITS[community.plan].label}</span>}
          </div>
          <h1 className="text-[#1a3c5e] font-black text-xl">{community.name}</h1>
          <p className="text-gray-400 text-xs mt-0.5">{memberCount} member{memberCount !== 1 ? 's' : ''} · {community.joinMode === 'open' ? 'Open join' : 'Approval required'}</p>
        </div>
      </div>

      {/* Admin approval banner */}
      {isAdmin && community.status === 'pending' && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-3">
          <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-yellow-800 font-bold text-sm">Pending Approval</p>
            <p className="text-yellow-700 text-xs mt-0.5">Submitted by {community.founder?.fullName}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => approveCommunity('active')} className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-400 transition">Approve</button>
            <button onClick={() => approveCommunity('suspended')} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-400 transition">Reject</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5 overflow-x-auto">
        {uniqueTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition -mb-px whitespace-nowrap ${tab === t.id ? 'border-[#1a3c5e] text-[#1a3c5e]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Info tab ── */}
      {tab === 'info' && (
        <div className="space-y-5">
          {community.description && <p className="text-gray-600">{community.description}</p>}

          {/* Prerequisites */}
          {community.prerequisites?.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-[#1a3c5e] font-bold text-sm mb-3">Prerequisites to Join</h3>
              <div className="space-y-2">
                {community.prerequisites.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-[#1a3c5e] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info media */}
          {community.infoMedia?.length > 0 && (
            <div className="space-y-3">
              {community.infoMedia.sort((a, b) => a.order - b.order).map((item, i) => (
                <MediaItem key={i} item={item} />
              ))}
            </div>
          )}

          {/* Info notes */}
          {community.infoNotes && (
            <div className="rounded-2xl border border-gray-200 p-4">
              <h3 className="text-[#1a3c5e] font-bold text-sm mb-3">About This Community</h3>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{community.infoNotes}</p>
            </div>
          )}

          {/* Founder profile */}
          {(fp.displayName || fp.about || fp.vision) && (
            <div className="rounded-2xl border border-gray-200 p-4">
              <h3 className="text-[#1a3c5e] font-bold text-sm mb-4 flex items-center gap-2"><Crown size={13} className="text-amber-500" /> Founder</h3>
              <div className="flex items-start gap-3">
                {fp.avatar
                  ? <img src={fp.avatar} alt={fp.displayName} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center text-white font-bold flex-shrink-0">
                      {(fp.displayName || community.founder?.fullName || '?').charAt(0)}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-bold">{fp.displayName || community.founder?.fullName}</p>
                  {fp.about && <p className="text-gray-500 text-sm mt-1">{fp.about}</p>}
                  {fp.vision && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-xl">
                      <p className="text-blue-700 text-xs font-semibold mb-1">Vision</p>
                      <p className="text-blue-600 text-sm">{fp.vision}</p>
                    </div>
                  )}
                  {/* Contact info */}
                  {(fp.contact?.whatsapp || fp.contact?.email || fp.contact?.twitter || fp.contact?.instagram || fp.contact?.other) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {fp.contact?.whatsapp && <a href={`https://wa.me/${fp.contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-green-600 hover:underline"><Phone size={11} /> WhatsApp</a>}
                      {fp.contact?.email && <a href={`mailto:${fp.contact.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Mail size={11} /> Email</a>}
                      {fp.contact?.twitter && <a href={`https://twitter.com/${fp.contact.twitter.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-sky-500 hover:underline"><ExternalLink size={11} /> Twitter</a>}
                      {fp.contact?.instagram && <a href={`https://instagram.com/${fp.contact.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-pink-500 hover:underline"><ExternalLink size={11} /> Instagram</a>}
                      {fp.contact?.other && <a href={fp.contact.other} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-gray-600 hover:underline"><ExternalLink size={11} /> Contact</a>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Join CTA for non-members */}
          {!isMember && !isPending && community.status === 'active' && (
            <button onClick={() => setTab('join')}
              className="w-full py-3 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold text-sm rounded-xl transition">
              {hasOnboarding ? 'Start Onboarding & Apply' : (community.joinMode === 'open' ? 'Join Now' : 'Apply to Join')}
            </button>
          )}
          {isPending && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center gap-2">
              <Clock size={15} className="text-yellow-600" />
              <p className="text-yellow-700 text-sm font-semibold">Your application is under review.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Join / Group Chat tab ── */}
      {tab === 'join' && (
        <div className="space-y-5">
          {/* Member: show group chat link */}
          {(isMember || canManage) && (
            <div>
              {community.groupChatLink ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <h3 className="text-green-800 font-bold text-sm mb-2 flex items-center gap-2"><Link2 size={13} /> Group Chat</h3>
                  <p className="text-green-700 text-xs mb-3">You're a member! Click below to join the group chat.</p>
                  <a href={community.groupChatLink} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-400 text-white font-bold text-sm rounded-xl transition">
                    <ExternalLink size={13} /> Join Group Chat
                  </a>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center">
                  <Link2 size={22} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm font-semibold">No group chat link set yet</p>
                  {canManage && <p className="text-gray-400 text-xs mt-1">Add one in Settings</p>}
                </div>
              )}
            </div>
          )}

          {/* Non-member: onboarding + apply */}
          {!isMember && !isPending && community.status === 'active' && (
            <>
              {/* Onboarding failed result */}
              {onbResult && !onbResult.passed && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <p className="text-red-700 font-bold text-sm mb-1">You didn't pass the assessment</p>
                  <p className="text-red-600 text-sm">{onbResult.score}/{onbResult.passing} correct answers needed.</p>
                  {onbResult.feedbackMode === 'show_wrong' && onbResult.wrongQuestions && (
                    <div className="mt-2 space-y-1">
                      {community.onboarding.questions.filter(q => q.type === 'mcq').map(q => {
                        const r = onbResult.wrongQuestions?.find(w => w.questionId?.toString() === q._id?.toString())
                        return r ? (
                          <div key={q._id} className={`flex items-center gap-2 text-xs ${r.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {r.passed ? <Check size={11} /> : <X size={11} />} {q.text}
                          </div>
                        ) : null
                      })}
                    </div>
                  )}
                  <button onClick={() => { setOnbResult(null); setOnbStep('media'); setAnswers({}) }}
                    className="mt-3 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-xl hover:bg-red-200 transition">
                    Review & Retry
                  </button>
                </div>
              )}

              {/* Onboarding: media + notes */}
              {!onbResult && hasOnboarding && onbStep === 'media' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-blue-700 text-xs font-semibold">Complete the onboarding below before applying. Make sure you watch all videos and read all notes.</p>
                  </div>
                  {community.onboarding.media?.map((item, i) => <MediaItem key={i} item={item} />)}
                  {community.onboarding.notes && (
                    <div className="rounded-2xl border border-gray-200 p-4">
                      <h3 className="text-[#1a3c5e] font-bold text-sm mb-2">Reading Material</h3>
                      <p className="text-gray-600 text-sm whitespace-pre-wrap">{community.onboarding.notes}</p>
                    </div>
                  )}
                  <button onClick={() => setOnbStep('questions')}
                    className="w-full py-3 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold text-sm rounded-xl transition">
                    I've Watched & Read Everything → Take Assessment
                  </button>
                </div>
              )}

              {/* Onboarding: questions */}
              {!onbResult && (hasOnboarding ? onbStep === 'questions' : true) && (
                <div className="space-y-5">
                  {hasOnboarding && (
                    <>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-amber-700 text-xs font-semibold">Answer all questions honestly. {community.onboarding.passingScore > 0 ? `You need ${community.onboarding.passingScore} correct MCQ answer${community.onboarding.passingScore !== 1 ? 's' : ''} to proceed.` : ''}</p>
                      </div>
                      {community.onboarding.questions.map((q, i) => (
                        <div key={q._id} className="rounded-2xl border border-gray-200 bg-white p-4">
                          <p className="text-gray-800 font-semibold text-sm mb-3">{i + 1}. {q.text}{q.required && <span className="text-red-400 ml-1">*</span>}</p>
                          {q.type === 'free_text' ? (
                            <textarea value={answers[q._id] || ''} onChange={e => setAnswers(a => ({ ...a, [q._id]: e.target.value }))}
                              rows={3} placeholder="Your answer..."
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 text-sm focus:outline-none focus:border-[#1a3c5e]/40 resize-none" />
                          ) : (
                            <div className="space-y-2">
                              {q.options.map((opt, oi) => (
                                <div key={oi} onClick={() => setAnswers(a => ({ ...a, [q._id]: opt }))}
                                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${answers[q._id] === opt ? 'border-[#1a3c5e] bg-[#1a3c5e]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${answers[q._id] === opt ? 'border-[#1a3c5e]' : 'border-gray-300'}`}>
                                    {answers[q._id] === opt && <div className="w-2 h-2 rounded-full bg-[#1a3c5e]" />}
                                  </div>
                                  <span className="text-gray-700 text-sm">{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  <div className="rounded-2xl border border-gray-200 p-4">
                    <label className="text-gray-500 text-xs font-semibold mb-2 block">Why do you want to join? <span className="text-gray-400 font-normal">(optional)</span></label>
                    <textarea value={joinMessage} onChange={e => setJoinMessage(e.target.value)} rows={3}
                      placeholder="Tell the founder why you want to be part of this community..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 text-sm focus:outline-none focus:border-[#1a3c5e]/40 resize-none" />
                  </div>

                  <button onClick={submitJoin} disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#1a3c5e] hover:bg-[#1a3c5e]/80 text-white font-bold text-sm rounded-xl transition disabled:opacity-60">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {community.joinMode === 'open' ? 'Join Now' : 'Submit Application'}
                  </button>
                </div>
              )}

              {isPending && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center gap-2">
                  <Clock size={15} className="text-yellow-600" />
                  <p className="text-yellow-700 text-sm font-semibold">Your application is under review.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Members tab ── */}
      {tab === 'members' && canManage && (
        <div className="space-y-3">
          {loadingMembers
            ? <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-[#1a3c5e]" /></div>
            : members.length === 0
              ? <div className="text-center py-12"><Users size={24} className="text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">No members yet</p></div>
              : ['pending', 'approved', 'rejected'].map(st => {
                  const group = members.filter(m => m.status === st)
                  if (!group.length) return null
                  return (
                    <div key={st}>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${st === 'pending' ? 'text-yellow-600' : st === 'approved' ? 'text-green-600' : 'text-red-500'}`}>
                        {st} ({group.length})
                      </p>
                      <div className="space-y-2">
                        {group.map(m => (
                          <div key={m._id} className="rounded-2xl border border-gray-200 bg-white p-4">
                            <div className="flex items-start gap-3">
                              {m.user.avatar
                                ? <img src={m.user.avatar} alt={m.user.fullName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                                : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {m.user.fullName?.charAt(0)}
                                  </div>
                              }
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-800 font-semibold text-sm">{m.user.fullName}</p>
                                <p className="text-gray-400 text-xs">{m.user.level ? `${m.user.level}L` : ''} · Applied {new Date(m.createdAt).toLocaleDateString()}</p>
                                {m.joinMessage && <p className="text-gray-600 text-sm mt-1 italic">"{m.joinMessage}"</p>}
                                {m.onboardingCompleted && m.onboardingAnswers?.length > 0 && (
                                  <details className="mt-2">
                                    <summary className="text-[#1a3c5e] text-xs font-semibold cursor-pointer">View onboarding answers ({m.onboardingScore} correct)</summary>
                                    <div className="mt-2 space-y-2">
                                      {m.onboardingAnswers.map((a, i) => (
                                        <div key={i} className="text-xs bg-gray-50 rounded-xl p-2">
                                          <p className="text-gray-500 font-semibold">{a.question}</p>
                                          <p className="text-gray-700 mt-0.5">{a.answer || '(no answer)'}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                )}
                              </div>
                              {st === 'approved' && (
                                <button onClick={() => removeMember(m.user._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition flex-shrink-0">
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                            {st === 'pending' && (
                              <div className="mt-3 space-y-2">
                                <input value={reviewNote[m._id] || ''} onChange={e => setReviewNote(r => ({ ...r, [m._id]: e.target.value }))}
                                  placeholder="Rejection note (optional)" style={{ fontSize: 16 }}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 text-sm focus:outline-none" />
                                <div className="flex gap-2">
                                  <button onClick={() => reviewMember(m._id, m.user._id, 'approved')} disabled={reviewing === m._id}
                                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 hover:bg-green-400 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                                    {reviewing === m._id ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />} Approve
                                  </button>
                                  <button onClick={() => reviewMember(m._id, m.user._id, 'rejected')} disabled={reviewing === m._id}
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

      {/* ── Settings tab ── */}
      {tab === 'settings' && canManage && (
        <div className="space-y-6">
          {/* Plan info */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-800 font-bold text-sm">Plan: {PLAN_LIMITS[community.plan].label}</p>
              <p className="text-gray-500 text-xs">
                {community.plan === 'free'
                  ? `${limits.images} images max, no video uploads (YouTube/Vimeo embeds are always free)`
                  : community.plan === 'premium'
                  ? `${limits.images} images, ${limits.videos} videos`
                  : 'Unlimited uploads'}
              </p>
            </div>
            {community.plan === 'free' && !community.upgradeRequested && (
              <button onClick={async () => {
                await axios.put(`/api/communities/${id}`, { data: JSON.stringify({ upgradeRequested: true }) })
                setCommunity(c => ({ ...c, upgradeRequested: true }))
                toast.success('Upgrade request sent to admin!')
              }} className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#060d1a] text-xs font-bold rounded-xl transition">
                Request Upgrade
              </button>
            )}
            {community.upgradeRequested && community.plan === 'free' && (
              <span className="text-xs text-amber-600 font-bold">Upgrade requested ✓</span>
            )}
            {isAdmin && (
              <select value={community.plan} onChange={async e => {
                await axios.put(`/api/communities/${id}`, { data: JSON.stringify({ plan: e.target.value }) })
                setCommunity(c => ({ ...c, plan: e.target.value, upgradeRequested: false }))
                toast.success('Plan updated.')
              }} style={{ fontSize: 16 }} className="ml-2 bg-white border border-gray-200 rounded-xl px-2 py-1 text-sm text-gray-700">
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="unlimited">Unlimited</option>
              </select>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-800 font-bold">Edit Community</h3>
              {!editMode
                ? <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3c5e]/8 text-[#1a3c5e] text-xs font-bold rounded-xl hover:bg-[#1a3c5e]/15 transition"><Edit2 size={11} /> Edit</button>
                : <div className="flex gap-2">
                    <button onClick={() => setEditMode(false)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition">Cancel</button>
                    <button onClick={saveSettings} disabled={savingSettings} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3c5e] text-white text-xs font-bold rounded-xl hover:bg-[#1a3c5e]/80 transition disabled:opacity-60">
                      {savingSettings ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Save
                    </button>
                  </div>
              }
            </div>

            {editMode && (
              <div className="space-y-5">
                {/* Basic */}
                <div className="space-y-3 rounded-2xl border border-gray-200 p-4">
                  <h4 className="text-gray-600 font-bold text-xs uppercase tracking-wider">Basic Info</h4>
                  <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Name</label><input value={editData.name} onChange={e => setED('name', e.target.value)} style={{ fontSize: 16 }} className={inputCls} /></div>
                  <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Description</label><textarea value={editData.description} onChange={e => setED('description', e.target.value)} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-[#1a3c5e]/40 resize-none" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-500 text-xs font-semibold mb-1 block">Type</label>
                      <select value={editData.type} onChange={e => setED('type', e.target.value)} style={{ fontSize: 16 }} className={inputCls}>
                        <option value="community">Community</option><option value="club">Club</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-semibold mb-1 block">Join Mode</label>
                      <select value={editData.joinMode} onChange={e => setED('joinMode', e.target.value)} style={{ fontSize: 16 }} className={inputCls}>
                        <option value="open">Open</option><option value="approval">Approval</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs font-semibold mb-1 block">Group Chat Link</label>
                    <input value={editData.groupChatLink} onChange={e => setED('groupChatLink', e.target.value)} placeholder="Paste Let's Talk invite link" style={{ fontSize: 16 }} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs font-semibold mb-2 block">Prerequisites</label>
                    {(editData.prerequisites || ['']).map((p, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input value={p} onChange={e => setED('prerequisites', (editData.prerequisites || []).map((x, j) => j === i ? e.target.value : x))} style={{ fontSize: 16 }} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                        <button onClick={() => setED('prerequisites', (editData.prerequisites || []).filter((_, j) => j !== i))} className="p-2 text-gray-400 hover:text-red-500"><X size={13} /></button>
                      </div>
                    ))}
                    <button onClick={() => setED('prerequisites', [...(editData.prerequisites || []), ''])} className="text-xs text-[#1a3c5e] flex items-center gap-1"><Plus size={11} /> Add prerequisite</button>
                  </div>
                </div>

                {/* Founder profile */}
                <div className="space-y-3 rounded-2xl border border-gray-200 p-4">
                  <h4 className="text-gray-600 font-bold text-xs uppercase tracking-wider">Founder Profile</h4>
                  <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Display Name</label><input value={editData.founderProfile?.displayName || ''} onChange={e => setFP('displayName', e.target.value)} style={{ fontSize: 16 }} className={inputCls} /></div>
                  <div><label className="text-gray-500 text-xs font-semibold mb-1 block">About</label><textarea value={editData.founderProfile?.about || ''} onChange={e => setFP('about', e.target.value)} rows={2} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none resize-none" /></div>
                  <div><label className="text-gray-500 text-xs font-semibold mb-1 block">Vision</label><textarea value={editData.founderProfile?.vision || ''} onChange={e => setFP('vision', e.target.value)} rows={2} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none resize-none" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    {[['whatsapp','WhatsApp'],['email','Email'],['twitter','Twitter'],['instagram','Instagram'],['other','Other link']].map(([k,l]) => (
                      <div key={k}><label className="text-gray-500 text-xs font-semibold mb-1 block">{l}</label><input value={editData.founderProfile?.contact?.[k] || ''} onChange={e => setFPC(k, e.target.value)} style={{ fontSize: 16 }} className={inputCls} /></div>
                    ))}
                  </div>
                </div>

                {/* Info media */}
                <div className="space-y-3 rounded-2xl border border-gray-200 p-4">
                  <h4 className="text-gray-600 font-bold text-xs uppercase tracking-wider">
                    Community Info Media
                    <span className="ml-2 text-gray-400 font-normal normal-case">({(editData.infoMedia || []).filter(m => m.kind === 'image').length}/{limits.images === Infinity ? '∞' : limits.images} images, {(editData.infoMedia || []).filter(m => m.kind === 'video').length}/{limits.videos === Infinity ? '∞' : limits.videos} videos)</span>
                  </h4>
                  <div className="space-y-2">
                    {(editData.infoMedia || []).map((m, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200">
                        <span className="text-gray-500 text-xs capitalize flex-1 truncate">{m.kind}: {m.url}</span>
                        <button onClick={() => removeInfoMedia(i)} className="p-1 text-gray-400 hover:text-red-500"><X size={11} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newInfoMediaUrl} onChange={e => setNewIMUrl(e.target.value)} placeholder="YouTube/embed URL" style={{ fontSize: 16 }} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                    <button onClick={addInfoMediaEmbed} className="px-3 py-2 bg-[#1a3c5e] text-white text-xs font-bold rounded-xl"><Link2 size={12} /></button>
                  </div>
                  <div className="flex gap-2">
                    <input type="file" accept="image/*,video/*" multiple ref={infoFileRef} className="hidden" onChange={e => setIMFiles(Array.from(e.target.files || []))} />
                    <button onClick={() => infoFileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition">
                      <ImageIcon size={12} /> Upload files {infoMediaFiles.length > 0 && `(${infoMediaFiles.length} selected)`}
                    </button>
                  </div>
                </div>

                {/* Info notes */}
                <div className="rounded-2xl border border-gray-200 p-4">
                  <h4 className="text-gray-600 font-bold text-xs uppercase tracking-wider mb-3">Community Notes / About Text</h4>
                  <textarea value={editData.infoNotes || ''} onChange={e => setED('infoNotes', e.target.value)} rows={6} placeholder="Write as much as you want — describe the community, its culture, what members do, etc."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none resize-none" />
                </div>

                {/* Onboarding */}
                <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-gray-600 font-bold text-xs uppercase tracking-wider">Onboarding</h4>
                    <div onClick={() => setONB('enabled', !editData.onboarding?.enabled)}
                      className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${editData.onboarding?.enabled ? 'bg-[#1a3c5e]' : 'bg-gray-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${editData.onboarding?.enabled ? 'left-6' : 'left-1'}`} />
                    </div>
                  </div>
                  {editData.onboarding?.enabled && (
                    <>
                      {/* Onboarding media */}
                      <div>
                        <label className="text-gray-500 text-xs font-semibold mb-2 block">Onboarding Media (videos, images to watch/read)</label>
                        <div className="space-y-1 mb-2">
                          {(editData.onboarding?.media || []).map((m, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200">
                              <span className="text-gray-500 text-xs capitalize flex-1 truncate">{m.kind}: {m.url}</span>
                              <button onClick={() => removeOnbMedia(i)} className="p-1 text-gray-400 hover:text-red-500"><X size={11} /></button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 mb-2">
                          <input value={newOnbMediaUrl} onChange={e => setNewOMUrl(e.target.value)} placeholder="YouTube/embed URL" style={{ fontSize: 16 }} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                          <button onClick={addOnbMediaEmbed} className="px-3 py-2 bg-[#1a3c5e] text-white text-xs font-bold rounded-xl"><Link2 size={12} /></button>
                        </div>
                        <div>
                          <input type="file" accept="image/*,video/*" multiple ref={onbFileRef} className="hidden" onChange={e => setOMFiles(Array.from(e.target.files || []))} />
                          <button onClick={() => onbFileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition">
                            <Video size={12} /> Upload {onbMediaFiles.length > 0 && `(${onbMediaFiles.length} selected)`}
                          </button>
                        </div>
                      </div>
                      {/* Notes */}
                      <div>
                        <label className="text-gray-500 text-xs font-semibold mb-1 block">Reading Material / Notes</label>
                        <textarea value={editData.onboarding?.notes || ''} onChange={e => setONB('notes', e.target.value)} rows={5} placeholder="Write the material you want prospective members to read before applying..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none resize-none" />
                      </div>
                      {/* Passing score + feedback mode */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-gray-500 text-xs font-semibold mb-1 block">Min. correct answers to proceed</label>
                          <input type="number" min={0} value={editData.onboarding?.passingScore || 0} onChange={e => setONB('passingScore', Number(e.target.value))} style={{ fontSize: 16 }} className={inputCls} />
                        </div>
                        <div>
                          <label className="text-gray-500 text-xs font-semibold mb-1 block">Feedback on failure</label>
                          <select value={editData.onboarding?.feedbackMode || 'just_fail'} onChange={e => setONB('feedbackMode', e.target.value)} style={{ fontSize: 16 }} className={inputCls}>
                            <option value="just_fail">Just say "you didn't pass"</option>
                            <option value="show_wrong">Show which answers were wrong</option>
                          </select>
                        </div>
                      </div>
                      {/* Questions */}
                      <div>
                        <label className="text-gray-500 text-xs font-semibold mb-2 block">Questions ({(editData.onboarding?.questions || []).length})</label>
                        <div className="space-y-2 mb-3">
                          {(editData.onboarding?.questions || []).map((q, i) => (
                            <div key={q._id || i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-700 text-sm font-semibold">{i+1}. {q.text}</p>
                                <p className="text-gray-400 text-xs capitalize">{q.type === 'mcq' ? `MCQ · ${q.options?.length} options` : 'Free text'}</p>
                              </div>
                              <button onClick={() => removeQuestion(i)} className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"><X size={12} /></button>
                            </div>
                          ))}
                        </div>
                        {addingQ ? (
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                            <input value={newQuestion.text} onChange={e => setNewQuestion(q => ({ ...q, text: e.target.value }))} placeholder="Question text *" style={{ fontSize: 16 }} className={inputCls} />
                            <div className="flex gap-2">
                              {['free_text','mcq'].map(t => (
                                <button key={t} onClick={() => setNewQuestion(q => ({ ...q, type: t }))}
                                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${newQuestion.type === t ? 'bg-[#1a3c5e] text-white border-[#1a3c5e]' : 'bg-white text-gray-600 border-gray-200'}`}>
                                  {t === 'free_text' ? 'Free Text' : 'Multiple Choice'}
                                </button>
                              ))}
                            </div>
                            {newQuestion.type === 'mcq' && (
                              <div className="space-y-2">
                                {newQuestion.options.map((o, i) => (
                                  <div key={i} className="flex gap-2">
                                    <input value={o} onChange={e => setNewQuestion(q => ({ ...q, options: q.options.map((x,j) => j===i ? e.target.value : x) }))} placeholder={`Option ${i+1}`} style={{ fontSize: 16 }} className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                                    {newQuestion.options.length > 2 && <button onClick={() => setNewQuestion(q => ({ ...q, options: q.options.filter((_,j) => j!==i) }))} className="text-gray-400 hover:text-red-500 p-1"><X size={11} /></button>}
                                  </div>
                                ))}
                                <button onClick={() => setNewQuestion(q => ({ ...q, options: [...q.options, ''] }))} className="text-xs text-[#1a3c5e] flex items-center gap-1"><Plus size={10} /> Add option</button>
                                <div>
                                  <label className="text-gray-400 text-xs mb-1 block">Correct answer (leave blank if no auto-grading)</label>
                                  <select value={newQuestion.correctAnswer} onChange={e => setNewQuestion(q => ({ ...q, correctAnswer: e.target.value }))} style={{ fontSize: 16 }} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                                    <option value="">No correct answer / manual review</option>
                                    {newQuestion.options.filter(o => o.trim()).map((o,i) => <option key={i} value={o}>{o}</option>)}
                                  </select>
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button onClick={() => setAddingQ(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl">Cancel</button>
                              <button onClick={addQuestion} className="flex-1 py-2 bg-[#1a3c5e] text-white text-xs font-bold rounded-xl">Add Question</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setAddingQ(true)} className="flex items-center gap-1.5 text-xs text-[#1a3c5e] font-semibold"><Plus size={11} /> Add question</button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
