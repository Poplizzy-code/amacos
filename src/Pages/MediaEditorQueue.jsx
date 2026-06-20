import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  Clock, CheckCircle, XCircle, Eye, Tv2, Radio, Newspaper,
  BookOpen, Loader2, ArrowLeft, Filter, RefreshCw
} from 'lucide-react'

const PLATFORM_ICONS = { tv: Tv2, radio: Radio, newspaper: Newspaper, magazine: BookOpen }
const PLATFORM_COLORS = { tv: 'text-red-400', radio: 'text-purple-400', newspaper: 'text-blue-400', magazine: 'text-emerald-400' }
const PLATFORM_BG    = { tv: 'bg-red-400/10', radio: 'bg-purple-400/10', newspaper: 'bg-blue-400/10', magazine: 'bg-emerald-400/10' }

function timeAgo(d) {
  const diff = Date.now() - new Date(d)
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function ReviewModal({ item, onClose, onReview }) {
  const [action, setAction]   = useState('')
  const [reason, setReason]   = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!action) return toast.error('Choose approve or reject.')
    if (action === 'reject' && !reason.trim()) return toast.error('Rejection reason is required.')
    setLoading(true)
    try {
      await onReview(item._id, action, reason.trim())
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#0d1f35] border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl">
        <div className="p-5 border-b border-white/10">
          <p className="text-white font-bold text-lg">{item.title}</p>
          <p className="text-gray-400 text-sm mt-0.5">By {item.author?.fullName} · {item.platform}</p>
        </div>

        {item.description && (
          <div className="px-5 py-3 border-b border-white/10">
            <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
          </div>
        )}

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setAction('approve')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition border-2 ${action === 'approve' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-white/10 text-gray-400 hover:border-emerald-500/40'}`}>
              <CheckCircle size={16} /> Approve
            </button>
            <button onClick={() => setAction('reject')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition border-2 ${action === 'reject' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-white/10 text-gray-400 hover:border-red-500/40'}`}>
              <XCircle size={16} /> Reject
            </button>
          </div>

          {action === 'reject' && (
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-1.5">Reason for rejection *</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
                placeholder="Explain what needs to be changed or why the content cannot be published…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-400/40 resize-none" />
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={submit} disabled={loading || !action}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] font-bold rounded-xl transition disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Submitting…' : 'Confirm'}
            </button>
            <button onClick={onClose} className="px-5 py-3 bg-white/10 hover:bg-white/15 text-gray-300 rounded-xl transition">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MediaEditorQueue({ isApp = false }) {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const base = isApp ? '/app' : ''

  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [platform, setPlatform] = useState('')
  const [reviewing, setReviewing] = useState(null)

  const load = () => {
    setLoading(true)
    const p = platform ? `?platform=${platform}` : ''
    axios.get(`/api/media/content/pending${p}`, { withCredentials: true })
      .then(res => setItems(res.data.items || []))
      .catch(() => toast.error('Failed to load queue.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user || !['editor', 'chief-editor'].includes(user.mediaRole)) {
      navigate(`${base}/media`)
      return
    }
    load()
  }, [user, platform])

  const handleReview = async (id, action, reason) => {
    try {
      await axios.put(`/api/media/content/${id}/review`, { action, reason }, { withCredentials: true })
      setItems(prev => prev.filter(i => i._id !== id))
      toast.success(action === 'approve' ? 'Content published!' : 'Content rejected.')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); throw err }
  }

  return (
    <div className={`${isApp ? '-m-4 lg:-m-6' : ''} min-h-screen bg-[#060d1a]`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition"><ArrowLeft size={18} /></button>
          <div className="flex-1">
            <h1 className="text-white font-black text-xl">Editor Queue</h1>
            <p className="text-gray-500 text-xs capitalize">{user?.mediaRole}</p>
          </div>
          <button onClick={load} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition"><RefreshCw size={16} /></button>
        </div>

        {/* Platform filter */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[{ id: '', label: 'All' }, { id: 'tv', label: 'TV' }, { id: 'radio', label: 'Radio' }, { id: 'newspaper', label: 'Newspaper' }, { id: 'magazine', label: 'Magazine' }].map(p => (
            <button key={p.id} onClick={() => setPlatform(p.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${platform === p.id ? 'bg-amber-400/20 text-amber-400' : 'text-gray-500 hover:text-gray-300 bg-white/5'}`}>
              {p.label}
            </button>
          ))}
        </div>

        {loading
          ? <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-amber-400" /></div>
          : items.length === 0
            ? <div className="text-center py-20">
                <Clock size={40} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 font-semibold">Queue is empty</p>
                <p className="text-gray-500 text-sm mt-1">All caught up! No pending submissions.</p>
              </div>
            : <div className="space-y-3">
                <p className="text-gray-500 text-sm">{items.length} item{items.length !== 1 ? 's' : ''} pending review</p>
                {items.map(item => {
                  const PIcon = PLATFORM_ICONS[item.platform] || Newspaper
                  return (
                    <div key={item._id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition">
                      <div className="flex items-start gap-4 p-4">
                        {item.thumbnail
                          ? <img src={item.thumbnail} alt={item.title} className="w-20 h-14 rounded-xl object-cover flex-shrink-0" />
                          : <div className={`w-20 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${PLATFORM_BG[item.platform]}`}>
                              <PIcon size={22} className={PLATFORM_COLORS[item.platform]} />
                            </div>
                        }
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLATFORM_BG[item.platform]} ${PLATFORM_COLORS[item.platform]}`}>{item.platform}</span>
                            {item.category && <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-white/5">{item.category}</span>}
                          </div>
                          <h3 className="text-white font-bold text-sm leading-tight">{item.title}</h3>
                          {item.description && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{item.description}</p>}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                            <span>By {item.author?.fullName}</span>
                            <span className={`capitalize px-1.5 py-0.5 rounded text-xs ${
                              item.author?.mediaRole === 'chief-editor' ? 'bg-amber-400/20 text-amber-400' :
                              item.author?.mediaRole === 'editor' ? 'bg-blue-400/20 text-blue-400' : 'bg-white/10 text-gray-400'
                            }`}>{item.author?.mediaRole}</span>
                            <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex border-t border-white/5">
                        <Link to={`${base}/media/content/${item._id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition">
                          <Eye size={13} /> Preview
                        </Link>
                        <button onClick={() => setReviewing(item)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-400/5 transition font-semibold border-l border-white/5">
                          <CheckCircle size={13} /> Review
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
        }
      </div>

      {reviewing && (
        <ReviewModal item={reviewing} onClose={() => setReviewing(null)} onReview={handleReview} />
      )}
    </div>
  )
}
