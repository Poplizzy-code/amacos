import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import {
  Search, Send, ArrowLeft, Loader2, X, Smile, Paperclip,
  UserPlus, UserCheck, Clock, AlertCircle, File, Image as ImageIcon,
  MessageCircle, Users, Plus, ChevronDown, LogOut, Trash2,
} from 'lucide-react'

// ── Sticker / Emoji data (shared minimal version for the Messages page) ────────
const EMOJI_QUICK = ['😀','😂','🥰','😍','😎','🤔','😅','😭','😤','🔥','💯','🙏','👍','❤️','🎉','💪']

const STICKER_PACKS = [
  {
    name: 'AMACOS',
    stickers: [
      { id: 'am-1', text: '📚\nStudy Mode\nON!' },
      { id: 'am-2', text: '🎓\nFuture\nGraduate!' },
      { id: 'am-3', text: '🎬\nMass Comm\nVibes' },
      { id: 'am-4', text: '🗞️\nBREAKING\nNEWS!' },
      { id: 'am-5', text: '📡\nLIVE\nON AIR' },
      { id: 'am-6', text: '✏️\nTaking\nNotes!' },
    ],
  },
  {
    name: 'Reactions',
    stickers: [
      { id: 're-1', text: '💀\nI\'m dead\n💀' },
      { id: 're-2', text: '🤩\nWOW!!!' },
      { id: 're-3', text: '😤\nUGH!' },
      { id: 're-4', text: '🥺\nPlease...' },
      { id: 're-5', text: '😂\nLOL!!!' },
      { id: 're-6', text: '🔥\nThis is\nFIRE!' },
      { id: 're-7', text: '💯\nFACTS!' },
      { id: 're-8', text: '😭\nI can\'t...' },
    ],
  },
  {
    name: 'Campus',
    stickers: [
      { id: 'ca-1', text: '🏫\nOff to\nLecture!' },
      { id: 'ca-2', text: '😴\nLecture\nis boring...' },
      { id: 'ca-3', text: '📖\nExam\nSeason 😰' },
      { id: 'ca-4', text: '🎉\nSchool\nis out!!!' },
      { id: 'ca-5', text: '☕\nNeed Coffee\nASAP' },
      { id: 'ca-6', text: '🤞\nPlease let\nme pass!' },
    ],
  },
]

const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function EmojiStickerPicker({ onEmoji, onSticker, onSendCustomSticker, onClose }) {
  const [tab, setTab] = useState('emoji')
  const [pack, setPack] = useState(0)
  const [customImgUrl, setCustomImgUrl] = useState('')
  const [customText, setCustomText] = useState('')
  const [customTextColor, setCustomTextColor] = useState('#ffffff')
  const [customTextPos, setCustomTextPos] = useState('bottom')
  const [imgReady, setImgReady] = useState(false)
  const [creating, setCreating] = useState(false)
  const canvasRef = useRef()
  const hiddenImgRef = useRef()
  const filePickRef = useRef()
  const ref = useRef()

  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const img = hiddenImgRef.current
    if (!canvas || !img || !img.complete || !img.naturalWidth) return
    const SIZE = 300
    canvas.width = SIZE; canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    const scale = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight)
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale
    ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h)
    if (customText.trim()) {
      const lines = customText.trim().split('\n').slice(0, 3)
      const lineH = 34, padding = 12
      const totalH = lines.length * lineH + padding * 2
      const yStart = customTextPos === 'bottom' ? SIZE - totalH : 0
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(0, yStart, SIZE, totalH)
      ctx.font = 'bold 22px system-ui, sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6
      ctx.fillStyle = customTextColor
      lines.forEach((line, i) => ctx.fillText(line, SIZE / 2, yStart + padding + i * lineH, SIZE - 24))
    }
  }, [customText, customTextColor, customTextPos, imgReady])

  useEffect(() => { if (imgReady) drawCanvas() }, [drawCanvas, imgReady])

  const sendCustom = () => {
    if (!canvasRef.current || !imgReady || creating) return
    setCreating(true)
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `sticker-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onSendCustomSticker(file)
        setCustomImgUrl(''); setCustomText(''); setImgReady(false); setTab('sticker')
      }
      setCreating(false)
    }, 'image/jpeg', 0.92)
  }

  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
      <div className="flex border-b border-gray-100">
        {[['emoji','😀 Emoji'],['sticker','🎭 Packs'],['create','✨ Create']].map(([t,label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[11px] font-bold transition ${tab === t ? 'text-[#1a3c5e] border-b-2 border-[#1a3c5e]' : 'text-gray-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'emoji' && (
        <div className="grid grid-cols-8 gap-0 p-2">
          {EMOJI_QUICK.map((em, i) => (
            <button key={i} onClick={() => onEmoji(em)}
              className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 rounded-lg transition">
              {em}
            </button>
          ))}
        </div>
      )}

      {tab === 'sticker' && (
        <>
          <div className="flex gap-1 px-3 py-2 border-b border-gray-50 overflow-x-auto scrollbar-none">
            {STICKER_PACKS.map((p, i) => (
              <button key={i} onClick={() => setPack(i)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition ${pack === i ? 'bg-[#1a3c5e]/10 text-[#1a3c5e]' : 'text-gray-400 hover:text-gray-600'}`}>
                {p.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 p-3 max-h-40 overflow-y-auto">
            {STICKER_PACKS[pack].stickers.map(s => (
              <button key={s.id} onClick={() => onSticker(s)}
                className="flex items-center justify-center p-2 bg-gray-50 hover:bg-[#1a3c5e]/5 rounded-xl transition border border-gray-100 min-h-16 text-xs font-bold text-[#1a3c5e] leading-snug whitespace-pre-line text-center">
                {s.text}
              </button>
            ))}
          </div>
        </>
      )}

      {tab === 'create' && (
        <div className="p-3 space-y-2.5">
          {customImgUrl && (
            <img ref={hiddenImgRef} src={customImgUrl} onLoad={() => setImgReady(true)}
              className="hidden" alt="" crossOrigin="anonymous" />
          )}
          {!customImgUrl ? (
            <button onClick={() => filePickRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-[#1a3c5e]/40 hover:text-[#1a3c5e] transition">
              <ImageIcon size={20} />
              <span className="text-xs font-bold">Pick a photo</span>
            </button>
          ) : (
            <div className="relative">
              <canvas ref={canvasRef} className="w-full rounded-xl border border-gray-100" style={{ aspectRatio: '1/1' }} />
              <button onClick={() => { setCustomImgUrl(''); setImgReady(false) }}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white">
                <X size={11} />
              </button>
            </div>
          )}
          <input value={customText} onChange={e => setCustomText(e.target.value)}
            placeholder="Add text (optional)" maxLength={60}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none text-gray-700" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-semibold">Color</span>
            {['#ffffff','#ffea00','#ff4757','#2ed573','#1e90ff','#000000'].map(c => (
              <button key={c} onClick={() => setCustomTextColor(c)}
                style={{ background: c, outline: customTextColor === c ? '2px solid #1a3c5e' : '2px solid transparent' }}
                className="w-5 h-5 rounded-full border border-gray-200" />
            ))}
            <div className="ml-auto flex gap-1">
              {['top','bottom'].map(p => (
                <button key={p} onClick={() => setCustomTextPos(p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${customTextPos === p ? 'bg-[#1a3c5e] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {p === 'top' ? '⬆️' : '⬇️'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={sendCustom} disabled={!imgReady || creating}
            className="w-full py-2 bg-[#1a3c5e] hover:bg-[#152f4a] text-white text-xs font-bold rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2">
            {creating ? <Loader2 size={11} className="animate-spin" /> : '🚀'}
            {creating ? 'Sending…' : 'Send Custom Sticker'}
          </button>
          <input ref={filePickRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files[0]; if (f) { setCustomImgUrl(URL.createObjectURL(f)); setImgReady(false) }; e.target.value='' }} />
        </div>
      )}
    </div>
  )
}

function CreateGroupModal({ users, currentUser, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [picked, setPicked] = useState([])
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = users.filter(u =>
    u._id !== currentUser._id &&
    u.fullName?.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (u) => setPicked(p =>
    p.some(x => x._id === u._id) ? p.filter(x => x._id !== u._id) : [...p, u]
  )

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('Group name is required.')
    if (picked.length === 0) return toast.error('Add at least one member.')
    setCreating(true)
    try {
      const { data } = await axios.post('/api/groups', {
        name: name.trim(),
        description: desc.trim(),
        memberIds: picked.map(u => u._id),
      }, { withCredentials: true })
      onCreate(data.group)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create group.')
    } finally { setCreating(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-[#1a3c5e] text-base">Create Group Chat</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name *"
            maxLength={60}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-gray-700" />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)"
            maxLength={200}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-gray-700" />

          {picked.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {picked.map(u => (
                <span key={u._id} className="flex items-center gap-1 bg-[#1a3c5e]/10 text-[#1a3c5e] text-xs font-bold px-2.5 py-1 rounded-full">
                  {u.fullName.split(' ')[0]}
                  <button onClick={() => toggle(u)} className="hover:text-red-500 transition"><X size={10} /></button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…"
              className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400" />
          </div>
          <div className="max-h-44 overflow-y-auto space-y-0.5">
            {filtered.map(u => {
              const sel = picked.some(x => x._id === u._id)
              return (
                <button key={u._id} onClick={() => toggle(u)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition text-left ${sel ? 'bg-[#1a3c5e]/5' : 'hover:bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${sel ? 'bg-[#1a3c5e]' : 'bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e]'}`}>
                    {u.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{u.fullName}</p>
                    <p className="text-xs text-gray-400">{u.accountType === 'staff' ? 'Staff' : `Student${u.level ? ` · ${u.level}L` : ''}`}</p>
                  </div>
                  {sel && <div className="w-4 h-4 bg-[#1a3c5e] rounded-full flex items-center justify-center flex-shrink-0"><svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
                </button>
              )
            })}
          </div>
        </div>
        <div className="px-5 pb-5">
          <button onClick={handleCreate} disabled={creating || !name.trim() || picked.length === 0}
            className="w-full py-2.5 bg-[#1a3c5e] hover:bg-[#152f4a] text-white text-sm font-bold rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2">
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
            {creating ? 'Creating…' : `Create Group${picked.length > 0 ? ` (${picked.length + 1})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Messages() {
  const { user } = useAuth()
  const { getSocket } = useSocket()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [friendStatus, setFriendStatus] = useState('none')
  const [iAmSender, setIAmSender] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [friendRequestId, setFriendRequestId] = useState(null)
  const [sendingFR, setSendingFR] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [mediaFile, setMediaFile] = useState(null)
  // Group chat state
  const [sidebarTab, setSidebarTab] = useState('dms')
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupMessages, setGroupMessages] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [loadingGroupMsgs, setLoadingGroupMsgs] = useState(false)
  const [groupText, setGroupText] = useState('')
  const [groupMediaFile, setGroupMediaFile] = useState(null)
  const [sendingGroup, setSendingGroup] = useState(false)
  const [showGroupEmoji, setShowGroupEmoji] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showGroupMembers, setShowGroupMembers] = useState(false)
  const inputRef = useRef()
  const bottomRef = useRef()
  const fileRef = useRef()
  const groupInputRef = useRef()
  const groupBottomRef = useRef()
  const groupFileRef = useRef()

  useEffect(() => {
    if (!user) return
    setLoadingUsers(true)
    axios.get('/api/users/community', { withCredentials: true })
      .then(r => setUsers(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoadingUsers(false))
  }, [user])

  useEffect(() => {
    if (!selected) return
    setLoadingMsgs(true)
    setMessages([]); setFriendStatus('none'); setIAmSender(false); setSentCount(0); setFriendRequestId(null)
    axios.get(`/api/messages/${selected._id}`, { withCredentials: true })
      .then(r => {
        setMessages(r.data.messages || [])
        setFriendStatus(r.data.friendStatus || 'none')
        setSentCount(r.data.sentCount || 0)
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false))

    if (selected._id !== user._id) {
      axios.get(`/api/friends/status/${selected._id}`, { withCredentials: true })
        .then(r => {
          setFriendStatus(r.data.status || 'none')
          setFriendRequestId(r.data.requestId || null)
          setIAmSender(r.data.isSender || false)
        })
        .catch(() => {})
    }
  }, [selected?._id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (selected) setTimeout(() => inputRef.current?.focus(), 200) }, [selected])

  // Fetch groups
  useEffect(() => {
    if (!user) return
    setLoadingGroups(true)
    axios.get('/api/groups', { withCredentials: true })
      .then(r => setGroups(r.data.groups || []))
      .catch(() => {})
      .finally(() => setLoadingGroups(false))
  }, [user])

  // Load group messages when a group is selected
  useEffect(() => {
    if (!selectedGroup) return
    setLoadingGroupMsgs(true)
    setGroupMessages([])
    axios.get(`/api/groups/${selectedGroup._id}/messages`, { withCredentials: true })
      .then(r => setGroupMessages(r.data.messages || []))
      .catch(() => {})
      .finally(() => setLoadingGroupMsgs(false))
    setTimeout(() => groupInputRef.current?.focus(), 200)
  }, [selectedGroup?._id])

  useEffect(() => { groupBottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [groupMessages])

  // Socket: real-time group messages
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handler = ({ groupId, message }) => {
      if (selectedGroup?._id === groupId) {
        setGroupMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev
          return [...prev, message]
        })
      }
      // Bump group to top of list
      setGroups(prev => {
        const g = prev.find(g => g._id === groupId)
        if (!g) return prev
        return [{ ...g, updatedAt: new Date().toISOString() }, ...prev.filter(g => g._id !== groupId)]
      })
    }
    const addedHandler = ({ group }) => {
      setGroups(prev => prev.some(g => g._id === group._id) ? prev : [group, ...prev])
      toast(`You've been added to "${group.name}"`, { icon: '👥' })
    }
    socket.on('group_message', handler)
    socket.on('group_added', addedHandler)
    return () => { socket.off('group_message', handler); socket.off('group_added', addedHandler) }
  }, [getSocket, selectedGroup?._id])

  const sendMsg = async (overrideContent = null, msgType = 'text', stickerId = null) => {
    const body = overrideContent ?? text.trim()
    if ((!body && !mediaFile) || sending || !selected) return
    setSending(true)
    const opt = {
      _id: `tmp-${Date.now()}`,
      content: body,
      messageType: stickerId ? 'sticker' : msgType,
      stickerId: stickerId || '',
      sender: { _id: user._id },
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, opt])
    if (!stickerId) setText('')
    setShowEmoji(false)
    try {
      const fd = new FormData()
      fd.append('recipientId', selected._id)
      if (body) fd.append('content', body)
      fd.append('messageType', stickerId ? 'sticker' : msgType)
      if (stickerId) fd.append('stickerId', stickerId)
      if (mediaFile) fd.append('media', mediaFile)
      const { data } = await axios.post('/api/messages', fd, {
        withCredentials: true,
        timeout: mediaFile ? 120000 : 15000,
      })
      setMessages(prev => prev.map(m => m._id === opt._id ? data.message : m))
      setMediaFile(null)
      if (friendStatus !== 'accepted' && !isSelf) setSentCount(c => c + 1)
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'FRIEND_REQUIRED') {
        toast.error('Send a friend request to continue messaging.')
      } else {
        toast.error(err.response?.data?.message || 'Could not send message.')
      }
      setMessages(prev => prev.filter(m => m._id !== opt._id))
    } finally { setSending(false) }
  }

  const sendFR = async () => {
    if (!selected || sendingFR) return
    setSendingFR(true)
    try {
      const { data } = await axios.post('/api/friends/request', { recipientId: selected._id }, { withCredentials: true })
      setFriendStatus('pending')
      setIAmSender(true)
      setFriendRequestId(data.request?._id)
      toast.success('Friend request sent!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send request.')
    } finally { setSendingFR(false) }
  }

  const acceptFR = async () => {
    if (!friendRequestId) return
    try {
      await axios.put(`/api/friends/accept/${friendRequestId}`, {}, { withCredentials: true })
      setFriendStatus('accepted'); setIAmSender(false); setSentCount(0)
      toast.success(`You and ${selected.fullName.split(' ')[0]} are now friends! 🎉`)
    } catch { toast.error('Could not accept.') }
  }

  const rejectFR = async () => {
    if (!friendRequestId) return
    try {
      await axios.put(`/api/friends/reject/${friendRequestId}`, {}, { withCredentials: true })
      setFriendStatus('rejected'); setIAmSender(false); setFriendRequestId(null)
    } catch { toast.error('Could not decline.') }
  }

  const onEmoji = useCallback((em) => setText(t => t + em), [])
  const onSticker = useCallback((s) => sendMsg(s.text, 'sticker', s.id), [selected, sending])
  const onSendCustomSticker = useCallback((file) => {
    setShowEmoji(false)
    const opt = { _id: `tmp-${Date.now()}`, content: '', messageType: 'media', mediaType: 'image', sender: { _id: user._id }, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, opt])
    const fd = new FormData()
    fd.append('recipientId', selected._id)
    fd.append('messageType', 'media')
    fd.append('media', file)
    axios.post('/api/messages', fd, { withCredentials: true, timeout: 60000 })
      .then(({ data }) => setMessages(prev => prev.map(m => m._id === opt._id ? data.message : m)))
      .catch(() => { toast.error('Could not send sticker.'); setMessages(prev => prev.filter(m => m._id !== opt._id)) })
  }, [selected, user])

  // Group send
  const sendGroupMsg = async (overrideContent = null, msgType = 'text', stickerId = null) => {
    if (!selectedGroup || sendingGroup) return
    const body = overrideContent ?? groupText.trim()
    if (!body && !groupMediaFile) return
    setSendingGroup(true)
    const opt = {
      _id: `tmp-${Date.now()}`,
      content: body,
      messageType: stickerId ? 'sticker' : (groupMediaFile ? 'media' : msgType),
      sender: { _id: user._id, fullName: user.fullName },
      createdAt: new Date().toISOString(),
    }
    setGroupMessages(prev => [...prev, opt])
    if (!stickerId) setGroupText('')
    setShowGroupEmoji(false)
    const fd = new FormData()
    if (body) fd.append('content', body)
    fd.append('messageType', stickerId ? 'sticker' : msgType)
    if (stickerId) fd.append('stickerId', stickerId)
    if (groupMediaFile) fd.append('media', groupMediaFile)
    try {
      const { data } = await axios.post(`/api/groups/${selectedGroup._id}/messages`, fd, {
        withCredentials: true,
        timeout: groupMediaFile ? 120000 : 15000,
      })
      setGroupMessages(prev => prev.map(m => m._id === opt._id ? data.message : m))
      setGroupMediaFile(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send message.')
      setGroupMessages(prev => prev.filter(m => m._id !== opt._id))
    } finally { setSendingGroup(false) }
  }

  const onGroupEmoji = useCallback((em) => setGroupText(t => t + em), [])
  const onGroupSticker = useCallback((s) => sendGroupMsg(s.text, 'sticker', s.id), [selectedGroup, sendingGroup])
  const onGroupCustomSticker = useCallback((file) => {
    setShowGroupEmoji(false)
    const opt = { _id: `tmp-${Date.now()}`, content: '', messageType: 'media', mediaType: 'image', sender: { _id: user._id, fullName: user.fullName }, createdAt: new Date().toISOString() }
    setGroupMessages(prev => [...prev, opt])
    const fd = new FormData()
    fd.append('messageType', 'media')
    fd.append('media', file)
    axios.post(`/api/groups/${selectedGroup._id}/messages`, fd, { withCredentials: true, timeout: 60000 })
      .then(({ data }) => setGroupMessages(prev => prev.map(m => m._id === opt._id ? data.message : m)))
      .catch(() => { toast.error('Could not send sticker.'); setGroupMessages(prev => prev.filter(m => m._id !== opt._id)) })
  }, [selectedGroup, user])

  const leaveGroup = async () => {
    if (!selectedGroup) return
    if (!window.confirm(`Leave "${selectedGroup.name}"?`)) return
    try {
      await axios.delete(`/api/groups/${selectedGroup._id}/members/${user._id}`, { withCredentials: true })
      setGroups(prev => prev.filter(g => g._id !== selectedGroup._id))
      setSelectedGroup(null)
      toast.success('Left the group.')
    } catch { toast.error('Could not leave group.') }
  }

  const deleteGroup = async () => {
    if (!selectedGroup) return
    if (!window.confirm(`Delete "${selectedGroup.name}"? This cannot be undone.`)) return
    try {
      await axios.delete(`/api/groups/${selectedGroup._id}`, { withCredentials: true })
      setGroups(prev => prev.filter(g => g._id !== selectedGroup._id))
      setSelectedGroup(null)
      toast.success('Group deleted.')
    } catch { toast.error('Could not delete group.') }
  }

  const isSelf = selected && selected._id === user?._id
  const theyRequestedMe = friendStatus === 'pending' && !isSelf && !iAmSender
  const iSentRequest = friendStatus === 'pending' && !isSelf && iAmSender
  const remaining = isSelf ? null : (friendStatus !== 'accepted' ? Math.max(0, 3 - sentCount) : null)
  const canMessage = isSelf || friendStatus === 'accepted' || (friendStatus !== 'accepted' && sentCount < 3)

  const filtered = users.filter(u => u.fullName?.toLowerCase().includes(search.toLowerCase()))

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <MessageCircle size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Sign in to use Messages</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4">

      {/* ── Sidebar ── */}
      <div className={`flex flex-col w-full md:w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${(selected || selectedGroup) ? 'hidden md:flex' : 'flex'}`}>
        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          <button onClick={() => setSidebarTab('dms')}
            className={`flex-1 py-3 text-xs font-bold transition ${sidebarTab === 'dms' ? 'text-[#1a3c5e] border-b-2 border-[#1a3c5e]' : 'text-gray-400 hover:text-gray-600'}`}>
            💬 Direct Messages
          </button>
          <button onClick={() => setSidebarTab('groups')}
            className={`flex-1 py-3 text-xs font-bold transition ${sidebarTab === 'groups' ? 'text-[#1a3c5e] border-b-2 border-[#1a3c5e]' : 'text-gray-400 hover:text-gray-600'}`}>
            👥 Groups
          </button>
        </div>

        {sidebarTab === 'dms' && (
          <>
            <div className="px-4 py-3 border-b border-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…"
                  className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loadingUsers && <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#1a3c5e]" /></div>}
              {!loadingUsers && filtered.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm"><div className="text-3xl mb-2">💬</div>No members found</div>
              )}
              {filtered.map(u => {
                const isMe = u._id === user._id
                return (
                  <button key={u._id} onClick={() => { setSelected(u); setSelectedGroup(null) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${selected?._id === u._id ? 'bg-[#1a3c5e]/5' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${isMe ? 'bg-gradient-to-br from-amber-400 to-amber-500' : 'bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e]'}`}>
                      {u.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{u.fullName}{isMe ? ' (You)' : ''}</p>
                      <p className="text-xs text-gray-400">{u.accountType === 'staff' ? 'Staff' : `Student${u.level ? ` · ${u.level}L` : ''}`}</p>
                    </div>
                    {isMe && <span className="text-[10px] text-amber-500 font-bold flex-shrink-0">📝</span>}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {sidebarTab === 'groups' && (
          <>
            <div className="px-4 py-3 border-b border-gray-50 flex-shrink-0">
              <button onClick={() => setShowCreateGroup(true)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#1a3c5e]/5 hover:bg-[#1a3c5e]/10 text-[#1a3c5e] text-xs font-bold rounded-xl transition">
                <Plus size={13} /> New Group
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loadingGroups && <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#1a3c5e]" /></div>}
              {!loadingGroups && groups.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <div className="text-3xl mb-2">👥</div>No groups yet<br />
                  <span className="text-xs">Create one to get started</span>
                </div>
              )}
              {groups.map(g => (
                <button key={g._id} onClick={() => { setSelectedGroup(g); setSelected(null) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${selectedGroup?._id === g._id ? 'bg-[#1a3c5e]/5' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {g.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{g.name}</p>
                    <p className="text-xs text-gray-400">{g.members?.length || 0} members</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Conversation pane ── */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <button onClick={() => setSelected(null)} className="md:hidden p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition">
              <ArrowLeft size={18} />
            </button>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${isSelf ? 'bg-gradient-to-br from-amber-400 to-amber-500' : 'bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e]'}`}>
              {selected.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#1a3c5e] text-sm truncate">{selected.fullName}{isSelf ? ' (You)' : ''}</p>
              <div className="flex items-center gap-1.5">
                {isSelf
                  ? <span className="text-xs text-amber-500">📝 Note to self</span>
                  : friendStatus === 'accepted'
                  ? <span className="text-xs text-emerald-500 flex items-center gap-1"><UserCheck size={10}/> Friends</span>
                  : friendStatus === 'pending'
                  ? <span className="text-xs text-amber-500 flex items-center gap-1"><Clock size={10}/> Pending</span>
                  : <span className="text-xs text-gray-400 capitalize">{selected.accountType}</span>
                }
              </div>
            </div>
            {!isSelf && (friendStatus === 'none' || friendStatus === 'rejected') && (
              <button onClick={sendFR} disabled={sendingFR}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1a3c5e] bg-[#1a3c5e]/5 hover:bg-[#1a3c5e]/10 rounded-full transition disabled:opacity-60">
                {sendingFR ? <Loader2 size={10} className="animate-spin" /> : <UserPlus size={10} />}
                Add Friend
              </button>
            )}
          </div>

          {/* Friend request banner — they sent ME a request */}
          {theyRequestedMe && (
            <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between flex-shrink-0">
              <p className="text-xs text-emerald-700 font-medium">{selected.fullName.split(' ')[0]} wants to be friends 👋</p>
              <div className="flex gap-1.5">
                <button onClick={acceptFR} className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded-full transition">Accept</button>
                <button onClick={rejectFR} className="text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition">Decline</button>
              </div>
            </div>
          )}

          {/* Waiting banner — I sent the request */}
          {iSentRequest && (
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2 flex-shrink-0">
              <Clock size={12} className="text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-medium">Friend request sent — waiting for {selected.fullName.split(' ')[0]} to accept</p>
            </div>
          )}

          {/* Message limit warning */}
          {!isSelf && friendStatus !== 'accepted' && remaining !== null && remaining <= 3 && (
            <div className={`px-4 py-2 flex items-center gap-2 flex-shrink-0 ${remaining === 0 ? 'bg-red-50 border-b border-red-100' : 'bg-amber-50 border-b border-amber-100'}`}>
              <AlertCircle size={12} className={remaining === 0 ? 'text-red-400' : 'text-amber-500'} />
              <p className={`text-xs font-medium ${remaining === 0 ? 'text-red-600' : 'text-amber-700'}`}>
                {remaining === 0
                  ? '🔒 Intro limit reached — accept the friend request to keep chatting'
                  : remaining === 1
                  ? '⚡ Last intro message — send a friend request to keep chatting after this'
                  : `💬 ${remaining} intro messages left — add each other as friends for unlimited chat`}
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-2.5 bg-gray-50">
            {loadingMsgs && <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#1a3c5e]" /></div>}
            {!loadingMsgs && messages.length === 0 && (
              <div className="text-center py-16 text-gray-400 text-sm">
                {isSelf ? '📝 Your private notes — only you can see these' : 'Say hello 👋'}
              </div>
            )}
            {messages.map((m, i) => {
              const mine = (m.sender?._id || m.sender) === user._id
              const isSticker = m.messageType === 'sticker'
              const isMedia = m.messageType === 'media'
              return (
                <div key={m._id || i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  {isSticker ? (
                    <div className={`max-w-[40%] px-4 py-3 rounded-2xl text-center text-sm font-bold whitespace-pre-line leading-snug ${mine ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-100 shadow-sm'}`}>
                      {m.content}
                    </div>
                  ) : isMedia ? (
                    <div className={`max-w-[60%] rounded-2xl overflow-hidden ${mine ? 'rounded-br-md' : 'rounded-bl-md shadow-sm'}`}>
                      {m.mediaType === 'image' ? (
                        <img src={m.mediaUrl} alt="" className="max-w-full rounded-2xl cursor-pointer" onClick={() => window.open(m.mediaUrl, '_blank')} />
                      ) : m.mediaType === 'video' ? (
                        <video src={m.mediaUrl} controls playsInline className="max-w-full rounded-2xl" />
                      ) : (
                        <a href={m.mediaUrl} target="_blank" rel="noreferrer"
                          className={`flex items-center gap-2 px-4 py-3 text-sm ${mine ? 'bg-[#1a3c5e] text-white' : 'bg-white text-gray-800 border border-gray-100'}`}>
                          <File size={16} /> {m.mediaName || 'File'}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      mine ? 'bg-[#1a3c5e] text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                    }`}>
                      {m.content}
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Media preview strip */}
          {mediaFile && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 flex items-center gap-2 flex-shrink-0">
              <ImageIcon size={13} className="text-amber-600" />
              <span className="text-xs text-amber-700 flex-1 truncate font-medium">{mediaFile.name}</span>
              <button onClick={() => setMediaFile(null)} className="text-amber-600 hover:text-red-500 transition">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white flex-shrink-0 relative">
            {showEmoji && (
              <EmojiStickerPicker onEmoji={onEmoji} onSticker={onSticker} onSendCustomSticker={onSendCustomSticker} onClose={() => setShowEmoji(false)} />
            )}
            <button onClick={() => setShowEmoji(v => !v)}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition flex-shrink-0 ${showEmoji ? 'bg-amber-100 text-amber-500' : 'text-gray-400 hover:bg-gray-100'}`}>
              <Smile size={18} />
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition flex-shrink-0">
              <Paperclip size={17} />
            </button>
            <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && canMessage && sendMsg()}
              placeholder={
                !canMessage ? 'Add friend to continue…'
                : isSelf ? 'Write a note…'
                : `Message ${selected.fullName.split(' ')[0]}…`
              }
              disabled={!canMessage}
              className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-sm focus:outline-none text-gray-700 border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" />
            <button onClick={() => sendMsg()} disabled={(!text.trim() && !mediaFile) || sending || !canMessage}
              className="w-10 h-10 bg-[#1a3c5e] rounded-full flex items-center justify-center text-white disabled:opacity-40 hover:bg-[#152f4a] transition flex-shrink-0">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={15} />}
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={e => {
              const f = e.target.files[0]; if (!f) return
              if (f.size > 100 * 1024 * 1024) { toast.error('File must be under 100 MB.'); return }
              setMediaFile(f); e.target.value = ''
            }} accept="image/*,video/*,application/pdf,.doc,.docx,.zip" />
          </div>
        </div>
      ) : selectedGroup ? (
        /* ── Group conversation pane ── */
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-w-0">
          {/* Group header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <button onClick={() => setSelectedGroup(null)} className="md:hidden p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition">
              <ArrowLeft size={18} />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {selectedGroup.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#1a3c5e] text-sm truncate">{selectedGroup.name}</p>
              <p className="text-xs text-gray-400">{selectedGroup.members?.length || 0} members</p>
            </div>
            {/* Members dropdown */}
            <div className="relative">
              <button onClick={() => setShowGroupMembers(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition">
                <Users size={13} /> <ChevronDown size={11} />
              </button>
              {showGroupMembers && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-50">
                    <p className="text-xs font-bold text-gray-500">Members ({selectedGroup.members?.length})</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {selectedGroup.members?.map(m => (
                      <div key={m._id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {m.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{m.fullName}{m._id === user._id ? ' (You)' : ''}</p>
                          {selectedGroup.admins?.some(a => (a._id || a) === m._id) && (
                            <p className="text-[10px] text-amber-500 font-bold">Admin</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-50 p-2 space-y-1">
                    <button onClick={() => { setShowGroupMembers(false); leaveGroup() }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition">
                      <LogOut size={12} /> Leave Group
                    </button>
                    {selectedGroup.createdBy?._id === user._id && (
                      <button onClick={() => { setShowGroupMembers(false); deleteGroup() }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={12} /> Delete Group
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Group messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-2.5 bg-gray-50">
            {loadingGroupMsgs && <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#1a3c5e]" /></div>}
            {!loadingGroupMsgs && groupMessages.length === 0 && (
              <div className="text-center py-16 text-gray-400 text-sm">
                <div className="text-3xl mb-2">👥</div>
                Group created! Say hello to everyone 👋
              </div>
            )}
            {groupMessages.map((m, i) => {
              const mine = (m.sender?._id || m.sender) === user._id
              const isSticker = m.messageType === 'sticker'
              const isMedia = m.messageType === 'media'
              const senderName = m.sender?.fullName
              const showName = !mine && senderName
              return (
                <div key={m._id || i} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  {showName && <p className="text-[10px] text-gray-400 font-semibold mb-0.5 px-1">{senderName}</p>}
                  <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    {isSticker ? (
                      <div className={`max-w-[40%] px-4 py-3 rounded-2xl text-center text-sm font-bold whitespace-pre-line leading-snug ${mine ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-100 shadow-sm'}`}>
                        {m.content}
                      </div>
                    ) : isMedia ? (
                      <div className={`max-w-[60%] rounded-2xl overflow-hidden ${mine ? 'rounded-br-md' : 'rounded-bl-md shadow-sm'}`}>
                        {m.mediaType === 'image' ? (
                          <img src={m.mediaUrl} alt="" className="max-w-full rounded-2xl cursor-pointer" onClick={() => window.open(m.mediaUrl, '_blank')} />
                        ) : m.mediaType === 'video' ? (
                          <video src={m.mediaUrl} controls playsInline className="max-w-full rounded-2xl" />
                        ) : (
                          <a href={m.mediaUrl} target="_blank" rel="noreferrer"
                            className={`flex items-center gap-2 px-4 py-3 text-sm ${mine ? 'bg-[#1a3c5e] text-white' : 'bg-white text-gray-800 border border-gray-100'}`}>
                            <File size={16} /> {m.mediaName || 'File'}
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        mine ? 'bg-[#1a3c5e] text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                      }`}>
                        {m.content}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={groupBottomRef} />
          </div>

          {/* Group media preview */}
          {groupMediaFile && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 flex items-center gap-2 flex-shrink-0">
              <ImageIcon size={13} className="text-amber-600" />
              <span className="text-xs text-amber-700 flex-1 truncate font-medium">{groupMediaFile.name}</span>
              <button onClick={() => setGroupMediaFile(null)} className="text-amber-600 hover:text-red-500 transition"><X size={14} /></button>
            </div>
          )}

          {/* Group input */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white flex-shrink-0 relative">
            {showGroupEmoji && (
              <EmojiStickerPicker onEmoji={onGroupEmoji} onSticker={onGroupSticker} onSendCustomSticker={onGroupCustomSticker} onClose={() => setShowGroupEmoji(false)} />
            )}
            <button onClick={() => setShowGroupEmoji(v => !v)}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition flex-shrink-0 ${showGroupEmoji ? 'bg-amber-100 text-amber-500' : 'text-gray-400 hover:bg-gray-100'}`}>
              <Smile size={18} />
            </button>
            <button onClick={() => groupFileRef.current?.click()}
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition flex-shrink-0">
              <Paperclip size={17} />
            </button>
            <input ref={groupInputRef} value={groupText} onChange={e => setGroupText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendGroupMsg()}
              placeholder={`Message ${selectedGroup.name}…`}
              className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-sm focus:outline-none text-gray-700 border border-gray-100" />
            <button onClick={() => sendGroupMsg()} disabled={(!groupText.trim() && !groupMediaFile) || sendingGroup}
              className="w-10 h-10 bg-[#1a3c5e] rounded-full flex items-center justify-center text-white disabled:opacity-40 hover:bg-[#152f4a] transition flex-shrink-0">
              {sendingGroup ? <Loader2 size={14} className="animate-spin" /> : <Send size={15} />}
            </button>
            <input ref={groupFileRef} type="file" className="hidden" onChange={e => {
              const f = e.target.files[0]; if (!f) return
              if (f.size > 100 * 1024 * 1024) { toast.error('File must be under 100 MB.'); return }
              setGroupMediaFile(f); e.target.value = ''
            }} accept="image/*,video/*,application/pdf,.doc,.docx,.zip" />
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#1a3c5e]/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MessageCircle size={28} className="text-[#1a3c5e]/30" />
            </div>
            <p className="font-semibold text-gray-500 text-sm">Select a conversation</p>
            <p className="text-gray-400 text-xs mt-1">Pick someone from the list or start a group chat</p>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <CreateGroupModal
          users={users}
          currentUser={user}
          onClose={() => setShowCreateGroup(false)}
          onCreate={(g) => {
            setGroups(prev => [g, ...prev])
            setSelectedGroup(g)
            setSelected(null)
            setSidebarTab('groups')
          }}
        />
      )}
    </div>
  )
}
