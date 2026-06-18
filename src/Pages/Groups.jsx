import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import {
  Users, Plus, Send, ArrowLeft, X, Search, Loader2,
  Image as ImageIcon, Paperclip, Trash2, LogOut, UserPlus,
  Crown, MoreVertical, Check,
} from 'lucide-react'

function Avatar({ name, avatar, size = 8 }) {
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0 object-cover`
  if (avatar) return <img src={avatar} alt={name} className={cls + ' object-cover'} />
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ fontSize: size * 2.5 }}>
      {name?.charAt(0).toUpperCase()}
    </div>
  )
}

function GroupListPanel({ groups, selected, onSelect, onCreate, loading }) {
  const [search, setSearch] = useState('')
  const filtered = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-shrink-0">
        <h2 className="font-bold text-[#1a3c5e] text-lg">Groups</h2>
        <button
          onClick={onCreate}
          className="flex items-center gap-1.5 text-xs bg-[#1a3c5e] text-white px-3 py-2 rounded-xl hover:bg-[#162f4a] transition font-medium"
        >
          <Plus size={14} /> New
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-gray-50 flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search groups..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
          />
        </div>
      </div>

      {/* Group list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-[#1a3c5e]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <Users size={22} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No groups yet</p>
            <p className="text-xs text-gray-400 mt-1">Create a group to get started</p>
          </div>
        ) : filtered.map(g => (
          <button
            key={g._id}
            onClick={() => onSelect(g)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition text-left ${
              selected?._id === g._id ? 'bg-blue-50 border-r-2 border-[#1a3c5e]' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a3c5e]/10 to-[#2563a8]/10 flex items-center justify-center flex-shrink-0">
              <Users size={16} className="text-[#1a3c5e]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">{g.name}</p>
              <p className="text-xs text-gray-400 truncate">{g.members?.length || 0} member{g.members?.length !== 1 ? 's' : ''}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function GroupChat({ group, currentUser, onBack, onGroupUpdated }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const bottomRef = useRef(null)
  const { getSocket } = useSocket()

  const isAdmin = group.admins?.some(a => (a._id || a) === currentUser._id)

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/groups/${group._id}/messages`, { withCredentials: true })
      .then(res => setMessages(res.data.messages || []))
      .catch(() => toast.error('Failed to load messages.'))
      .finally(() => setLoading(false))
  }, [group._id])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handler = ({ groupId, message }) => {
      if (groupId === group._id) {
        setMessages(prev => [...prev, message])
      }
    }
    socket.on('group_message', handler)
    return () => socket.off('group_message', handler)
  }, [getSocket, group._id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await axios.post(`/api/groups/${group._id}/messages`, { content: text.trim() }, { withCredentials: true })
      setText('')
    } catch {
      toast.error('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const leaveGroup = async () => {
    try {
      await axios.delete(`/api/groups/${group._id}/members/${currentUser._id}`, { withCredentials: true })
      toast.success('Left group.')
      onGroupUpdated(group._id, 'leave')
    } catch {
      toast.error('Failed to leave group.')
    }
  }

  const deleteGroup = async () => {
    try {
      await axios.delete(`/api/groups/${group._id}`, { withCredentials: true })
      toast.success('Group deleted.')
      onGroupUpdated(group._id, 'delete')
    } catch {
      toast.error('Failed to delete group.')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0 bg-white shadow-sm">
        <button onClick={onBack} className="md:hidden p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition">
          <ArrowLeft size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a3c5e]/10 to-[#2563a8]/10 flex items-center justify-center flex-shrink-0">
          <Users size={15} className="text-[#1a3c5e]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{group.name}</p>
          <p className="text-xs text-gray-400">{group.members?.length || 0} members</p>
        </div>
        <button
          onClick={() => setShowInfo(v => !v)}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Messages */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={22} className="animate-spin text-[#1a3c5e]" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <Users size={20} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
              </div>
            ) : messages.map(msg => {
              const isMine = msg.sender?._id === currentUser._id || msg.sender === currentUser._id
              return (
                <div key={msg._id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                  {!isMine && (
                    <div className="w-7 h-7 rounded-full bg-[#1a3c5e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                      {msg.sender?.fullName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {!isMine && (
                      <span className="text-xs text-gray-400 ml-1">{msg.sender?.fullName}</span>
                    )}
                    <div className={`px-3 py-2 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-[#1a3c5e] text-white rounded-tr-sm'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                    }`}>
                      {msg.mediaUrl ? (
                        msg.mediaType === 'image' ? (
                          <img src={msg.mediaUrl} alt="media" className="max-w-[200px] rounded-xl" />
                        ) : (
                          <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="underline">{msg.mediaName || 'File'}</a>
                        )
                      ) : msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} className="px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0 bg-white">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="w-10 h-10 bg-[#1a3c5e] hover:bg-[#162f4a] text-white rounded-xl flex items-center justify-center transition disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>

        {/* Info panel */}
        {showInfo && (
          <div className="w-64 border-l border-gray-100 flex flex-col bg-gray-50 flex-shrink-0 overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="font-semibold text-[#1a3c5e] text-sm">Group Info</p>
              <button onClick={() => setShowInfo(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Members ({group.members?.length})</p>
                <div className="space-y-2">
                  {group.members?.map(m => {
                    const isGroupAdmin = group.admins?.some(a => (a._id || a).toString() === (m._id || m).toString())
                    return (
                      <div key={m._id || m} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1a3c5e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {m.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-700 flex-1 truncate">{m.fullName}</span>
                        {isGroupAdmin && <Crown size={12} className="text-amber-500 flex-shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 space-y-2">
                <button
                  onClick={leaveGroup}
                  className="w-full flex items-center gap-2 text-xs text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition"
                >
                  <LogOut size={13} /> Leave Group
                </button>
                {group.createdBy?._id === currentUser._id && (
                  <button
                    onClick={deleteGroup}
                    className="w-full flex items-center gap-2 text-xs text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition font-medium"
                  >
                    <Trash2 size={13} /> Delete Group
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CreateGroupModal({ onClose, onCreate, allUsers, currentUserId }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [creating, setCreating] = useState(false)

  const filtered = allUsers.filter(u =>
    u._id !== currentUserId &&
    (u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  )

  const toggle = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )

  const create = async () => {
    if (!name.trim()) return toast.error('Group name is required.')
    setCreating(true)
    try {
      const { data } = await axios.post('/api/groups', {
        name: name.trim(),
        description: description.trim(),
        memberIds: selected,
      }, { withCredentials: true })
      toast.success('Group created!')
      onCreate(data.group)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-[#1a3c5e]">Create Group</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Group Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. 300L Study Group"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description (optional)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Add Members ({selected.length} selected)
            </label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search members..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-1">
              {filtered.map(u => (
                <button
                  key={u._id}
                  onClick={() => toggle(u._id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition ${
                    selected.includes(u._id) ? 'bg-blue-50 text-[#1a3c5e]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-[#1a3c5e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{u.accountType === 'staff' ? 'Staff' : `${u.level}L`}</p>
                  </div>
                  {selected.includes(u._id) && <Check size={14} className="text-[#1a3c5e] flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600">
            Cancel
          </button>
          <button
            onClick={create}
            disabled={!name.trim() || creating}
            className="flex-1 py-2.5 text-sm bg-[#1a3c5e] text-white rounded-xl hover:bg-[#162f4a] transition font-medium disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
            Create Group
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Groups() {
  const { user } = useAuth()
  const { getSocket } = useSocket()
  const [groups, setGroups] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [allUsers, setAllUsers] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [mobileView, setMobileView] = useState('list')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [groupsRes, usersRes] = await Promise.all([
          axios.get('/api/groups', { withCredentials: true }),
          axios.get('/api/users/community', { withCredentials: true }),
        ])
        setGroups(groupsRes.data.groups || [])
        setAllUsers(usersRes.data.users || [])
      } catch {
        toast.error('Failed to load groups.')
      } finally {
        setLoadingGroups(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handler = ({ group }) => {
      setGroups(prev => {
        const exists = prev.find(g => g._id === group._id)
        return exists ? prev : [group, ...prev]
      })
    }
    socket.on('group_added', handler)
    return () => socket.off('group_added', handler)
  }, [getSocket])

  const handleSelect = (group) => {
    setSelectedGroup(group)
    setMobileView('chat')
  }

  const handleGroupUpdated = (groupId, action) => {
    if (action === 'leave' || action === 'delete') {
      setGroups(prev => prev.filter(g => g._id !== groupId))
      setSelectedGroup(null)
      setMobileView('list')
    }
  }

  const handleCreated = (group) => {
    setGroups(prev => [group, ...prev])
    setShowCreate(false)
    setSelectedGroup(group)
    setMobileView('chat')
  }

  return (
    <div className="h-[calc(100vh-80px)] flex rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
      {/* Left panel */}
      <div className={`w-full md:w-72 md:border-r md:border-gray-100 flex-shrink-0 ${
        mobileView === 'chat' ? 'hidden md:flex md:flex-col' : 'flex flex-col'
      }`}>
        <GroupListPanel
          groups={groups}
          selected={selectedGroup}
          onSelect={handleSelect}
          onCreate={() => setShowCreate(true)}
          loading={loadingGroups}
        />
      </div>

      {/* Right panel */}
      <div className={`flex-1 min-w-0 ${mobileView === 'list' ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
        {selectedGroup ? (
          <GroupChat
            key={selectedGroup._id}
            group={selectedGroup}
            currentUser={user}
            onBack={() => { setSelectedGroup(null); setMobileView('list') }}
            onGroupUpdated={handleGroupUpdated}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Users size={28} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">Select a group</h3>
            <p className="text-sm text-gray-400">Choose a group from the list or create a new one</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-2 text-sm bg-[#1a3c5e] text-white px-4 py-2.5 rounded-xl hover:bg-[#162f4a] transition font-medium"
            >
              <Plus size={15} /> Create Group
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreated}
          allUsers={allUsers}
          currentUserId={user?._id}
        />
      )}
    </div>
  )
}
