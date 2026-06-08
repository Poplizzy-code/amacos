import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  Bell, MessageCircle, UserPlus, UserCheck, Heart,
  MessageSquare, Loader2, Check, CheckCheck, Inbox,
} from 'lucide-react'

const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const TYPE_META = {
  friend_request:  { icon: UserPlus,      color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Friend Request' },
  friend_accepted: { icon: UserCheck,     color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Friend Accepted' },
  message:         { icon: MessageCircle, color: 'text-[#1a3c5e]',   bg: 'bg-[#1a3c5e]/5', label: 'Message' },
  post_like:       { icon: Heart,         color: 'text-rose-500',    bg: 'bg-rose-50',    label: 'Like' },
  post_comment:    { icon: MessageSquare, color: 'text-purple-500',  bg: 'bg-purple-50',  label: 'Comment' },
}

function NotificationItem({ notif, onRead, onAccept, onReject }) {
  const meta = TYPE_META[notif.type] || TYPE_META.message
  const IconComp = meta.icon
  const [actioning, setActioning] = useState(false)

  const handleAccept = async () => {
    if (actioning) return
    setActioning(true)
    try {
      await onAccept(notif.referenceId, notif._id)
    } finally { setActioning(false) }
  }

  const handleReject = async () => {
    if (actioning) return
    setActioning(true)
    try {
      await onReject(notif.referenceId, notif._id)
    } finally { setActioning(false) }
  }

  return (
    <div
      onClick={() => !notif.read && onRead(notif._id)}
      className={`flex items-start gap-3 p-4 rounded-2xl border transition cursor-pointer group ${
        notif.read
          ? 'bg-white border-gray-100 hover:bg-gray-50'
          : 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
      }`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
        <IconComp size={18} className={meta.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Sender avatar + name */}
            {notif.sender && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                  {notif.sender?.fullName?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-[#1a3c5e] truncate">{notif.sender?.fullName}</span>
              </div>
            )}
            <p className="text-sm text-gray-700 leading-snug">{notif.content}</p>
            <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
          </div>

          {/* Unread dot */}
          {!notif.read && (
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
          )}
        </div>

        {/* Friend request actions */}
        {notif.type === 'friend_request' && notif.referenceId && !notif.read && (
          <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
            <button
              onClick={handleAccept}
              disabled={actioning}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1a3c5e] hover:bg-[#152f4a] text-white text-xs font-bold rounded-full transition disabled:opacity-60"
            >
              {actioning ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              Accept
            </button>
            <button
              onClick={handleReject}
              disabled={actioning}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-full transition disabled:opacity-60"
            >
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await axios.get('/api/notifications', { withCredentials: true })
      setNotifications(data.notifications || [])
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const handleRead = async (id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
    axios.put(`/api/notifications/${id}/read`, {}, { withCredentials: true }).catch(() => {})
  }

  const handleMarkAll = async () => {
    if (markingAll) return
    setMarkingAll(true)
    try {
      await axios.put('/api/notifications/read-all', {}, { withCredentials: true })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    } catch { toast.error('Could not mark all as read.') }
    finally { setMarkingAll(false) }
  }

  const handleAccept = async (requestId, notifId) => {
    try {
      await axios.put(`/api/friends/accept/${requestId}`, {}, { withCredentials: true })
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, read: true, content: n.content.replace('sent you a friend request', 'is now your friend! 🎉') } : n))
      toast.success('Friend request accepted! 🎉')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept request.')
    }
  }

  const handleReject = async (requestId, notifId) => {
    try {
      await axios.put(`/api/friends/reject/${requestId}`, {}, { withCredentials: true })
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, read: true } : n))
      toast('Request declined')
    } catch { toast.error('Could not decline request.') }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <Bell size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Sign in to view your notifications</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} disabled={markingAll}
            className="flex items-center gap-1.5 text-sm font-bold text-[#1a3c5e] hover:text-[#152f4a] transition px-3 py-2 rounded-xl hover:bg-[#1a3c5e]/5 disabled:opacity-60">
            {markingAll ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
            Mark all read
          </button>
        )}
      </div>

      {/* Tabs / filter */}
      {notifications.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none">
          {['All', 'Unread', 'Friend Requests', 'Messages'].map(tab => (
            <button key={tab}
              onClick={() => {}} // could add filter state later
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-gray-200 text-gray-500 hover:border-[#1a3c5e]/30 hover:text-[#1a3c5e] transition">
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[#1a3c5e]" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#1a3c5e]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox size={28} className="text-[#1a3c5e]/30" />
          </div>
          <h2 className="text-base font-semibold text-gray-600 mb-1">No notifications yet</h2>
          <p className="text-gray-400 text-sm">When someone messages you or sends a friend request, you'll see it here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <NotificationItem
              key={n._id}
              notif={n}
              onRead={handleRead}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  )
}
