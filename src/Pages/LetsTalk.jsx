import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import {
  MessageSquare, Users, Zap, Send, Plus, Search, ArrowLeft,
  Loader2, X, Heart, Trash2, Image as ImageIcon,
  LogOut, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function Avatar({ name, src, size = 9 }) {
  if (src) return <img src={src} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
      {name?.charAt(0).toUpperCase()}
    </div>
  )
}

const BG  = '#060d1a'
const SB  = '#0a1929'
const SB2 = '#0d2137'

// ── Chats (DMs) ───────────────────────────────────────────────────────────────
function ChatsPane({ user, getSocket }) {
  const [contacts, setContacts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)
  const [messages, setMessages]   = useState([])
  const [loadingMsgs, setLMsgs]   = useState(false)
  const [text, setText]           = useState('')
  const [sending, setSending]     = useState(false)
  const bottomRef = useRef()
  const inputRef  = useRef()

  useEffect(() => {
    axios.get('/api/users/community', { withCredentials: true })
      .then(r => setContacts(r.data.users?.filter(u => u._id !== user._id) || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user._id])

  useEffect(() => {
    if (!selected) return
    setLMsgs(true); setMessages([])
    axios.get(`/api/messages/${selected._id}`, { withCredentials: true })
      .then(r => setMessages(r.data.messages || []))
      .catch(() => {})
      .finally(() => setLMsgs(false))
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [selected?._id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !selected) return
    const onMsg = (msg) => {
      const senderId = msg.sender?._id || msg.sender
      if (senderId === selected._id || senderId === user._id) {
        setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg])
      }
    }
    socket.on('new_message', onMsg)
    return () => socket.off('new_message', onMsg)
  }, [getSocket, selected?._id, user._id])

  const send = async () => {
    if (!text.trim() || sending || !selected) return
    setSending(true)
    const tmp = { _id: `tmp-${Date.now()}`, content: text.trim(), sender: { _id: user._id }, createdAt: new Date().toISOString() }
    setMessages(p => [...p, tmp]); setText('')
    try {
      const fd = new FormData()
      fd.append('recipientId', selected._id)
      fd.append('content', tmp.content)
      fd.append('messageType', 'text')
      const { data } = await axios.post('/api/messages', fd, { withCredentials: true })
      setMessages(p => p.map(m => m._id === tmp._id ? data.message : m))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send.')
      setMessages(p => p.filter(m => m._id !== tmp._id))
    } finally { setSending(false) }
  }

  const filtered = contacts.filter(c => c.fullName?.toLowerCase().includes(search.toLowerCase()))

  const ContactList = (
    <div className="flex flex-col h-full" style={{ background: SB }}>
      <div className="px-3 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-2 border border-white/5">
          <Search size={13} className="text-gray-500 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search members…"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading
          ? <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
          : filtered.length === 0
            ? <p className="text-center text-gray-600 text-sm py-10">No members found.</p>
            : filtered.map(c => (
                <button key={c._id} onClick={() => setSelected(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 ${selected?._id === c._id ? 'bg-white/5 border-l-2 border-amber-400' : ''}`}>
                  <Avatar name={c.fullName} src={c.avatar} size={10} />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-white text-sm font-semibold truncate">{c.fullName}</p>
                    <p className="text-gray-500 text-xs capitalize">
                      {c.accountType === 'staff' ? 'Staff' : c.isAlumni ? 'Alumni' : c.level ? `${c.level}L` : 'Student'}
                    </p>
                  </div>
                </button>
              ))
        }
      </div>
    </div>
  )

  const ChatWindow = selected && (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0" style={{ background: SB }}>
        <button onClick={() => setSelected(null)} className="lg:hidden p-1 text-gray-400 hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <Avatar name={selected.fullName} src={selected.avatar} size={9} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{selected.fullName}</p>
          <p className="text-gray-500 text-xs capitalize">
            {selected.accountType === 'staff' ? 'Staff' : selected.isAlumni ? 'Alumni' : selected.level ? `${selected.level}L` : 'Student'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loadingMsgs
          ? <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
          : messages.length === 0
            ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <MessageSquare size={22} className="text-gray-600" />
                </div>
                <p className="text-gray-500 text-sm">Say hi to {selected.fullName?.split(' ')[0]} 👋</p>
              </div>
            )
            : messages.map((m, i) => {
                const isMe = (m.sender?._id || m.sender) === user._id
                return (
                  <div key={m._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-amber-400 text-[#0a1929] font-medium rounded-br-sm'
                        : 'text-white rounded-bl-sm'
                    }`} style={!isMe ? { background: SB2 } : {}}>
                      {m.content}
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-amber-800/60' : 'text-gray-600'}`}>
                        {timeAgo(m.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })
        }
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-3 border-t border-white/10 flex gap-2 flex-shrink-0" style={{ background: SB }}>
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Message ${selected.fullName?.split(' ')[0]}…`}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/40" />
        <button onClick={send} disabled={sending || !text.trim()}
          className="p-2.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] rounded-2xl transition disabled:opacity-40">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-full">
      <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-72 xl:w-80 border-r border-white/10 flex-shrink-0 h-full overflow-hidden`}>
        {ContactList}
      </div>
      <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-col flex-1 h-full overflow-hidden`}>
        {ChatWindow || (
          <div className="flex flex-col items-center justify-center h-full text-center px-8" style={{ background: BG }}>
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={26} className="text-gray-600" />
            </div>
            <p className="text-gray-400 font-semibold text-sm">Select a contact</p>
            <p className="text-gray-600 text-xs mt-1">Pick someone to start a private chat</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Groups ────────────────────────────────────────────────────────────────────
function GroupsPane({ user, getSocket }) {
  const [groups, setGroups]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)
  const [messages, setMessages]   = useState([])
  const [loadingMsgs, setLMsgs]   = useState(false)
  const [text, setText]           = useState('')
  const [sending, setSending]     = useState(false)
  const [showCreate, setCreate]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [newDesc, setNewDesc]     = useState('')
  const [creating, setCreating]   = useState(false)
  const bottomRef = useRef()
  const inputRef  = useRef()

  useEffect(() => {
    setLoading(true)
    axios.get('/api/groups', { withCredentials: true })
      .then(r => setGroups(r.data.groups || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user._id])

  useEffect(() => {
    if (!selected) return
    setLMsgs(true); setMessages([])
    axios.get(`/api/groups/${selected._id}/messages`, { withCredentials: true })
      .then(r => setMessages(r.data.messages || []))
      .catch(() => {})
      .finally(() => setLMsgs(false))
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [selected?._id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const onMsg = ({ groupId, message }) => {
      if (selected?._id === groupId) {
        setMessages(p => p.some(m => m._id === message._id) ? p : [...p, message])
      }
      setGroups(p => {
        const g = p.find(g => g._id === groupId)
        if (!g) return p
        return [{ ...g, updatedAt: new Date().toISOString() }, ...p.filter(x => x._id !== groupId)]
      })
    }
    const onAdded = ({ group }) => {
      setGroups(p => p.some(g => g._id === group._id) ? p : [group, ...p])
      toast(`Added to "${group.name}"`, { icon: '👥' })
    }
    socket.on('group_message', onMsg)
    socket.on('group_added', onAdded)
    return () => { socket.off('group_message', onMsg); socket.off('group_added', onAdded) }
  }, [getSocket, selected?._id])

  const send = async () => {
    if (!text.trim() || sending || !selected) return
    setSending(true)
    const tmp = { _id: `tmp-${Date.now()}`, content: text.trim(), sender: { _id: user._id, fullName: user.fullName, avatar: user.avatar }, createdAt: new Date().toISOString() }
    setMessages(p => [...p, tmp]); setText('')
    try {
      const { data } = await axios.post(`/api/groups/${selected._id}/messages`, { content: tmp.content }, { withCredentials: true })
      setMessages(p => p.map(m => m._id === tmp._id ? data.message : m))
    } catch {
      toast.error('Failed.')
      setMessages(p => p.filter(m => m._id !== tmp._id))
    } finally { setSending(false) }
  }

  const createGroup = async () => {
    if (!newName.trim()) return toast.error('Name required.')
    setCreating(true)
    try {
      const { data } = await axios.post('/api/groups', { name: newName.trim(), description: newDesc.trim() }, { withCredentials: true })
      setGroups(p => [data.group, ...p])
      setSelected(data.group); setNewName(''); setNewDesc(''); setCreate(false)
      toast.success('Group created!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setCreating(false) }
  }

  const leaveGroup = async () => {
    if (!selected) return
    try {
      await axios.post(`/api/groups/${selected._id}/leave`, {}, { withCredentials: true })
      setGroups(p => p.filter(g => g._id !== selected._id)); setSelected(null)
      toast.success('Left group.')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
  }

  const filtered = groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()))
  const isCreator = selected && (selected.createdBy?._id === user._id || selected.createdBy === user._id)

  const GroupList = (
    <div className="flex flex-col h-full" style={{ background: SB }}>
      <div className="px-3 py-3 border-b border-white/5 flex gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-2 border border-white/5 flex-1">
          <Search size={13} className="text-gray-500 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none" />
        </div>
        <button onClick={() => setCreate(true)} className="p-2.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] rounded-2xl transition flex-shrink-0">
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading
          ? <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
          : filtered.length === 0
            ? <p className="text-center text-gray-600 text-sm py-10">No groups yet. Create one!</p>
            : filtered.map(g => (
                <button key={g._id} onClick={() => setSelected(g)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 ${selected?._id === g._id ? 'bg-white/5 border-l-2 border-amber-400' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                    {g.name?.charAt(0).toUpperCase()}
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
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0" style={{ background: SB }}>
        <button onClick={() => setSelected(null)} className="lg:hidden p-1 text-gray-400 hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
          {selected.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{selected.name}</p>
          <p className="text-gray-500 text-xs">{selected.members?.length || 0} members</p>
        </div>
        {!isCreator && (
          <button onClick={leaveGroup} className="text-gray-600 hover:text-red-400 transition p-1.5 rounded-xl hover:bg-red-400/10">
            <LogOut size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loadingMsgs
          ? <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
          : messages.length === 0
            ? <p className="text-center text-gray-500 text-sm py-10">No messages yet — say hello 👋</p>
            : messages.map((m, i) => {
                const isMe = m.sender?._id === user._id
                return (
                  <div key={m._id || i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isMe && <Avatar name={m.sender?.fullName} src={m.sender?.avatar} size={7} />}
                    <div className="max-w-[72%]">
                      {!isMe && <p className="text-[11px] text-amber-400/80 font-semibold mb-1 pl-1">{m.sender?.fullName?.split(' ')[0]}</p>}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe ? 'bg-amber-400 text-[#0a1929] font-medium rounded-br-sm' : 'text-white rounded-bl-sm'
                      }`} style={!isMe ? { background: SB2 } : {}}>
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

      <div className="px-3 py-3 border-t border-white/10 flex gap-2 flex-shrink-0" style={{ background: SB }}>
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Message ${selected.name}…`}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/40" />
        <button onClick={send} disabled={sending || !text.trim()}
          className="p-2.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] rounded-2xl transition disabled:opacity-40">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-md rounded-2xl border border-white/10 shadow-2xl" style={{ background: SB }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <p className="text-white font-bold">New Group</p>
              <button onClick={() => setCreate(false)} className="p-1 text-gray-400 hover:text-white"><X size={15} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Group name *"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400/40" />
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} placeholder="Description (optional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400/40 resize-none" />
              <div className="flex gap-2">
                <button onClick={createGroup} disabled={creating || !newName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] font-bold text-sm rounded-xl transition disabled:opacity-50">
                  {creating && <Loader2 size={13} className="animate-spin" />} Create
                </button>
                <button onClick={() => setCreate(false)} className="px-4 py-2.5 bg-white/10 text-gray-300 text-sm rounded-xl hover:bg-white/15 transition">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex h-full">
        <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-72 xl:w-80 border-r border-white/10 flex-shrink-0 h-full overflow-hidden`}>
          {GroupList}
        </div>
        <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-col flex-1 h-full overflow-hidden`}>
          {GroupChat || (
            <div className="flex flex-col items-center justify-center h-full text-center px-8" style={{ background: BG }}>
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Users size={26} className="text-gray-600" />
              </div>
              <p className="text-gray-400 font-semibold text-sm">Select a group</p>
              <p className="text-gray-600 text-xs mt-1">Create or join a group to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Pulse (campus micro-posts) ────────────────────────────────────────────────
function PulsePane({ user }) {
  const [pulses, setPulses]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [text, setText]             = useState('')
  const [imageFile, setImageFile]   = useState(null)
  const [imagePreview, setPreview]  = useState('')
  const [posting, setPosting]       = useState(false)
  const [expanded, setExpanded]     = useState({})
  const [replyText, setReplyText]   = useState({})
  const [replyingTo, setReplyingTo] = useState(null)
  const fileRef = useRef()
  const MAX = 500

  const load = useCallback(() => {
    setLoading(true)
    axios.get('/api/pulse', { withCredentials: true })
      .then(r => setPulses(r.data.pulses || []))
      .catch(() => toast.error('Failed to load Pulse.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const pickImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const post = async () => {
    if (!text.trim() || posting) return
    setPosting(true)
    try {
      const fd = new FormData()
      fd.append('content', text.trim())
      if (imageFile) fd.append('image', imageFile)
      const { data } = await axios.post('/api/pulse', fd, { withCredentials: true })
      setPulses(p => [data.pulse, ...p])
      setText(''); setImageFile(null); setPreview('')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to post.') }
    finally { setPosting(false) }
  }

  const like = async (id) => {
    try {
      const { data } = await axios.post(`/api/pulse/${id}/like`, {}, { withCredentials: true })
      setPulses(p => p.map(pulse =>
        pulse._id === id
          ? { ...pulse, likes: data.liked
              ? [...(pulse.likes || []), user._id]
              : (pulse.likes || []).filter(l => (l?._id || l) !== user._id) }
          : pulse
      ))
    } catch { toast.error('Failed.') }
  }

  const del = async (id) => {
    try {
      await axios.delete(`/api/pulse/${id}`, { withCredentials: true })
      setPulses(p => p.filter(pulse => pulse._id !== id))
      toast.success('Deleted.')
    } catch { toast.error('Failed.') }
  }

  const reply = async (id) => {
    const content = replyText[id]?.trim()
    if (!content) return
    try {
      const { data } = await axios.post(`/api/pulse/${id}/reply`, { content }, { withCredentials: true })
      setPulses(p => p.map(pulse =>
        pulse._id === id ? { ...pulse, replies: [...(pulse.replies || []), data.reply] } : pulse
      ))
      setReplyText(r => ({ ...r, [id]: '' }))
      setReplyingTo(null)
      setExpanded(e => ({ ...e, [id]: true }))
    } catch { toast.error('Failed.') }
  }

  const isLiked = (pulse) => (pulse.likes || []).some(l => (l?._id || l) === user._id)

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: BG }}>
      {/* Compose */}
      <div className="px-4 py-4 border-b border-white/10 flex-shrink-0" style={{ background: SB }}>
        <div className="flex gap-3">
          <Avatar name={user.fullName} src={user.avatar} size={9} />
          <div className="flex-1 min-w-0">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={2}
              placeholder="What's on your mind? Drop a pulse…"
              maxLength={MAX}
              className="w-full bg-transparent text-white placeholder-gray-600 text-sm resize-none focus:outline-none leading-relaxed"
            />
            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img src={imagePreview} alt="" className="max-h-40 rounded-xl object-cover" />
                <button onClick={() => { setImageFile(null); setPreview('') }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/80 text-white rounded-full flex items-center justify-center">
                  <X size={10} />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button onClick={() => fileRef.current?.click()} className="p-1.5 text-gray-500 hover:text-amber-400 transition rounded-lg hover:bg-amber-400/10">
                  <ImageIcon size={15} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
                <span className={`text-xs ${text.length > MAX * 0.9 ? 'text-red-400' : 'text-gray-600'}`}>
                  {text.length}/{MAX}
                </span>
              </div>
              <button onClick={post} disabled={posting || !text.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] font-bold text-xs rounded-2xl transition disabled:opacity-40">
                {posting ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                Pulse
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      {loading
        ? <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-amber-400" /></div>
        : pulses.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <Zap size={32} className="text-gray-700 mb-4" />
              <p className="text-gray-400 font-semibold">No pulses yet</p>
              <p className="text-gray-600 text-sm mt-1">Be the first to drop one</p>
            </div>
          )
          : pulses.map(pulse => {
              const liked = isLiked(pulse)
              const isOwner = (pulse.author?._id || pulse.author) === user._id
              const showReplies = expanded[pulse._id]

              return (
                <div key={pulse._id} className="border-b border-white/5 px-4 py-4">
                  <div className="flex gap-3">
                    <Avatar name={pulse.author?.fullName} src={pulse.author?.avatar} size={9} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white text-sm font-semibold">{pulse.author?.fullName}</span>
                        <span className="text-gray-600 text-xs">{timeAgo(pulse.createdAt)}</span>
                        {isOwner && (
                          <button onClick={() => del(pulse._id)} className="ml-auto p-1 text-gray-700 hover:text-red-400 transition">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{pulse.content}</p>
                      {pulse.image && (
                        <img src={pulse.image} alt="" className="mt-3 rounded-2xl max-h-64 w-full object-cover" />
                      )}

                      <div className="flex items-center gap-5 mt-3">
                        <button onClick={() => like(pulse._id)}
                          className={`flex items-center gap-1.5 text-xs transition ${liked ? 'text-red-400' : 'text-gray-600 hover:text-red-400'}`}>
                          <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                          {(pulse.likes || []).length}
                        </button>
                        <button onClick={() => setReplyingTo(replyingTo === pulse._id ? null : pulse._id)}
                          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-amber-400 transition">
                          <MessageSquare size={14} />
                          {(pulse.replies || []).length}
                        </button>
                        {(pulse.replies || []).length > 0 && (
                          <button onClick={() => setExpanded(e => ({ ...e, [pulse._id]: !e[pulse._id] }))}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-300 transition ml-auto">
                            {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {showReplies ? 'Hide' : 'View'} replies
                          </button>
                        )}
                      </div>

                      {replyingTo === pulse._id && (
                        <div className="flex gap-2 mt-3">
                          <input
                            autoFocus
                            value={replyText[pulse._id] || ''}
                            onChange={e => setReplyText(r => ({ ...r, [pulse._id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && reply(pulse._id)}
                            placeholder="Write a reply…"
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/40"
                          />
                          <button onClick={() => reply(pulse._id)} disabled={!replyText[pulse._id]?.trim()}
                            className="p-2 bg-amber-400 hover:bg-amber-300 text-[#0a1929] rounded-2xl transition disabled:opacity-40">
                            <Send size={13} />
                          </button>
                        </div>
                      )}

                      {showReplies && (pulse.replies || []).length > 0 && (
                        <div className="mt-3 space-y-2 pl-2 border-l-2 border-white/10">
                          {pulse.replies.map((r, i) => (
                            <div key={r._id || i} className="flex gap-2">
                              <Avatar name={r.author?.fullName} src={r.author?.avatar} size={6} />
                              <div className="flex-1 min-w-0">
                                <div className="inline-block rounded-2xl rounded-tl-sm px-3 py-2" style={{ background: SB2 }}>
                                  <p className="text-[11px] font-semibold text-amber-400/80 mb-0.5">{r.author?.fullName?.split(' ')[0]}</p>
                                  <p className="text-gray-300 text-sm">{r.content}</p>
                                </div>
                                <p className="text-[10px] text-gray-600 mt-0.5 pl-1">{timeAgo(r.createdAt)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
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

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'chats',  label: 'Chats',  icon: MessageSquare },
  { id: 'groups', label: 'Groups', icon: Users },
  { id: 'pulse',  label: 'Pulse',  icon: Zap },
]

export default function LetsTalk() {
  const { user }      = useAuth()
  const { getSocket } = useSocket()
  const location      = useLocation()
  const params        = new URLSearchParams(location.search)
  const initTab       = params.get('tab') === 'groups' ? 'groups' : 'chats'
  const [active, setActive] = useState(initTab)

  if (!user) return null

  return (
    <div className="flex flex-col -m-4 lg:-m-6" style={{ height: 'calc(100vh - 56px)', background: BG }}>
      {/* Header + Tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 flex-shrink-0" style={{ background: SB }}>
        <p className="text-white font-black text-sm tracking-wide">Let's Talk</p>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition ${
                active === t.id
                  ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}>
              <t.icon size={13} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {active === 'chats'  && <ChatsPane  user={user} getSocket={getSocket} />}
        {active === 'groups' && <GroupsPane user={user} getSocket={getSocket} />}
        {active === 'pulse'  && <PulsePane  user={user} />}
      </div>
    </div>
  )
}
