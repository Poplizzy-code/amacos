import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  MessageSquare, Plus, Heart, Eye, ArrowLeft, Send,
  Trash2, Pin, Loader2, X,
} from 'lucide-react'

const CATEGORIES = [
  { value: 'all',      label: 'All',       color: 'bg-gray-100 text-gray-600' },
  { value: 'general',  label: 'General',   color: 'bg-blue-100 text-blue-700' },
  { value: 'academic', label: 'Academic',  color: 'bg-green-100 text-green-700' },
  { value: 'help',     label: 'Help',      color: 'bg-red-100 text-red-700' },
  { value: 'events',   label: 'Events',    color: 'bg-purple-100 text-purple-700' },
  { value: 'fun',      label: 'Fun',       color: 'bg-amber-100 text-amber-700' },
  { value: 'tech',     label: 'Tech',      color: 'bg-cyan-100 text-cyan-700' },
]

function catMeta(value) {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[1]
}

function UserAvatar({ name, avatar, size = 8 }) {
  const px = size * 4
  if (avatar) return <img src={avatar} alt={name} style={{ width: px, height: px }} className="rounded-full object-cover flex-shrink-0" />
  return (
    <div style={{ width: px, height: px, fontSize: px * 0.35 }}
      className="rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center text-white font-bold flex-shrink-0">
      {name?.charAt(0).toUpperCase()}
    </div>
  )
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ── Thread List ────────────────────────────────────────────────────────────────
function ThreadList({ onOpen, category, setCategory, user }) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = (cat) => {
    setLoading(true)
    const params = cat && cat !== 'all' ? `?category=${cat}` : ''
    axios.get(`/api/forum${params}`, { withCredentials: true })
      .then(res => setThreads(res.data.threads || []))
      .catch(() => toast.error('Failed to load threads.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(category) }, [category])

  const handleCreated = (thread) => {
    setThreads(prev => [thread, ...prev])
    setShowCreate(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3c5e]">Let's Talk</h1>
          <p className="text-gray-500 text-sm mt-0.5">Community discussions and help</p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 text-sm bg-[#1a3c5e] text-white px-4 py-2.5 rounded-xl hover:bg-[#162f4a] transition font-medium flex-shrink-0"
          >
            <Plus size={15} /> New Thread
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div className="flex gap-2 w-max">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
                category === c.value
                  ? c.color + ' shadow-sm'
                  : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#1a3c5e]" />
        </div>
      ) : threads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={24} className="text-gray-400" />
          </div>
          <p className="font-semibold text-gray-600 mb-1">No threads yet</p>
          <p className="text-sm text-gray-400">Be the first to start a discussion!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map(t => (
            <button
              key={t._id}
              onClick={() => onOpen(t._id)}
              className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md hover:border-gray-200 transition"
            >
              <div className="flex items-start gap-3">
                <UserAvatar name={t.author?.fullName} avatar={t.author?.avatar} size={9} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {t.pinned && <Pin size={12} className="text-amber-500 flex-shrink-0" />}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catMeta(t.category).color}`}>
                      {catMeta(t.category).label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{t.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.content}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-600">{t.author?.fullName}</span>
                    <span className="text-xs text-gray-400">{timeAgo(t.createdAt)}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Heart size={11} />{t.likes?.length || 0}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MessageSquare size={11} />{t.replyCount ?? 0}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Eye size={11} />{t.views || 0}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateThreadModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}

// ── Thread Detail ─────────────────────────────────────────────────────────────
function ThreadDetail({ threadId, onBack, user }) {
  const [thread, setThread] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const bottomRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/forum/${threadId}`, { withCredentials: true })
      .then(res => {
        const t = res.data.thread
        setThread(t)
        setLiked(user ? t.likes?.some(l => (l._id || l).toString() === user._id) : false)
        setLikes(t.likes?.length || 0)
      })
      .catch(() => toast.error('Failed to load thread.'))
      .finally(() => setLoading(false))
  }, [threadId, user])

  const toggleLike = async () => {
    if (!user) return toast.error('Sign in to like.')
    try {
      const { data } = await axios.put(`/api/forum/${threadId}/like`, {}, { withCredentials: true })
      setLiked(data.liked)
      setLikes(data.likes)
    } catch {
      toast.error('Failed.')
    }
  }

  const sendReply = async (e) => {
    e.preventDefault()
    if (!reply.trim() || sending) return
    setSending(true)
    try {
      const { data } = await axios.post(`/api/forum/${threadId}/replies`, { content: reply }, { withCredentials: true })
      setThread(prev => ({ ...prev, replies: [...(prev.replies || []), data.reply] }))
      setReply('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch {
      toast.error('Failed to post reply.')
    } finally {
      setSending(false)
    }
  }

  const deleteReply = async (replyId) => {
    try {
      await axios.delete(`/api/forum/${threadId}/replies/${replyId}`, { withCredentials: true })
      setThread(prev => ({ ...prev, replies: prev.replies.filter(r => r._id !== replyId) }))
    } catch {
      toast.error('Failed to delete reply.')
    }
  }

  const deleteThread = async () => {
    try {
      await axios.delete(`/api/forum/${threadId}`, { withCredentials: true })
      toast.success('Thread deleted.')
      onBack()
    } catch {
      toast.error('Failed to delete thread.')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-[#1a3c5e]" />
    </div>
  )
  if (!thread) return <div className="text-center py-20 text-gray-500">Thread not found.</div>

  const isOwner = user && (thread.author?._id === user._id || thread.author === user._id)
  const isAdmin = user?.isStaffAdmin

  return (
    <div className="space-y-4 max-w-2xl">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3c5e] transition">
        <ArrowLeft size={16} /> Back to threads
      </button>

      {/* Thread body */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start gap-3 mb-3">
          <UserAvatar name={thread.author?.fullName} avatar={thread.author?.avatar} size={10} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">{thread.author?.fullName}</span>
              {thread.author?.accountType === 'staff' && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Staff</span>
              )}
              <span className="text-xs text-gray-400">{timeAgo(thread.createdAt)}</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${catMeta(thread.category).color}`}>
              {catMeta(thread.category).label}
            </span>
          </div>
          {(isOwner || isAdmin) && (
            <button onClick={deleteThread} className="p-1.5 text-red-400 hover:bg-red-50 rounded-xl transition flex-shrink-0">
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <h2 className="text-lg font-bold text-[#1a3c5e] mb-2">{thread.title}</h2>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{thread.content}</p>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-sm transition ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
          >
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} /> {likes}
          </button>
          <span className="flex items-center gap-1.5 text-sm text-gray-400">
            <MessageSquare size={15} /> {thread.replies?.length || 0} replies
          </span>
          <span className="flex items-center gap-1.5 text-sm text-gray-400">
            <Eye size={15} /> {thread.views || 0} views
          </span>
        </div>
      </div>

      {/* Replies */}
      {(thread.replies?.length || 0) > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500">
            {thread.replies.length} {thread.replies.length === 1 ? 'Reply' : 'Replies'}
          </h3>
          {thread.replies.map(r => {
            const isReplyOwner = user && (r.author?._id === user._id || r.author === user._id)
            return (
              <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <UserAvatar name={r.author?.fullName} avatar={r.author?.avatar} size={8} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-700">{r.author?.fullName}</span>
                      <span className="text-xs text-gray-400">{timeAgo(r.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{r.content}</p>
                  </div>
                  {(isReplyOwner || isAdmin) && (
                    <button
                      onClick={() => deleteReply(r._id)}
                      className="p-1 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div ref={bottomRef} />

      {/* Reply form */}
      {user ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">Add a reply</p>
          <form onSubmit={sendReply} className="flex gap-2 items-start">
            <UserAvatar name={user.fullName} avatar={user.avatar} size={8} />
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!reply.trim() || sending}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] transition font-medium disabled:opacity-50"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Reply
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-sm text-gray-500">Sign in to reply to this thread.</p>
        </div>
      )}
    </div>
  )
}

// ── Create Thread Modal ────────────────────────────────────────────────────────
function CreateThreadModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', content: '', category: 'general' })
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required.')
    if (!form.content.trim()) return toast.error('Content is required.')
    setSubmitting(true)
    try {
      const { data } = await axios.post('/api/forum', form, { withCredentials: true })
      toast.success('Thread posted!')
      onCreated(data.thread)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post thread.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-[#1a3c5e]">New Thread</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, category: c.value }))}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${
                    form.category === c.value ? c.color : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="What's your topic?"
              maxLength={200}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Content *</label>
            <textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="Share your thoughts, question or idea..."
              rows={5}
              maxLength={5000}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{form.content.length}/5000</p>
          </div>

          <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 text-sm bg-[#1a3c5e] text-white rounded-xl hover:bg-[#162f4a] transition font-medium disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
              Post Thread
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Export ────────────────────────────────────────────────────────────────
export default function Forum() {
  const { user } = useAuth()
  const [view, setView] = useState('list')
  const [openThreadId, setOpenThreadId] = useState(null)
  const [category, setCategory] = useState('all')

  return (
    <div>
      {view === 'list' && (
        <ThreadList
          onOpen={(id) => { setOpenThreadId(id); setView('detail') }}
          category={category}
          setCategory={setCategory}
          user={user}
        />
      )}
      {view === 'detail' && openThreadId && (
        <ThreadDetail
          threadId={openThreadId}
          onBack={() => { setOpenThreadId(null); setView('list') }}
          user={user}
        />
      )}
    </div>
  )
}
