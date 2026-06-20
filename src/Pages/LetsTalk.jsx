import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import {
  MessageSquare, Users, Zap, Send, Plus, Search, ArrowLeft,
  Loader2, X, Heart, Trash2, Image as ImageIcon,
  LogOut, ChevronDown, ChevronUp, Settings, UserPlus, Edit2, Check,
} from 'lucide-react'

// ── Shared helpers ────────────────────────────────────────────────────────────
const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)    return `${s}s`
  if (s < 3600)  return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function Avatar({ name, src, size = 9 }) {
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0 object-cover`
  if (src) return <img src={src} alt={name} className={cls} style={{ minWidth: `${size * 4}px`, minHeight: `${size * 4}px` }} />
  return (
    <div className={`${cls} bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center text-white font-bold`}
      style={{ fontSize: size > 8 ? '14px' : '11px', minWidth: `${size * 4}px`, minHeight: `${size * 4}px` }}>
      {name?.charAt(0).toUpperCase()}
    </div>
  )
}

const levelLabel = (u) => u?.accountType === 'staff' ? 'Staff' : u?.isAlumni ? 'Alumni' : u?.level ? `${u.level}L` : 'Student'

const BG  = '#060d1a'
const SB  = '#0a1929'
const SB2 = '#0d2137'

// ── Chats (DMs) ───────────────────────────────────────────────────────────────
function ChatsPane({ user }) {
  const [contacts, setContacts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)
  const [messages, setMessages]   = useState([])
  const [loadingMsgs, setLMsgs]   = useState(false)
  const [text, setText]           = useState('')
  const [sending, setSending]     = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const { getSocket } = useSocket()
  const bottomRef = useRef()
  const inputRef  = useRef()

  useEffect(() => {
    axios.get('/api/users/community')
      .then(r => setContacts(r.data.users?.filter(u => u._id !== user._id) || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user._id])

  useEffect(() => {
    if (!selected) return
    setLMsgs(true); setMessages([])
    axios.get(`/api/messages/${selected._id}`)
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
      const sid = msg.sender?._id || msg.sender
      if (sid === selected._id || sid === user._id) {
        setMessages(p => p.some(m => m._id === msg._id) ? p : [...p, msg])
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
      const { data } = await axios.post('/api/messages', fd)
      setMessages(p => p.map(m => m._id === tmp._id ? data.message : m))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
      setMessages(p => p.filter(m => m._id !== tmp._id))
    } finally { setSending(false) }
  }

  const deleteMsg = async (id) => {
    try {
      await axios.delete(`/api/messages/${id}`)
      setMessages(p => p.filter(m => m._id !== id))
      setDeletingId(null)
      toast.success('Deleted.')
    } catch { toast.error('Failed.') }
  }

  const filtered = contacts.filter(c => c.fullName?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex h-full overflow-hidden">
      {/* Contact list */}
      <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-72 xl:w-80 border-r border-white/10 flex-shrink-0 overflow-hidden`} style={{ background: SB }}>
        <div className="px-3 py-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-2 border border-white/5">
            <Search size={13} className="text-gray-500 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…"
              className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading
            ? <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
            : filtered.length === 0
              ? <p className="text-center text-gray-600 text-sm py-10">No members found.</p>
              : filtered.map(c => (
                  <button key={c._id} onClick={() => setSelected(c)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 min-w-0 ${selected?._id === c._id ? 'bg-white/5 border-l-2 border-amber-400' : ''}`}>
                    <Avatar name={c.fullName} src={c.avatar} size={10} />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-white text-sm font-semibold truncate">{c.fullName}</p>
                      <p className="text-gray-500 text-xs">{levelLabel(c)}</p>
                    </div>
                  </button>
                ))
          }
        </div>
      </div>

      {/* Chat panel */}
      <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-col flex-1 overflow-hidden min-w-0`} style={{ background: BG }}>
        {selected ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0 min-w-0" style={{ background: SB }}>
              <button onClick={() => { setSelected(null); setDeletingId(null) }} className="lg:hidden p-1 text-gray-400 hover:text-white flex-shrink-0">
                <ArrowLeft size={18} />
              </button>
              <Avatar name={selected.fullName} src={selected.avatar} size={9} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{selected.fullName}</p>
                <p className="text-gray-500 text-xs">{levelLabel(selected)}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1" onClick={() => setDeletingId(null)}>
              {loadingMsgs
                ? <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
                : messages.length === 0
                  ? <div className="flex flex-col items-center justify-center h-full py-10"><p className="text-gray-500 text-sm">Say hi to {selected.fullName?.split(' ')[0]} 👋</p></div>
                  : messages.map((m, i) => {
                      const isMe = (m.sender?._id || m.sender) === user._id
                      const isDeleting = deletingId === m._id
                      return (
                        <div key={m._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                          <div className="flex flex-col items-end max-w-[78%] sm:max-w-[70%]" style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                            <div
                              onClick={e => { e.stopPropagation(); if (isMe) setDeletingId(isDeleting ? null : m._id) }}
                              className={`px-3 py-2 rounded-2xl text-sm leading-relaxed cursor-pointer select-none ${
                                isMe ? 'bg-amber-400 text-[#0a1929] font-medium rounded-br-sm' : 'text-white rounded-bl-sm'
                              } ${isDeleting ? 'ring-2 ring-red-400/60' : ''}`}
                              style={{ ...(!isMe ? { background: SB2 } : {}), wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                              {m.content}
                            </div>
                            <div className={`flex items-center gap-2 mt-0.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                              <span className="text-[10px] text-gray-600">{timeAgo(m.createdAt)}</span>
                              {isDeleting && isMe && (
                                <button onClick={e => { e.stopPropagation(); deleteMsg(m._id) }}
                                  className="flex items-center gap-1 text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full hover:bg-red-400/20 transition">
                                  <Trash2 size={10} /> Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
              }
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-white/10 flex gap-2 flex-shrink-0 min-w-0" style={{ background: SB }}>
              <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                placeholder={`Message ${selected.fullName?.split(' ')[0]}…`}
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/40" />
              <button onClick={send} disabled={sending || !text.trim()}
                className="p-2.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] rounded-2xl transition disabled:opacity-40 flex-shrink-0">
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-gray-600" />
            </div>
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
  const [groups, setGroups]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState(null)
  const [messages, setMessages]     = useState([])
  const [loadingMsgs, setLMsgs]     = useState(false)
  const [text, setText]             = useState('')
  const [sending, setSending]       = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Create modal
  const [showCreate, setCreate]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [newDesc, setNewDesc]     = useState('')
  const [creating, setCreating]   = useState(false)

  // Group info panel
  const [showInfo, setShowInfo]   = useState(false)
  const [editName, setEditName]   = useState('')
  const [editDesc, setEditDesc]   = useState('')
  const [editing, setEditing]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [showAddMembers, setShowAddMembers] = useState(false)
  const [allUsers, setAllUsers]   = useState([])
  const [memberSearch, setMSearch]= useState('')
  const [addingIds, setAddingIds] = useState([])

  const { getSocket } = useSocket()
  const bottomRef = useRef()
  const inputRef  = useRef()

  useEffect(() => {
    setLoading(true)
    axios.get('/api/groups')
      .then(r => setGroups(r.data.groups || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user._id])

  useEffect(() => {
    if (!selected) return
    setLMsgs(true); setMessages([])
    axios.get(`/api/groups/${selected._id}/messages`)
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
      if (selected?._id === groupId) setMessages(p => p.some(m => m._id === message._id) ? p : [...p, message])
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
      const { data } = await axios.post(`/api/groups/${selected._id}/messages`, { content: tmp.content })
      setMessages(p => p.map(m => m._id === tmp._id ? data.message : m))
    } catch {
      toast.error('Failed.')
      setMessages(p => p.filter(m => m._id !== tmp._id))
    } finally { setSending(false) }
  }

  const deleteMsg = async (id) => {
    try {
      await axios.delete(`/api/groups/${selected._id}/messages/${id}`)
      setMessages(p => p.filter(m => m._id !== id))
      setDeletingId(null)
      toast.success('Deleted.')
    } catch { toast.error('Failed.') }
  }

  const createGroup = async () => {
    if (!newName.trim()) return toast.error('Name required.')
    setCreating(true)
    try {
      const { data } = await axios.post('/api/groups', { name: newName.trim(), description: newDesc.trim() })
      setGroups(p => [data.group, ...p])
      setSelected(data.group); setNewName(''); setNewDesc(''); setCreate(false)
      toast.success('Group created!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setCreating(false) }
  }

  const saveEdit = async () => {
    if (!editName.trim()) return toast.error('Name required.')
    setSaving(true)
    try {
      const { data } = await axios.put(`/api/groups/${selected._id}`, { name: editName, description: editDesc })
      setSelected(data.group)
      setGroups(p => p.map(g => g._id === data.group._id ? data.group : g))
      setEditing(false); toast.success('Group updated.')
    } catch { toast.error('Failed.') }
    finally { setSaving(false) }
  }

  const deleteGroup = async () => {
    if (!window.confirm(`Delete "${selected.name}"? This cannot be undone.`)) return
    try {
      await axios.delete(`/api/groups/${selected._id}`)
      setGroups(p => p.filter(g => g._id !== selected._id))
      setSelected(null); setShowInfo(false)
      toast.success('Group deleted.')
    } catch { toast.error('Failed.') }
  }

  const leaveGroup = async () => {
    try {
      await axios.post(`/api/groups/${selected._id}/leave`)
      setGroups(p => p.filter(g => g._id !== selected._id))
      setSelected(null); setShowInfo(false)
      toast.success('Left group.')
    } catch { toast.error('Failed.') }
  }

  const removeMember = async (memberId) => {
    try {
      await axios.delete(`/api/groups/${selected._id}/members/${memberId}`)
      const updated = { ...selected, members: selected.members.filter(m => (m._id || m) !== memberId) }
      setSelected(updated)
      setGroups(p => p.map(g => g._id === updated._id ? updated : g))
    } catch { toast.error('Failed.') }
  }

  const openAddMembers = async () => {
    setShowAddMembers(true); setMSearch(''); setAddingIds([])
    if (allUsers.length === 0) {
      const { data } = await axios.get('/api/users/community')
      setAllUsers(data.users || [])
    }
  }

  const addMembers = async () => {
    if (!addingIds.length) return
    try {
      const { data } = await axios.post(`/api/groups/${selected._id}/members`, { memberIds: addingIds })
      setSelected(data.group)
      setGroups(p => p.map(g => g._id === data.group._id ? data.group : g))
      setShowAddMembers(false); setAddingIds([])
      toast.success('Members added!')
    } catch { toast.error('Failed.') }
  }

  const isAdmin   = selected && (selected.admins || []).some(a => (a._id || a) === user._id)
  const isCreator = selected && ((selected.createdBy?._id || selected.createdBy) === user._id)
  const filtered  = groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()))
  const nonMembers = allUsers.filter(u => u._id !== user._id && !(selected?.members || []).some(m => (m._id || m) === u._id))
  const filteredNM = nonMembers.filter(u => u.fullName?.toLowerCase().includes(memberSearch.toLowerCase()))

  return (
    <>
      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-md rounded-2xl border border-white/10 shadow-2xl" style={{ background: SB }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <p className="text-white font-bold">New Group</p>
              <button onClick={() => setCreate(false)}><X size={15} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Group name *"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400/40" />
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} placeholder="Description (optional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400/40 resize-none" />
              <div className="flex gap-2">
                <button onClick={createGroup} disabled={creating || !newName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] font-bold text-sm rounded-xl transition disabled:opacity-50">
                  {creating && <Loader2 size={13} className="animate-spin" />} Create
                </button>
                <button onClick={() => setCreate(false)} className="px-4 bg-white/10 text-gray-300 text-sm rounded-xl hover:bg-white/15 transition">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group info panel */}
      {showInfo && selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowInfo(false)}>
          <div className="w-full max-w-xs h-full border-l border-white/10 flex flex-col overflow-y-auto shadow-2xl"
            style={{ background: SB }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
              <p className="text-white font-bold text-sm">Group Info</p>
              <button onClick={() => setShowInfo(false)}><X size={15} className="text-gray-400" /></button>
            </div>

            {/* Name & desc */}
            <div className="p-4 border-b border-white/5">
              {editing ? (
                <div className="space-y-2">
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/40" />
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} placeholder="Description"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400/40 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-400 text-[#0a1929] text-xs font-bold rounded-xl disabled:opacity-50">
                      {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
                    </button>
                    <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-white/10 text-gray-300 text-xs rounded-xl">Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-bold text-base">{selected.name}</p>
                    {isAdmin && (
                      <button onClick={() => { setEditName(selected.name); setEditDesc(selected.description || ''); setEditing(true) }}
                        className="p-1 text-gray-500 hover:text-amber-400 transition"><Edit2 size={13} /></button>
                    )}
                  </div>
                  {selected.description && <p className="text-gray-400 text-xs">{selected.description}</p>}
                </div>
              )}
            </div>

            {/* Members */}
            <div className="p-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{(selected.members || []).length} Members</p>
                {isAdmin && (
                  <button onClick={openAddMembers}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition">
                    <UserPlus size={12} /> Add
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(selected.members || []).map(m => {
                  const mid = m._id || m
                  const mIsCreator = (selected.createdBy?._id || selected.createdBy) === mid
                  return (
                    <div key={mid} className="flex items-center gap-2.5">
                      <Avatar name={m.fullName} src={m.avatar} size={8} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{m.fullName}</p>
                        <p className="text-gray-600 text-[10px]">{mIsCreator ? 'Creator' : levelLabel(m)}</p>
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

            {/* Actions */}
            <div className="p-4 border-t border-white/10 space-y-2 flex-shrink-0">
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
      {showAddMembers && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[80vh]" style={{ background: SB }}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
              <p className="text-white font-bold text-sm">Add Members</p>
              <button onClick={() => setShowAddMembers(false)}><X size={15} className="text-gray-400" /></button>
            </div>
            <div className="px-3 py-2 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                <Search size={13} className="text-gray-500" />
                <input value={memberSearch} onChange={e => setMSearch(e.target.value)} placeholder="Search…"
                  className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {filteredNM.length === 0
                ? <p className="text-center text-gray-600 text-sm py-6">No users to add.</p>
                : filteredNM.map(u => {
                    const selected_ = addingIds.includes(u._id)
                    return (
                      <button key={u._id} onClick={() => setAddingIds(p => selected_ ? p.filter(id => id !== u._id) : [...p, u._id])}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition ${selected_ ? 'bg-amber-400/5' : ''}`}>
                        <Avatar name={u.fullName} src={u.avatar} size={8} />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-white text-sm truncate">{u.fullName}</p>
                          <p className="text-gray-500 text-xs">{levelLabel(u)}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected_ ? 'border-amber-400 bg-amber-400' : 'border-gray-600'}`}>
                          {selected_ && <Check size={11} className="text-[#0a1929]" />}
                        </div>
                      </button>
                    )
                  })
              }
            </div>
            <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
              <button onClick={addMembers} disabled={!addingIds.length}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] font-bold text-sm rounded-xl transition disabled:opacity-40">
                Add {addingIds.length > 0 ? `${addingIds.length} ` : ''}Member{addingIds.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-full overflow-hidden">
        {/* Group list */}
        <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-72 xl:w-80 border-r border-white/10 flex-shrink-0 overflow-hidden`} style={{ background: SB }}>
          <div className="px-3 py-3 border-b border-white/5 flex gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-2 border border-white/5 flex-1 min-w-0">
              <Search size={13} className="text-gray-500 flex-shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups…"
                className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none" />
            </div>
            <button onClick={() => setCreate(true)} className="p-2.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] rounded-2xl transition flex-shrink-0">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading
              ? <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
              : filtered.length === 0
                ? <p className="text-center text-gray-600 text-sm py-10">No groups yet.</p>
                : filtered.map(g => (
                    <button key={g._id} onClick={() => setSelected(g)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 ${selected?._id === g._id ? 'bg-white/5 border-l-2 border-amber-400' : ''}`}>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                        {g.name?.charAt(0).toUpperCase()}
                      </div>
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
        <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-col flex-1 overflow-hidden min-w-0`} style={{ background: BG }}>
          {selected ? (
            <>
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0 min-w-0" style={{ background: SB }}>
                <button onClick={() => { setSelected(null); setDeletingId(null) }} className="lg:hidden p-1 text-gray-400 hover:text-white flex-shrink-0">
                  <ArrowLeft size={18} />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5298] flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                  {selected.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{selected.name}</p>
                  <p className="text-gray-500 text-xs">{(selected.members || []).length} members</p>
                </div>
                <button onClick={() => { setShowInfo(true); setEditing(false) }} className="p-2 text-gray-500 hover:text-white transition flex-shrink-0">
                  <Settings size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1" onClick={() => setDeletingId(null)}>
                {loadingMsgs
                  ? <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
                  : messages.length === 0
                    ? <p className="text-center text-gray-500 text-sm py-10">No messages yet 👋</p>
                    : messages.map((m, i) => {
                        const isMe = m.sender?._id === user._id
                        const isDeleting = deletingId === m._id
                        return (
                          <div key={m._id || i} className={`flex items-end gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                            {!isMe && <Avatar name={m.sender?.fullName} src={m.sender?.avatar} size={7} />}
                            <div className="flex flex-col max-w-[78%] sm:max-w-[70%]" style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                              {!isMe && <p className="text-[10px] text-amber-400/80 font-semibold mb-0.5 pl-1">{m.sender?.fullName?.split(' ')[0]}</p>}
                              <div
                                onClick={e => { e.stopPropagation(); if (isMe) setDeletingId(isDeleting ? null : m._id) }}
                                className={`px-3 py-2 rounded-2xl text-sm leading-relaxed cursor-pointer ${
                                  isMe ? 'bg-amber-400 text-[#0a1929] font-medium rounded-br-sm' : 'text-white rounded-bl-sm'
                                } ${isDeleting ? 'ring-2 ring-red-400/60' : ''}`}
                                style={{ ...(!isMe ? { background: SB2 } : {}), wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                {m.content}
                              </div>
                              <div className={`flex items-center gap-2 mt-0.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <span className="text-[10px] text-gray-600">{timeAgo(m.createdAt)}</span>
                                {isDeleting && isMe && (
                                  <button onClick={e => { e.stopPropagation(); deleteMsg(m._id) }}
                                    className="flex items-center gap-1 text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full hover:bg-red-400/20 transition">
                                    <Trash2 size={10} /> Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                }
                <div ref={bottomRef} />
              </div>

              <div className="px-3 py-3 border-t border-white/10 flex gap-2 flex-shrink-0 min-w-0" style={{ background: SB }}>
                <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder={`Message ${selected.name}…`}
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/40" />
                <button onClick={send} disabled={sending || !text.trim()}
                  className="p-2.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] rounded-2xl transition disabled:opacity-40 flex-shrink-0">
                  {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Users size={24} className="text-gray-600" />
              </div>
              <p className="text-gray-400 font-semibold text-sm">Select a group</p>
              <p className="text-gray-600 text-xs mt-1">Create or join a group to chat</p>
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
    axios.get('/api/pulse')
      .then(r => setPulses(r.data.pulses || []))
      .catch(() => toast.error('Failed to load.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const pickImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return toast.error('Image must be under 10MB.')
    setImageFile(file); setPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const post = async () => {
    if (!text.trim() || posting) return
    setPosting(true)
    try {
      let data
      if (imageFile) {
        const fd = new FormData()
        fd.append('content', text.trim())
        fd.append('image', imageFile)
        ;({ data } = await axios.post('/api/pulse', fd))
      } else {
        ;({ data } = await axios.post('/api/pulse', { content: text.trim() }, {
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      setPulses(p => [data.pulse, ...p])
      setText(''); setImageFile(null); setPreview('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post.')
    } finally { setPosting(false) }
  }

  const like = async (id) => {
    try {
      const { data } = await axios.post(`/api/pulse/${id}/like`)
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
      await axios.delete(`/api/pulse/${id}`)
      setPulses(p => p.filter(pulse => pulse._id !== id))
    } catch { toast.error('Failed.') }
  }

  const reply = async (id) => {
    const content = replyText[id]?.trim()
    if (!content) return
    try {
      const { data } = await axios.post(`/api/pulse/${id}/reply`, { content })
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
    <div className="flex-1 overflow-y-auto" style={{ background: BG }}>
      {/* Compose */}
      <div className="px-4 py-4 border-b border-white/10" style={{ background: SB }}>
        <div className="flex gap-3">
          <Avatar name={user.fullName} src={user.avatar} size={9} />
          <div className="flex-1 min-w-0">
            <textarea value={text} onChange={e => setText(e.target.value)} rows={2} maxLength={MAX}
              placeholder="What's on your mind? Drop a pulse…"
              className="w-full bg-transparent text-white placeholder-gray-600 text-sm resize-none focus:outline-none leading-relaxed" />
            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img src={imagePreview} alt="" className="max-h-36 rounded-xl object-cover" />
                <button onClick={() => { setImageFile(null); setPreview('') }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/80 text-white rounded-full flex items-center justify-center">
                  <X size={10} />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <button onClick={() => fileRef.current?.click()} className="p-1.5 text-gray-500 hover:text-amber-400 transition">
                  <ImageIcon size={15} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
                <span className={`text-xs ${text.length > MAX * 0.9 ? 'text-red-400' : 'text-gray-600'}`}>{text.length}/{MAX}</span>
              </div>
              <button onClick={post} disabled={posting || !text.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#0a1929] font-bold text-xs rounded-2xl transition disabled:opacity-40">
                {posting ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} Pulse
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading
        ? <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-amber-400" /></div>
        : pulses.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <Zap size={32} className="text-gray-700 mb-4" />
              <p className="text-gray-400 font-semibold">No pulses yet</p>
              <p className="text-gray-600 text-sm mt-1">Be the first to drop one ⚡</p>
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
                      <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{pulse.content}</p>
                      {pulse.image && <img src={pulse.image} alt="" className="mt-3 rounded-2xl max-h-64 w-full object-cover" />}

                      <div className="flex items-center gap-5 mt-3">
                        <button onClick={() => like(pulse._id)} className={`flex items-center gap-1.5 text-xs transition ${liked ? 'text-red-400' : 'text-gray-600 hover:text-red-400'}`}>
                          <Heart size={14} fill={liked ? 'currentColor' : 'none'} /> {(pulse.likes || []).length}
                        </button>
                        <button onClick={() => setReplyingTo(replyingTo === pulse._id ? null : pulse._id)}
                          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-amber-400 transition">
                          <MessageSquare size={14} /> {(pulse.replies || []).length}
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
                          <input autoFocus value={replyText[pulse._id] || ''}
                            onChange={e => setReplyText(r => ({ ...r, [pulse._id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && reply(pulse._id)}
                            placeholder="Reply…"
                            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/40" />
                          <button onClick={() => reply(pulse._id)} disabled={!replyText[pulse._id]?.trim()}
                            className="p-2 bg-amber-400 hover:bg-amber-300 text-[#0a1929] rounded-2xl transition disabled:opacity-40 flex-shrink-0">
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
                                  <p className="text-gray-300 text-sm" style={{ wordBreak: 'break-word' }}>{r.content}</p>
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
  const { user }  = useAuth()
  const location  = useLocation()
  const params    = new URLSearchParams(location.search)
  const initTab   = params.get('tab') === 'groups' ? 'groups' : 'chats'
  const [active, setActive] = useState(initTab)

  if (!user) return null

  return (
    <div className="flex flex-col -m-4 lg:-m-6 overflow-hidden" style={{ height: 'calc(100vh - 56px)', background: BG }}>
      {/* Header + Tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 flex-shrink-0" style={{ background: SB }}>
        <p className="text-white font-black text-sm tracking-wide">Let's Talk</p>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold transition ${
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

      <div className="flex-1 overflow-hidden flex flex-col">
        {active === 'chats'  && <ChatsPane  user={user} />}
        {active === 'groups' && <GroupsPane user={user} />}
        {active === 'pulse'  && <PulsePane  user={user} />}
      </div>
    </div>
  )
}
