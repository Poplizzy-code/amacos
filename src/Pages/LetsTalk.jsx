import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import {
  MessageSquare, Users, Hash, Send, Plus, Search, ArrowLeft,
  Loader2, X, Heart, Eye, Pin, Trash2, MoreVertical,
  Crown, UserPlus, LogOut, Image as ImageIcon, Paperclip,
  ChevronRight, RefreshCw,
} from 'lucide-react'

// ── Shared helpers ────────────────────────────────────────────────────────────
const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function Avatar({ name, avatar, size = 9, className = '' }) {
  if (avatar) return <img src={avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0 ${className}`} />
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center text-white font-bold flex-shrink-0 text-sm ${className}`}>
      {name?.charAt(0).toUpperCase()}
    </div>
  )
}

const FORUM_CATS = [
  { value: 'all',      label: 'All' },
  { value: 'general',  label: 'General' },
  { value: 'academic', label: 'Academic' },
  { value: 'help',     label: 'Help' },
  { value: 'events',   label: 'Events' },
  { value: 'fun',      label: 'Fun' },
  { value: 'tech',     label: 'Tech' },
]

const CAT_COLORS = {
  general:  'bg-blue-500/20 text-blue-300',
  academic: 'bg-emerald-500/20 text-emerald-300',
  help:     'bg-red-500/20 text-red-300',
  events:   'bg-purple-500/20 text-purple-300',
  fun:      'bg-amber-500/20 text-amber-300',
  tech:     'bg-cyan-500/20 text-cyan-300',
}

// ── Discussions ───────────────────────────────────────────────────────────────
function DiscussionsPane({ user }) {
  const [threads, setThreads]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [category, setCategory]       = useState('all')
  const [selected, setSelected]       = useState(null)
  const [replies, setReplies]         = useState([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [reply, setReply]             = useState('')
  const [sending, setSending]         = useState(false)
  const [showCreate, setShowCreate]   = useState(false)
  const [newTitle, setNewTitle]       = useState('')
  const [newBody, setNewBody]         = useState('')
  const [newCat, setNewCat]           = useState('general')
  const [creating, setCreating]       = useState(false)
  const [mobileView, setMobileView]   = useState('list')
  const replyRef = useRef()
  const bottomRef = useRef()

  const loadThreads = () => {
    setLoading(true)
    const q = category !== 'all' ? `?category=${category}` : ''
    axios.get(`/api/forum${q}`, { withCredentials: true })
      .then(r => setThreads(r.data.threads || []))
      .catch(() => toast.error('Failed to load discussions.'))
      .finally(() => setLoading(false))
  }
  useEffect(loadThreads, [category])

  const openThread = (thread) => {
    setSelected(thread)
    setMobileView('thread')
    setLoadingReplies(true)
    setReplies([])
    axios.get(`/api/forum/${thread._id}`, { withCredentials: true })
      .then(r => { setReplies(r.data.thread?.replies || []); setThreads(prev => prev.map(t => t._id === thread._id ? { ...t, views: (t.views || 0) + 1 } : t)) })
      .catch(() => toast.error('Failed to load thread.'))
      .finally(() => setLoadingReplies(false))
    setTimeout(() => replyRef.current?.focus(), 300)
  }

  const sendReply = async () => {
    if (!reply.trim() || sending || !selected) return
    setSending(true)
    try {
      const { data } = await axios.post(`/api/forum/${selected._id}/replies`, { content: reply.trim() }, { withCredentials: true })
      setReplies(prev => [...prev, data.reply])
      setReply('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSending(false) }
  }

  const likeThread = async (id) => {
    try {
      await axios.post(`/api/forum/${id}/like`, {}, { withCredentials: true })
      setThreads(prev => prev.map(t => t._id === id ? { ...t, likes: t.isLiked ? t.likes - 1 : t.likes + 1, isLiked: !t.isLiked } : t))
    } catch { toast.error('Failed.') }
  }

  const createThread = async () => {
    if (!newTitle.trim() || !newBody.trim()) return toast.error('Title and content required.')
    setCreating(true)
    try {
      const { data } = await axios.post('/api/forum', { title: newTitle.trim(), content: newBody.trim(), category: newCat }, { withCredentials: true })
      setThreads(prev => [data.thread, ...prev])
      setNewTitle(''); setNewBody(''); setNewCat('general'); setShowCreate(false)
      toast.success('Thread posted!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setCreating(false) }
  }

  const deleteThread = async (id) => {
    try {
      await axios.delete(`/api/forum/${id}`, { withCredentials: true })
      setThreads(prev => prev.filter(t => t._id !== id))
      if (selected?._id === id) { setSelected(null); setMobileView('list') }
      toast.success('Deleted.')
    } catch { toast.error('Failed.') }
  }

  // Thread list
  const ThreadList = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {FORUM_CATS.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${category === c.value ? 'bg-amber-400/20 text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}>
              {c.label}
            </button>
          ))}
        </div>
        {user && (
          <button onClick={() => setShowCreate(true)} className="flex-shrink-0 p-2 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] rounded-xl transition">
            <Plus size={15} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading
          ? <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-amber-400" /></div>
          : threads.length === 0
            ? <div className="text-center py-12 text-gray-500 text-sm">No discussions yet.</div>
            : threads.map(t => (
                <button key={t._id} onClick={() => openThread(t)}
                  className={`w-full text-left px-4 py-3.5 border-b border-white/5 hover:bg-white/5 transition ${selected?._id === t._id ? 'bg-white/5 border-l-2 border-amber-400' : ''}`}>
                  <div className="flex items-start gap-2.5">
                    <Avatar name={t.author?.fullName} avatar={t.author?.avatar} size={8} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        {t.category && t.category !== 'general' && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${CAT_COLORS[t.category] || 'bg-white/10 text-gray-400'}`}>{t.category}</span>
                        )}
                        {t.isPinned && <Pin size={10} className="text-amber-400 flex-shrink-0" />}
                      </div>
                      <p className="text-white text-sm font-semibold leading-snug line-clamp-2">{t.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{t.author?.fullName?.split(' ')[0]}</span>
                        <span className="flex items-center gap-1"><Eye size={10} />{t.views || 0}</span>
                        <span className="flex items-center gap-1"><Heart size={10} />{t.likes || 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={10} />{t.replies?.length || t.replyCount || 0}</span>
                        <span className="ml-auto">{timeAgo(t.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
        }
      </div>
    </div>
  )

  // Thread detail
  const ThreadDetail = selected && (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-start gap-3 flex-shrink-0">
        <button onClick={() => { setSelected(null); setMobileView('list') }} className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-lg mt-0.5"><ArrowLeft size={16} /></button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-snug">{selected.title}</p>
          <p className="text-gray-500 text-xs mt-0.5">{selected.author?.fullName} · {timeAgo(selected.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => likeThread(selected._id)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition ${selected.isLiked ? 'text-red-400 bg-red-400/10' : 'text-gray-500 hover:text-gray-300'}`}>
            <Heart size={12} fill={selected.isLiked ? 'currentColor' : 'none'} /> {selected.likes || 0}
          </button>
          {(user?._id === selected.author?._id || user?.isStudentAdmin || user?.isStaffAdmin) && (
            <button onClick={() => deleteThread(selected._id)} className="p-1.5 text-gray-600 hover:text-red-400 transition"><Trash2 size={14} /></button>
          )}
        </div>
      </div>
      {/* Original post */}
      <div className="px-4 py-4 border-b border-white/5 flex-shrink-0">
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{selected.content}</p>
      </div>
      {/* Replies */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {loadingReplies
          ? <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
          : replies.length === 0
            ? <p className="text-center text-gray-600 text-sm py-4">No replies yet. Be the first!</p>
            : replies.map((r, i) => (
                <div key={r._id || i} className="flex items-start gap-2.5">
                  <Avatar name={r.author?.fullName} avatar={r.author?.avatar} size={7} />
                  <div className="flex-1 min-w-0">
                    <div className="bg-white/5 rounded-2xl rounded-tl-sm px-3 py-2.5">
                      <p className="text-xs font-semibold text-amber-400 mb-1">{r.author?.fullName?.split(' ')[0]}</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{r.content}</p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 pl-1">{timeAgo(r.createdAt)}</p>
                  </div>
                </div>
              ))
        }
        <div ref={bottomRef} />
      </div>
      {/* Reply input */}
      {user ? (
        <div className="px-4 py-3 border-t border-white/10 flex gap-2 flex-shrink-0">
          <input ref={replyRef} value={reply} onChange={e => setReply(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
            placeholder="Write a reply…"
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/40" />
          <button onClick={sendReply} disabled={sending || !reply.trim()}
            className="p-2.5 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] rounded-2xl transition disabled:opacity-50">
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-white/10 text-center text-gray-500 text-xs flex-shrink-0">Sign in to reply.</div>
      )}
    </div>
  )

  return (
    <>
      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="bg-[#0d1f35] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <p className="text-white font-bold">New Discussion</p>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title *"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400/40" />
              <textarea value={newBody} onChange={e => setNewBody(e.target.value)} rows={5} placeholder="What's on your mind? *"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400/40 resize-none" />
              <div className="flex gap-1.5 flex-wrap">
                {FORUM_CATS.filter(c => c.value !== 'all').map(c => (
                  <button key={c.value} onClick={() => setNewCat(c.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${newCat === c.value ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={createThread} disabled={creating || !newTitle.trim() || !newBody.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] font-bold text-sm rounded-xl transition disabled:opacity-50">
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  Post Discussion
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 bg-white/10 text-gray-300 text-sm rounded-xl hover:bg-white/15 transition">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: side-by-side | Mobile: stack */}
      <div className="flex h-full">
        <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 xl:w-96 border-r border-white/10 flex-shrink-0 h-full overflow-hidden`}>
          {ThreadList}
        </div>
        <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-col flex-1 h-full overflow-hidden`}>
          {ThreadDetail || (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <Hash size={28} className="text-gray-600" />
              </div>
              <p className="text-gray-400 font-semibold">Pick a discussion</p>
              <p className="text-gray-600 text-sm mt-1">Select a thread from the list to read and reply.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Groups ────────────────────────────────────────────────────────────────────
function GroupsPane({ user, getSocket }) {
  const [groups, setGroups]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)
  const [messages, setMessages]       = useState([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [text, setText]               = useState('')
  const [sending, setSending]         = useState(false)
  const [showCreate, setShowCreate]   = useState(false)
  const [search, setSearch]           = useState('')
  const [newName, setNewName]         = useState('')
  const [newDesc, setNewDesc]         = useState('')
  const [creating, setCreating]       = useState(false)
  const bottomRef = useRef(); const inputRef = useRef()

  useEffect(() => {
    setLoading(true)
    axios.get('/api/groups', { withCredentials: true })
      .then(r => setGroups(r.data.groups || []))
      .catch(() => {}).finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!selected) return
    setLoadingMsgs(true); setMessages([])
    axios.get(`/api/groups/${selected._id}/messages`, { withCredentials: true })
      .then(r => setMessages(r.data.messages || []))
      .catch(() => {}).finally(() => setLoadingMsgs(false))
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [selected?._id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const onMsg = ({ groupId, message }) => {
      if (selected?._id === groupId) {
        setMessages(prev => prev.some(m => m._id === message._id) ? prev : [...prev, message])
      }
      setGroups(prev => {
        const g = prev.find(g => g._id === groupId); if (!g) return prev
        return [{ ...g, updatedAt: new Date().toISOString() }, ...prev.filter(g => g._id !== groupId)]
      })
    }
    const onAdded = ({ group }) => {
      setGroups(prev => prev.some(g => g._id === group._id) ? prev : [group, ...prev])
      toast(`Added to "${group.name}"`, { icon: '👥' })
    }
    socket.on('group_message', onMsg); socket.on('group_added', onAdded)
    return () => { socket.off('group_message', onMsg); socket.off('group_added', onAdded) }
  }, [getSocket, selected?._id])

  const send = async () => {
    if (!text.trim() || sending || !selected) return
    setSending(true)
    const tmp = { _id: `tmp-${Date.now()}`, content: text.trim(), sender: { _id: user._id, fullName: user.fullName, avatar: user.avatar }, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, tmp]); setText('')
    try {
      const { data } = await axios.post(`/api/groups/${selected._id}/messages`, { content: tmp.content }, { withCredentials: true })
      setMessages(prev => prev.map(m => m._id === tmp._id ? data.message : m))
    } catch { toast.error('Failed to send.'); setMessages(prev => prev.filter(m => m._id !== tmp._id)) }
    finally { setSending(false) }
  }

  const createGroup = async () => {
    if (!newName.trim()) return toast.error('Group name required.')
    setCreating(true)
    try {
      const { data } = await axios.post('/api/groups', { name: newName.trim(), description: newDesc.trim() }, { withCredentials: true })
      setGroups(prev => [data.group, ...prev])
      setNewName(''); setNewDesc(''); setShowCreate(false)
      setSelected(data.group); toast.success('Group created!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setCreating(false) }
  }

  const leaveGroup = async () => {
    if (!selected) return
    try {
      await axios.post(`/api/groups/${selected._id}/leave`, {}, { withCredentials: true })
      setGroups(prev => prev.filter(g => g._id !== selected._id)); setSelected(null)
      toast.success('Left group.')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
  }

  const filtered = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
  const isCreator = selected && (selected.createdBy?._id === user?._id || selected.createdBy === user?._id)

  const GroupList = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 flex gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex-1">
          <Search size={13} className="text-gray-500 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups…"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none" />
        </div>
        {user && <button onClick={() => setShowCreate(true)} className="p-2 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] rounded-xl transition"><Plus size={15} /></button>}
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading
          ? <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-amber-400" /></div>
          : filtered.length === 0
            ? <div className="text-center py-12 text-gray-600 text-sm">No groups yet.</div>
            : filtered.map(g => (
                <button key={g._id} onClick={() => setSelected(g)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition border-b border-white/5 ${selected?._id === g._id ? 'bg-white/5 border-l-2 border-amber-400' : ''}`}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center flex-shrink-0">
                    <Users size={16} className="text-white/70" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-white text-sm font-semibold truncate">{g.name}</p>
                    <p className="text-gray-500 text-xs">{g.members?.length || 0} member{g.members?.length !== 1 ? 's' : ''}</p>
                  </div>
                </button>
              ))
        }
      </div>
    </div>
  )

  const GroupChat = selected && (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => setSelected(null)} className="lg:hidden p-1.5 text-gray-400 hover:text-white"><ArrowLeft size={16} /></button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center flex-shrink-0">
          <Users size={15} className="text-white/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{selected.name}</p>
          <p className="text-gray-500 text-xs">{selected.members?.length || 0} members</p>
        </div>
        {!isCreator && (
          <button onClick={leaveGroup} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-red-400/10">
            <LogOut size={13} /> Leave
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loadingMsgs
          ? <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
          : messages.length === 0
            ? <p className="text-center text-gray-600 text-sm py-8">No messages yet. Say hello! 👋</p>
            : messages.map((m, i) => {
                const isMe = m.sender?._id === user?._id
                return (
                  <div key={m._id || i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isMe && <Avatar name={m.sender?.fullName} avatar={m.sender?.avatar} size={7} />}
                    <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isMe && <p className="text-xs text-amber-400/80 font-semibold mb-1 pl-1">{m.sender?.fullName?.split(' ')[0]}</p>}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-amber-400 text-[#0d1f35] font-medium rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                        {m.content}
                      </div>
                      <p className="text-[10px] text-gray-600 mt-0.5 px-1">{timeAgo(m.createdAt)}</p>
                    </div>
                  </div>
                )
              })
        }
        <div ref={bottomRef} />
      </div>
      <div className="px-4 py-3 border-t border-white/10 flex gap-2 flex-shrink-0">
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Message ${selected.name}…`}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/40" />
        <button onClick={send} disabled={sending || !text.trim()}
          className="p-2.5 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] rounded-2xl transition disabled:opacity-50">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="bg-[#0d1f35] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <p className="text-white font-bold">Create Group</p>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Group name *"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400/40" />
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} placeholder="Description (optional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400/40 resize-none" />
              <div className="flex gap-2">
                <button onClick={createGroup} disabled={creating || !newName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] font-bold text-sm rounded-xl transition disabled:opacity-50">
                  {creating && <Loader2 size={14} className="animate-spin" />} Create
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 bg-white/10 text-gray-300 text-sm rounded-xl hover:bg-white/15 transition">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex h-full">
        <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 xl:w-96 border-r border-white/10 flex-shrink-0 h-full overflow-hidden`}>
          {GroupList}
        </div>
        <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-col flex-1 h-full overflow-hidden`}>
          {GroupChat || (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <Users size={28} className="text-gray-600" />
              </div>
              <p className="text-gray-400 font-semibold">No group selected</p>
              <p className="text-gray-600 text-sm mt-1">Join or create a group to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Direct Messages ───────────────────────────────────────────────────────────
function MessagesPane({ user, getSocket }) {
  const [users, setUsers]             = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [selected, setSelected]       = useState(null)
  const [messages, setMessages]       = useState([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [text, setText]               = useState('')
  const [sending, setSending]         = useState(false)
  const [search, setSearch]           = useState('')
  const bottomRef = useRef(); const inputRef = useRef()

  useEffect(() => {
    setLoadingUsers(true)
    axios.get('/api/users/community', { withCredentials: true })
      .then(r => setUsers(r.data.users || []))
      .catch(() => {}).finally(() => setLoadingUsers(false))
  }, [user])

  useEffect(() => {
    if (!selected) return
    setLoadingMsgs(true); setMessages([])
    axios.get(`/api/messages/${selected._id}`, { withCredentials: true })
      .then(r => setMessages(r.data.messages || []))
      .catch(() => {}).finally(() => setLoadingMsgs(false))
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [selected?._id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !selected) return
    const onMsg = (msg) => {
      if (msg.sender?._id === selected._id || msg.sender === selected._id) {
        setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg])
      }
    }
    socket.on('new_message', onMsg)
    return () => socket.off('new_message', onMsg)
  }, [getSocket, selected?._id])

  const send = async () => {
    if (!text.trim() || sending || !selected) return
    setSending(true)
    const tmp = { _id: `tmp-${Date.now()}`, content: text.trim(), messageType: 'text', sender: { _id: user._id }, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, tmp]); setText('')
    try {
      const fd = new FormData()
      fd.append('recipientId', selected._id); fd.append('content', tmp.content); fd.append('messageType', 'text')
      const { data } = await axios.post('/api/messages', fd, { withCredentials: true })
      setMessages(prev => prev.map(m => m._id === tmp._id ? data.message : m))
    } catch (err) {
      const code = err.response?.data?.code
      toast.error(code === 'FRIEND_REQUIRED' ? 'Send a friend request first to message.' : (err.response?.data?.message || 'Failed.'))
      setMessages(prev => prev.filter(m => m._id !== tmp._id))
    } finally { setSending(false) }
  }

  const isSelf = selected?._id === user?._id
  const filtered = users.filter(u => u.fullName?.toLowerCase().includes(search.toLowerCase()) && u._id !== user?._id)

  const UserList = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Search size={13} className="text-gray-500 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people…"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loadingUsers
          ? <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-amber-400" /></div>
          : filtered.length === 0
            ? <div className="text-center py-12 text-gray-600 text-sm">No users found.</div>
            : filtered.map(u => (
                <button key={u._id} onClick={() => setSelected(u)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition border-b border-white/5 ${selected?._id === u._id ? 'bg-white/5 border-l-2 border-amber-400' : ''}`}>
                  <div className="relative">
                    <Avatar name={u.fullName} avatar={u.avatar} size={9} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-white text-sm font-semibold truncate">{u.fullName}</p>
                    <p className="text-gray-500 text-xs truncate capitalize">{u.accountType === 'staff' ? 'Staff' : u.level ? `${u.level}L` : 'Student'}</p>
                  </div>
                </button>
              ))
        }
      </div>
    </div>
  )

  const DMPanel = selected && (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => setSelected(null)} className="lg:hidden p-1.5 text-gray-400 hover:text-white"><ArrowLeft size={16} /></button>
        <Avatar name={selected.fullName} avatar={selected.avatar} size={9} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{selected.fullName}</p>
          <p className="text-gray-500 text-xs capitalize">{selected.accountType === 'staff' ? 'Staff' : selected.level ? `${selected.level}L` : 'Student'}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loadingMsgs
          ? <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
          : messages.length === 0
            ? <p className="text-center text-gray-600 text-sm py-8">No messages yet. Say hi! 👋</p>
            : messages.map((m, i) => {
                const isMe = m.sender?._id === user?._id || m.sender === user?._id
                const isMedia = m.messageType === 'media' || m.messageType === 'image'
                return (
                  <div key={m._id || i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isMe && <Avatar name={selected.fullName} avatar={selected.avatar} size={7} />}
                    <div className={`max-w-[72%]`}>
                      {isMedia && m.mediaUrl
                        ? <img src={m.mediaUrl} alt="media" className="max-w-[220px] rounded-2xl" />
                        : <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-amber-400 text-[#0d1f35] font-medium rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                            {m.content}
                          </div>
                      }
                      <p className="text-[10px] text-gray-600 mt-0.5 px-1">{timeAgo(m.createdAt)}</p>
                    </div>
                  </div>
                )
              })
        }
        <div ref={bottomRef} />
      </div>
      <div className="px-4 py-3 border-t border-white/10 flex gap-2 flex-shrink-0">
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Message ${selected.fullName?.split(' ')[0]}…`}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/40" />
        <button onClick={send} disabled={sending || !text.trim()}
          className="p-2.5 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] rounded-2xl transition disabled:opacity-50">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-full">
      <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 xl:w-96 border-r border-white/10 flex-shrink-0 h-full overflow-hidden`}>
        {UserList}
      </div>
      <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-col flex-1 h-full overflow-hidden`}>
        {DMPanel || (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-gray-600" />
            </div>
            <p className="text-gray-400 font-semibold">No conversation selected</p>
            <p className="text-gray-600 text-sm mt-1">Pick someone to start a private chat.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main LetsTalk ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'discussions', label: 'Discussions', icon: Hash },
  { id: 'groups',      label: 'Groups',      icon: Users },
  { id: 'messages',    label: 'Messages',    icon: MessageSquare },
]

export default function LetsTalk() {
  const { user }    = useAuth()
  const { getSocket } = useSocket()
  const location    = useLocation()
  const params      = new URLSearchParams(location.search)
  const initTab     = params.get('tab') || 'discussions'
  const [active, setActive] = useState(TABS.find(t => t.id === initTab) ? initTab : 'discussions')

  return (
    <div className="flex flex-col -m-4 lg:-m-6 bg-[#060d1a]" style={{ height: 'calc(100vh - 0px)' }}>
      {/* Top bar */}
      <div className="flex-shrink-0 bg-[#0d1f35] border-b border-white/10 px-4 py-3 flex items-center gap-4">
        <div>
          <p className="text-white font-black text-base">Let's Talk</p>
          <p className="text-gray-500 text-xs">Discuss · Group chat · Direct messages</p>
        </div>
        <div className="flex gap-1 ml-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${active === t.id ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
              <t.icon size={13} /><span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {active === 'discussions' && <DiscussionsPane user={user} />}
        {active === 'groups'      && <GroupsPane user={user} getSocket={getSocket} />}
        {active === 'messages'    && <MessagesPane user={user} getSocket={getSocket} />}
      </div>
    </div>
  )
}
