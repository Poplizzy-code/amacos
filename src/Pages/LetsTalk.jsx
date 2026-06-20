import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import {
  MessageSquare, Users, Zap, Send, Plus, Search, ArrowLeft,
  Loader2, X, Heart, Trash2, Image as ImageIcon,
  LogOut, ChevronDown, ChevronUp, UserPlus, Edit2, Check, Camera,
} from 'lucide-react'

// ── Shared ────────────────────────────────────────────────────────────────────
const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)    return `${s}s`
  if (s < 3600)  return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}
const lvlLabel = (u) =>
  u?.accountType === 'staff' ? 'Staff' : u?.isAlumni ? 'Alumni' : u?.level ? `${u.level}L` : 'Student'

const BG = '#060d1a'
const SB = '#0a1929'
const B2 = '#0d2137'

function Av({ name, src, size = 9 }) {
  const px = size * 4
  const base = `rounded-full flex-shrink-0 object-cover`
  const style = { width: px, height: px, minWidth: px, minHeight: px }
  if (src) return <img src={src} alt={name} className={base} style={style} />
  return (
    <div className={`${base} bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center text-white font-bold`}
      style={{ ...style, fontSize: size > 8 ? 14 : 11 }}>
      {name?.charAt(0)?.toUpperCase()}
    </div>
  )
}

// ── Chats ─────────────────────────────────────────────────────────────────────
function ChatsPane({ user }) {
  const { getSocket } = useSocket()
  const [contacts, setContacts] = useState([])
  const [loadingC, setLoadingC] = useState(true)
  const [search, setSearch]     = useState('')
  const [sel, setSel]           = useState(null)
  const [msgs, setMsgs]         = useState([])
  const [loadingM, setLoadingM] = useState(false)
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const [menuId, setMenuId]     = useState(null)   // message id with open context menu
  const bottomRef = useRef()
  const inputRef  = useRef()

  useEffect(() => {
    axios.get('/api/users/community')
      .then(r => setContacts(r.data.users?.filter(u => u._id !== user._id) || []))
      .catch(() => {})
      .finally(() => setLoadingC(false))
  }, [user._id])

  useEffect(() => {
    if (!sel) return
    setLoadingM(true); setMsgs([]); setMenuId(null)
    axios.get(`/api/messages/${sel._id}`)
      .then(r => setMsgs(r.data.messages || []))
      .catch(() => {})
      .finally(() => setLoadingM(false))
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [sel?._id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !sel) return
    const onMsg = (m) => {
      const sid = m.sender?._id || m.sender
      if (sid === sel._id || sid === user._id)
        setMsgs(p => p.some(x => x._id === m._id) ? p : [...p, m])
    }
    socket.on('new_message', onMsg)
    return () => socket.off('new_message', onMsg)
  }, [getSocket, sel?._id, user._id])

  const send = async () => {
    if (!text.trim() || sending || !sel) return
    setSending(true)
    const tmp = { _id: `tmp-${Date.now()}`, content: text.trim(), sender: { _id: user._id }, createdAt: new Date().toISOString() }
    setMsgs(p => [...p, tmp]); setText('')
    try {
      const fd = new FormData()
      fd.append('recipientId', sel._id); fd.append('content', tmp.content); fd.append('messageType', 'text')
      const { data } = await axios.post('/api/messages', fd)
      setMsgs(p => p.map(m => m._id === tmp._id ? data.message : m))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
      setMsgs(p => p.filter(m => m._id !== tmp._id))
    } finally { setSending(false) }
  }

  const deleteMsg = async (id) => {
    try {
      await axios.delete(`/api/messages/${id}`)
      setMsgs(p => p.filter(m => m._id !== id)); setMenuId(null)
      toast.success('Message deleted.')
    } catch { toast.error('Could not delete.') }
  }

  const filtered = contacts.filter(c => c.fullName?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex h-full overflow-hidden">
      {/* Contact list */}
      <div className={`${sel ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-72 xl:w-80 border-r border-white/10 flex-shrink-0 overflow-hidden`} style={{ background: SB }}>
        <div className="px-3 py-2.5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-2 border border-white/5">
            <Search size={13} className="text-gray-500 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…"
              style={{ fontSize: 16 }}
              className="flex-1 min-w-0 bg-transparent text-white placeholder-gray-600 focus:outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingC
            ? <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-amber-400" /></div>
            : filtered.length === 0
              ? <p className="text-center text-gray-600 text-sm py-10">No members found.</p>
              : filtered.map(c => (
                  <button key={c._id} onClick={() => setSel(c)}
                    className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition border-b border-white/5 ${sel?._id === c._id ? 'bg-white/5 border-l-2 border-amber-400' : ''}`}>
                    <Av name={c.fullName} src={c.avatar} size={10} />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-white text-sm font-semibold truncate">{c.fullName}</p>
                      <p className="text-gray-500 text-xs">{lvlLabel(c)}</p>
                    </div>
                  </button>
                ))
          }
        </div>
      </div>

      {/* Chat */}
      <div className={`${sel ? 'flex' : 'hidden lg:flex'} flex-col flex-1 min-w-0 overflow-hidden`} style={{ background: BG }}>
        {sel ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-white/10 flex-shrink-0" style={{ background: SB }}>
              <button onClick={() => { setSel(null); setMenuId(null) }} className="lg:hidden p-1.5 text-gray-400 hover:text-white flex-shrink-0">
                <ArrowLeft size={17} />
              </button>
              <Av name={sel.fullName} src={sel.avatar} size={9} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{sel.fullName}</p>
                <p className="text-gray-500 text-[11px]">{lvlLabel(sel)}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3" onClick={() => setMenuId(null)}>
              <div className="flex flex-col gap-1">
                {loadingM
                  ? <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-amber-400" /></div>
                  : msgs.length === 0
                    ? <div className="flex items-center justify-center h-40"><p className="text-gray-600 text-sm">Say hi to {sel.fullName?.split(' ')[0]} 👋</p></div>
                    : msgs.map((m, i) => {
                        const isMe = (m.sender?._id || m.sender) === user._id
                        const open  = menuId === m._id
                        return (
                          <div key={m._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className="flex flex-col" style={{ alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                              <div
                                className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                                  isMe ? 'bg-amber-400 text-[#0a1929] font-medium rounded-br-sm' : 'text-white rounded-bl-sm'
                                } ${open ? 'ring-2 ring-red-400/50' : ''}`}
                                style={{ ...(!isMe ? { background: B2 } : {}), wordBreak: 'break-word', overflowWrap: 'break-word', cursor: isMe ? 'pointer' : 'default' }}
                                onClick={e => { if (!isMe) return; e.stopPropagation(); setMenuId(open ? null : m._id) }}>
                                {m.content}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 px-0.5" style={{ flexDirection: isMe ? 'row-reverse' : 'row' }}>
                                <span className="text-[10px] text-gray-600">{timeAgo(m.createdAt)}</span>
                                {open && isMe && (
                                  <button onClick={e => { e.stopPropagation(); deleteMsg(m._id) }}
                                    className="flex items-center gap-1 text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20 hover:bg-red-400/20 transition">
                                    <Trash2 size={9} /> Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                }
              </div>
              <div ref={bottomRef} />
            </div>

            {/* Input — font-size:16px prevents iOS zoom */}
            <div className="px-2 py-2 border-t border-white/10 flex gap-1.5 flex-shrink-0" style={{ background: SB }}>
              <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                placeholder={`Message ${sel.fullName?.split(' ')[0]}…`}
                style={{ fontSize: 16 }}
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/40" />
              <button onClick={send} disabled={sending || !text.trim()}
                className="p-2.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] rounded-2xl transition disabled:opacity-40 flex-shrink-0">
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <MessageSquare size={28} className="text-gray-700 mb-3" />
            <p className="text-gray-400 font-semibold text-sm">Select a contact</p>
            <p className="text-gray-600 text-xs mt-1">Pick someone to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Groups ────────────────────────────────────────────────────────────────────
function GroupsPane({ user }) {
  const { getSocket } = useSocket()
  const [groups, setGroups]     = useState([])
  const [loadingG, setLoadingG] = useState(true)
  const [search, setSearch]     = useState('')
  const [sel, setSel]           = useState(null)
  const [msgs, setMsgs]         = useState([])
  const [loadingM, setLoadingM] = useState(false)
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const [menuId, setMenuId]     = useState(null)

  // Create
  const [showCreate, setCreate] = useState(false)
  const [cName, setCName]       = useState('')
  const [cDesc, setCDesc]       = useState('')
  const [creating, setCreating] = useState(false)

  // Info panel
  const [showInfo, setShowInfo] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const avatarRef = useRef()

  // Add members
  const [showAdd, setShowAdd]   = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [mSearch, setMSearch]   = useState('')
  const [toAdd, setToAdd]       = useState([])

  const bottomRef = useRef()
  const inputRef  = useRef()

  useEffect(() => {
    setLoadingG(true)
    axios.get('/api/groups')
      .then(r => setGroups(r.data.groups || []))
      .catch(() => {})
      .finally(() => setLoadingG(false))
  }, [user._id])

  useEffect(() => {
    if (!sel) return
    setLoadingM(true); setMsgs([]); setMenuId(null)
    axios.get(`/api/groups/${sel._id}/messages`)
      .then(r => setMsgs(r.data.messages || []))
      .catch(() => {})
      .finally(() => setLoadingM(false))
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [sel?._id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const onMsg = ({ groupId, message }) => {
      if (sel?._id === groupId) setMsgs(p => p.some(m => m._id === message._id) ? p : [...p, message])
      setGroups(p => {
        const g = p.find(g => g._id === groupId); if (!g) return p
        return [{ ...g, updatedAt: new Date().toISOString() }, ...p.filter(x => x._id !== groupId)]
      })
    }
    const onAdded = ({ group }) => {
      setGroups(p => p.some(g => g._id === group._id) ? p : [group, ...p])
      toast(`Added to "${group.name}"`)
    }
    socket.on('group_message', onMsg); socket.on('group_added', onAdded)
    return () => { socket.off('group_message', onMsg); socket.off('group_added', onAdded) }
  }, [getSocket, sel?._id])

  const send = async () => {
    if (!text.trim() || sending || !sel) return
    setSending(true)
    const tmp = { _id: `tmp-${Date.now()}`, content: text.trim(), sender: { _id: user._id, fullName: user.fullName, avatar: user.avatar }, createdAt: new Date().toISOString() }
    setMsgs(p => [...p, tmp]); setText('')
    try {
      const { data } = await axios.post(`/api/groups/${sel._id}/messages`, { content: tmp.content })
      setMsgs(p => p.map(m => m._id === tmp._id ? data.message : m))
    } catch { toast.error('Failed.'); setMsgs(p => p.filter(m => m._id !== tmp._id)) }
    finally { setSending(false) }
  }

  const deleteMsg = async (id) => {
    try {
      await axios.delete(`/api/groups/${sel._id}/messages/${id}`)
      setMsgs(p => p.filter(m => m._id !== id)); setMenuId(null)
      toast.success('Message deleted.')
    } catch { toast.error('Could not delete.') }
  }

  const createGroup = async () => {
    if (!cName.trim()) return toast.error('Name required.')
    setCreating(true)
    try {
      const { data } = await axios.post('/api/groups', { name: cName.trim(), description: cDesc.trim() })
      setGroups(p => [data.group, ...p]); setSel(data.group)
      setCName(''); setCDesc(''); setCreate(false); toast.success('Group created!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setCreating(false) }
  }

  const pickAvatar = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f))
    e.target.value = ''
  }

  const saveEdit = async () => {
    if (!editName.trim()) return toast.error('Name required.')
    setSaving(true)
    try {
      let data
      if (avatarFile) {
        const fd = new FormData()
        fd.append('name', editName); fd.append('description', editDesc); fd.append('avatar', avatarFile)
        ;({ data } = await axios.put(`/api/groups/${sel._id}`, fd))
      } else {
        ;({ data } = await axios.put(`/api/groups/${sel._id}`, { name: editName, description: editDesc }, { headers: { 'Content-Type': 'application/json' } }))
      }
      setSel(data.group); setGroups(p => p.map(g => g._id === data.group._id ? data.group : g))
      setEditing(false); setAvatarFile(null); setAvatarPreview(''); toast.success('Updated.')
    } catch { toast.error('Failed.') }
    finally { setSaving(false) }
  }

  const deleteGroup = async () => {
    if (!window.confirm(`Delete "${sel.name}"? This is permanent.`)) return
    try {
      await axios.delete(`/api/groups/${sel._id}`)
      setGroups(p => p.filter(g => g._id !== sel._id)); setSel(null); setShowInfo(false)
      toast.success('Group deleted.')
    } catch { toast.error('Failed.') }
  }

  const leaveGroup = async () => {
    try {
      await axios.post(`/api/groups/${sel._id}/leave`)
      setGroups(p => p.filter(g => g._id !== sel._id)); setSel(null); setShowInfo(false)
      toast.success('Left group.')
    } catch { toast.error('Failed.') }
  }

  const removeMember = async (mid) => {
    try {
      await axios.delete(`/api/groups/${sel._id}/members/${mid}`)
      const updated = { ...sel, members: sel.members.filter(m => (m._id || m) !== mid) }
      setSel(updated); setGroups(p => p.map(g => g._id === updated._id ? updated : g))
    } catch { toast.error('Failed.') }
  }

  const openAdd = async () => {
    setShowAdd(true); setMSearch(''); setToAdd([])
    if (!allUsers.length) {
      const { data } = await axios.get('/api/users/community')
      setAllUsers(data.users || [])
    }
  }

  const addMembers = async () => {
    if (!toAdd.length) return
    try {
      const { data } = await axios.post(`/api/groups/${sel._id}/members`, { memberIds: toAdd })
      setSel(data.group); setGroups(p => p.map(g => g._id === data.group._id ? data.group : g))
      setShowAdd(false); setToAdd([]); toast.success('Members added!')
    } catch { toast.error('Failed.') }
  }

  const isAdmin   = sel && (sel.admins || []).some(a => (a._id || a) === user._id)
  const isCreator = sel && ((sel.createdBy?._id || sel.createdBy) === user._id)
  const filtered  = groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()))
  const nonMembers = allUsers.filter(u => u._id !== user._id && !(sel?.members || []).some(m => (m._id || m) === u._id))
  const filteredNM = nonMembers.filter(u => u.fullName?.toLowerCase().includes(mSearch.toLowerCase()))

  const openInfo = () => {
    setEditName(sel?.name || ''); setEditDesc(sel?.description || '')
    setEditing(false); setAvatarFile(null); setAvatarPreview(''); setShowInfo(true)
  }

  return (
    <>
      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-3 pb-3 sm:pb-0">
          <div className="w-full max-w-md rounded-2xl border border-white/10 shadow-2xl" style={{ background: SB }}>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
              <p className="text-white font-bold text-sm">New Group</p>
              <button onClick={() => setCreate(false)}><X size={14} className="text-gray-400" /></button>
            </div>
            <div className="p-4 space-y-2.5">
              <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Group name *"
                style={{ fontSize: 16 }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/40" />
              <textarea value={cDesc} onChange={e => setCDesc(e.target.value)} rows={2} placeholder="Description (optional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400/40 resize-none" />
              <div className="flex gap-2 pt-1">
                <button onClick={createGroup} disabled={creating || !cName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] font-bold text-sm rounded-xl transition disabled:opacity-50">
                  {creating && <Loader2 size={13} className="animate-spin" />} Create
                </button>
                <button onClick={() => setCreate(false)} className="px-4 bg-white/10 text-gray-300 text-sm rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group info / settings panel */}
      {showInfo && sel && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowInfo(false)}>
          <div className="w-full max-w-xs h-full border-l border-white/10 flex flex-col overflow-hidden shadow-2xl"
            style={{ background: SB }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 flex-shrink-0">
              <p className="text-white font-bold text-sm">Group Settings</p>
              <button onClick={() => setShowInfo(false)}><X size={14} className="text-gray-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Avatar section */}
              <div className="flex flex-col items-center px-4 py-5 border-b border-white/5">
                <div className="relative">
                  {avatarPreview || sel.avatar
                    ? <img src={avatarPreview || sel.avatar} alt={sel.name} className="w-20 h-20 rounded-full object-cover" />
                    : <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center text-white text-3xl font-bold">
                        {sel.name?.charAt(0).toUpperCase()}
                      </div>
                  }
                  {isAdmin && (
                    <button onClick={() => avatarRef.current?.click()}
                      className="absolute bottom-0 right-0 w-7 h-7 bg-amber-400 hover:bg-amber-300 rounded-full flex items-center justify-center shadow-lg transition">
                      <Camera size={13} className="text-[#0a1929]" />
                    </button>
                  )}
                  <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
                </div>
                {avatarPreview && isAdmin && (
                  <p className="text-amber-400 text-xs mt-2">Photo selected — save to apply</p>
                )}
              </div>

              {/* Name & description */}
              <div className="px-4 py-4 border-b border-white/5">
                {editing ? (
                  <div className="space-y-2">
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      style={{ fontSize: 16 }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400/40" />
                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} placeholder="Description"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400/40 resize-none" />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-400 text-[#0a1929] text-xs font-bold rounded-xl disabled:opacity-50">
                        {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
                      </button>
                      <button onClick={() => { setEditing(false); setAvatarFile(null); setAvatarPreview('') }}
                        className="px-3 py-1.5 bg-white/10 text-gray-300 text-xs rounded-xl">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold">{sel.name}</p>
                      {sel.description && <p className="text-gray-400 text-xs mt-0.5">{sel.description}</p>}
                    </div>
                    {isAdmin && (
                      <button onClick={() => setEditing(true)} className="p-1 text-gray-500 hover:text-amber-400 transition flex-shrink-0">
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Members */}
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{(sel.members || []).length} Members</p>
                  {isAdmin && (
                    <button onClick={openAdd} className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition">
                      <UserPlus size={12} /> Add
                    </button>
                  )}
                </div>
                <div className="space-y-2.5">
                  {(sel.members || []).map(m => {
                    const mid = m._id || m
                    const mIsCreator = (sel.createdBy?._id || sel.createdBy) === mid
                    return (
                      <div key={mid} className="flex items-center gap-2.5">
                        <Av name={m.fullName} src={m.avatar} size={8} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{m.fullName || 'Member'}</p>
                          <p className="text-gray-600 text-[10px]">{mIsCreator ? 'Creator' : lvlLabel(m)}</p>
                        </div>
                        {isAdmin && mid !== user._id && !mIsCreator && (
                          <button onClick={() => removeMember(mid)} className="p-1 text-gray-600 hover:text-red-400 transition flex-shrink-0">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="px-4 py-3 border-t border-white/10 space-y-2 flex-shrink-0">
              {isCreator ? (
                <button onClick={deleteGroup}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 text-red-400 text-sm font-semibold rounded-xl hover:bg-red-500/20 transition">
                  <Trash2 size={14} /> Delete Group
                </button>
              ) : (
                <button onClick={leaveGroup}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 text-gray-400 text-sm font-semibold rounded-xl hover:bg-white/10 transition">
                  <LogOut size={14} /> Leave Group
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add members modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 px-3 pb-3 sm:pb-0">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl flex flex-col" style={{ maxHeight: '80vh', background: SB }}>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 flex-shrink-0">
              <p className="text-white font-bold text-sm">Add Members</p>
              <button onClick={() => setShowAdd(false)}><X size={14} className="text-gray-400" /></button>
            </div>
            <div className="px-3 py-2 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                <Search size={13} className="text-gray-500" />
                <input value={mSearch} onChange={e => setMSearch(e.target.value)} placeholder="Search…"
                  style={{ fontSize: 16 }}
                  className="flex-1 min-w-0 bg-transparent text-white placeholder-gray-600 focus:outline-none" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredNM.length === 0
                ? <p className="text-center text-gray-600 text-sm py-6">No users to add.</p>
                : filteredNM.map(u => {
                    const picked = toAdd.includes(u._id)
                    return (
                      <button key={u._id} onClick={() => setToAdd(p => picked ? p.filter(id => id !== u._id) : [...p, u._id])}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition ${picked ? 'bg-amber-400/5' : ''}`}>
                        <Av name={u.fullName} src={u.avatar} size={8} />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-white text-sm truncate">{u.fullName}</p>
                          <p className="text-gray-500 text-xs">{lvlLabel(u)}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${picked ? 'border-amber-400 bg-amber-400' : 'border-gray-600'}`}>
                          {picked && <Check size={10} className="text-[#0a1929]" />}
                        </div>
                      </button>
                    )
                  })
              }
            </div>
            <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
              <button onClick={addMembers} disabled={!toAdd.length}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] font-bold text-sm rounded-xl transition disabled:opacity-40">
                Add {toAdd.length > 0 ? toAdd.length : ''} Member{toAdd.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-full overflow-hidden">
        {/* Group list */}
        <div className={`${sel ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-72 xl:w-80 border-r border-white/10 flex-shrink-0 overflow-hidden`} style={{ background: SB }}>
          <div className="px-3 py-2.5 border-b border-white/5 flex gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-2 border border-white/5 flex-1 min-w-0">
              <Search size={13} className="text-gray-500 flex-shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups…"
                style={{ fontSize: 16 }}
                className="flex-1 min-w-0 bg-transparent text-white placeholder-gray-600 focus:outline-none" />
            </div>
            <button onClick={() => setCreate(true)} className="p-2.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] rounded-2xl transition flex-shrink-0">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingG
              ? <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-amber-400" /></div>
              : filtered.length === 0
                ? <p className="text-center text-gray-600 text-sm py-10">No groups yet.</p>
                : filtered.map(g => (
                    <button key={g._id} onClick={() => setSel(g)}
                      className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition border-b border-white/5 ${sel?._id === g._id ? 'bg-white/5 border-l-2 border-amber-400' : ''}`}>
                      {g.avatar
                        ? <img src={g.avatar} alt={g.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                            {g.name?.charAt(0).toUpperCase()}
                          </div>
                      }
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-white text-sm font-semibold truncate">{g.name}</p>
                        <p className="text-gray-500 text-xs">{(g.members || []).length} members</p>
                      </div>
                    </button>
                  ))
            }
          </div>
        </div>

        {/* Group chat */}
        <div className={`${sel ? 'flex' : 'hidden lg:flex'} flex-col flex-1 min-w-0 overflow-hidden`} style={{ background: BG }}>
          {sel ? (
            <>
              {/* Header — clicking name/avatar opens settings */}
              <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-white/10 flex-shrink-0" style={{ background: SB }}>
                <button onClick={() => { setSel(null); setMenuId(null) }} className="lg:hidden p-1.5 text-gray-400 hover:text-white flex-shrink-0">
                  <ArrowLeft size={17} />
                </button>
                <button onClick={openInfo} className="flex items-center gap-2.5 flex-1 min-w-0 text-left hover:opacity-80 transition">
                  {sel.avatar
                    ? <img src={sel.avatar} alt={sel.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                        {sel.name?.charAt(0).toUpperCase()}
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{sel.name}</p>
                    <p className="text-gray-500 text-[11px]">{(sel.members || []).length} members · tap for settings</p>
                  </div>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3" onClick={() => setMenuId(null)}>
                <div className="flex flex-col gap-1">
                  {loadingM
                    ? <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-amber-400" /></div>
                    : msgs.length === 0
                      ? <div className="flex items-center justify-center h-40"><p className="text-gray-600 text-sm">No messages yet 👋</p></div>
                      : msgs.map((m, i) => {
                          const isMe = m.sender?._id === user._id
                          const open  = menuId === m._id
                          return (
                            <div key={m._id || i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                              {!isMe && <Av name={m.sender?.fullName} src={m.sender?.avatar} size={7} />}
                              <div className="flex flex-col" style={{ alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                                {!isMe && <p className="text-[10px] text-amber-400/80 font-semibold mb-0.5 pl-1">{m.sender?.fullName?.split(' ')[0]}</p>}
                                <div
                                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                                    isMe ? 'bg-amber-400 text-[#0a1929] font-medium rounded-br-sm' : 'text-white rounded-bl-sm'
                                  } ${open ? 'ring-2 ring-red-400/50' : ''}`}
                                  style={{ ...(!isMe ? { background: B2 } : {}), wordBreak: 'break-word', overflowWrap: 'break-word', cursor: isMe ? 'pointer' : 'default' }}
                                  onClick={e => { if (!isMe) return; e.stopPropagation(); setMenuId(open ? null : m._id) }}>
                                  {m.content}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 px-0.5" style={{ flexDirection: isMe ? 'row-reverse' : 'row' }}>
                                  <span className="text-[10px] text-gray-600">{timeAgo(m.createdAt)}</span>
                                  {open && isMe && (
                                    <button onClick={e => { e.stopPropagation(); deleteMsg(m._id) }}
                                      className="flex items-center gap-1 text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20 hover:bg-red-400/20 transition">
                                      <Trash2 size={9} /> Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                  }
                </div>
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-2 py-2 border-t border-white/10 flex gap-1.5 flex-shrink-0" style={{ background: SB }}>
                <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder={`Message ${sel.name}…`}
                  style={{ fontSize: 16 }}
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/40" />
                <button onClick={send} disabled={sending || !text.trim()}
                  className="p-2.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] rounded-2xl transition disabled:opacity-40 flex-shrink-0">
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <Users size={28} className="text-gray-700 mb-3" />
              <p className="text-gray-400 font-semibold text-sm">Select a group</p>
              <p className="text-gray-600 text-xs mt-1">Create or join a group to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Pulse ─────────────────────────────────────────────────────────────────────
function PulsePane({ user }) {
  const [pulses, setPulses]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [text, setText]             = useState('')
  const [imgFile, setImgFile]       = useState(null)
  const [imgPreview, setImgPreview] = useState('')
  const [posting, setPosting]       = useState(false)
  const [expanded, setExpanded]     = useState({})
  const [replyText, setReplyText]   = useState({})
  const [replyingTo, setReplyingTo] = useState(null)
  const fileRef = useRef()
  const MAX = 500

  const load = useCallback(() => {
    setLoading(true)
    axios.get('/api/pulse')
      .then(r => setPulses(r.data.pulses || []))
      .catch(() => toast.error('Failed to load.'))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const pickImg = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    if (f.size > 10 * 1024 * 1024) return toast.error('Max 10MB.')
    setImgFile(f); setImgPreview(URL.createObjectURL(f)); e.target.value = ''
  }

  const post = async () => {
    if (!text.trim() || posting) return
    setPosting(true)
    try {
      let data
      if (imgFile) {
        const fd = new FormData(); fd.append('content', text.trim()); fd.append('image', imgFile)
        ;({ data } = await axios.post('/api/pulse', fd))
      } else {
        ;({ data } = await axios.post('/api/pulse', { content: text.trim() }, { headers: { 'Content-Type': 'application/json' } }))
      }
      setPulses(p => [data.pulse, ...p]); setText(''); setImgFile(null); setImgPreview('')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setPosting(false) }
  }

  const like = async (id) => {
    try {
      const { data } = await axios.post(`/api/pulse/${id}/like`)
      setPulses(p => p.map(pulse =>
        pulse._id === id ? { ...pulse, likes: data.liked
          ? [...(pulse.likes || []), user._id]
          : (pulse.likes || []).filter(l => (l?._id || l) !== user._id) } : pulse
      ))
    } catch { toast.error('Failed.') }
  }

  const del = async (id) => {
    try {
      await axios.delete(`/api/pulse/${id}`)
      setPulses(p => p.filter(x => x._id !== id)); toast.success('Deleted.')
    } catch { toast.error('Failed.') }
  }

  const reply = async (id) => {
    const content = replyText[id]?.trim(); if (!content) return
    try {
      const { data } = await axios.post(`/api/pulse/${id}/reply`, { content })
      setPulses(p => p.map(pulse => pulse._id === id ? { ...pulse, replies: [...(pulse.replies || []), data.reply] } : pulse))
      setReplyText(r => ({ ...r, [id]: '' })); setReplyingTo(null); setExpanded(e => ({ ...e, [id]: true }))
    } catch { toast.error('Failed.') }
  }

  const isLiked = (pulse) => (pulse.likes || []).some(l => (l?._id || l) === user._id)

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: BG }}>
      {/* Compose */}
      <div className="px-4 py-3 border-b border-white/10 flex-shrink-0" style={{ background: SB }}>
        <div className="flex gap-3">
          <Av name={user.fullName} src={user.avatar} size={9} />
          <div className="flex-1 min-w-0">
            <textarea value={text} onChange={e => setText(e.target.value)} rows={2} maxLength={MAX}
              placeholder="What's on your mind? Drop a pulse…"
              className="w-full bg-transparent text-white placeholder-gray-600 text-sm resize-none focus:outline-none leading-relaxed" />
            {imgPreview && (
              <div className="relative mt-1.5 inline-block">
                <img src={imgPreview} alt="" className="max-h-32 rounded-xl object-cover" />
                <button onClick={() => { setImgFile(null); setImgPreview('') }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/80 text-white rounded-full flex items-center justify-center">
                  <X size={10} />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-2">
                <button onClick={() => fileRef.current?.click()} className="p-1 text-gray-500 hover:text-amber-400 transition">
                  <ImageIcon size={15} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImg} />
                <span className={`text-xs ${text.length > MAX * 0.9 ? 'text-red-400' : 'text-gray-600'}`}>{text.length}/{MAX}</span>
              </div>
              <button onClick={post} disabled={posting || !text.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] font-bold text-xs rounded-2xl transition disabled:opacity-40">
                {posting ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />} Pulse
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading
        ? <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
        : pulses.length === 0
          ? <div className="flex flex-col items-center justify-center py-20 text-center"><Zap size={28} className="text-gray-700 mb-3" /><p className="text-gray-500 text-sm">No pulses yet — be first ⚡</p></div>
          : pulses.map(pulse => {
              const liked = isLiked(pulse); const isOwner = (pulse.author?._id || pulse.author) === user._id
              return (
                <div key={pulse._id} className="border-b border-white/5 px-4 py-4">
                  <div className="flex gap-3">
                    <Av name={pulse.author?.fullName} src={pulse.author?.avatar} size={9} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white text-sm font-semibold">{pulse.author?.fullName}</span>
                        <span className="text-gray-600 text-xs">{timeAgo(pulse.createdAt)}</span>
                        {isOwner && <button onClick={() => del(pulse._id)} className="ml-auto p-1 text-gray-700 hover:text-red-400"><Trash2 size={12} /></button>}
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{pulse.content}</p>
                      {pulse.image && <img src={pulse.image} alt="" className="mt-2.5 rounded-2xl max-h-56 w-full object-cover" />}
                      <div className="flex items-center gap-5 mt-3">
                        <button onClick={() => like(pulse._id)} className={`flex items-center gap-1.5 text-xs transition ${liked ? 'text-red-400' : 'text-gray-600 hover:text-red-400'}`}>
                          <Heart size={13} fill={liked ? 'currentColor' : 'none'} /> {(pulse.likes || []).length}
                        </button>
                        <button onClick={() => setReplyingTo(replyingTo === pulse._id ? null : pulse._id)}
                          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-amber-400 transition">
                          <MessageSquare size={13} /> {(pulse.replies || []).length}
                        </button>
                        {(pulse.replies || []).length > 0 && (
                          <button onClick={() => setExpanded(e => ({ ...e, [pulse._id]: !e[pulse._id] }))}
                            className="ml-auto flex items-center gap-1 text-xs text-gray-600 hover:text-gray-300 transition">
                            {expanded[pulse._id] ? <ChevronUp size={11} /> : <ChevronDown size={11} />} replies
                          </button>
                        )}
                      </div>
                      {replyingTo === pulse._id && (
                        <div className="flex gap-2 mt-2.5">
                          <input autoFocus value={replyText[pulse._id] || ''}
                            onChange={e => setReplyText(r => ({ ...r, [pulse._id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && reply(pulse._id)}
                            placeholder="Reply…" style={{ fontSize: 16 }}
                            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/40" />
                          <button onClick={() => reply(pulse._id)} disabled={!replyText[pulse._id]?.trim()}
                            className="p-2 bg-amber-400 hover:bg-amber-300 text-[#0a1929] rounded-2xl transition disabled:opacity-40 flex-shrink-0"><Send size={12} /></button>
                        </div>
                      )}
                      {expanded[pulse._id] && (pulse.replies || []).map((r, i) => (
                        <div key={r._id || i} className="flex gap-2 mt-2.5 pl-2 border-l-2 border-white/10">
                          <Av name={r.author?.fullName} src={r.author?.avatar} size={6} />
                          <div className="flex-1 min-w-0">
                            <div className="inline-block rounded-2xl rounded-tl-sm px-3 py-1.5" style={{ background: B2 }}>
                              <p className="text-[10px] font-semibold text-amber-400/80 mb-0.5">{r.author?.fullName?.split(' ')[0]}</p>
                              <p className="text-gray-300 text-sm" style={{ wordBreak: 'break-word' }}>{r.content}</p>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-0.5 pl-1">{timeAgo(r.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })
      }
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'chats',  label: 'Chats',  icon: MessageSquare },
  { id: 'groups', label: 'Groups', icon: Users },
  { id: 'pulse',  label: 'Pulse',  icon: Zap },
]

export default function LetsTalk() {
  const { user } = useAuth()
  const location = useLocation()
  const initTab  = new URLSearchParams(location.search).get('tab') === 'groups' ? 'groups' : 'chats'
  const [active, setActive] = useState(initTab)
  if (!user) return null

  return (
    <div className="flex flex-col -m-4 lg:-m-6 overflow-hidden" style={{ height: 'calc(100svh - 56px)', background: BG }}>
      {/* Tabs header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 flex-shrink-0" style={{ background: SB }}>
        <p className="text-white font-black text-sm">Let's Talk</p>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-2xl text-xs font-semibold transition ${
                active === t.id ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}>
              <t.icon size={12} /><span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {active === 'chats'  && <ChatsPane  user={user} />}
        {active === 'groups' && <GroupsPane user={user} />}
        {active === 'pulse'  && <PulsePane  user={user} />}
      </div>
    </div>
  )
}
