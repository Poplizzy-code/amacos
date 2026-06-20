import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  Wifi, CheckCircle, Users, Play, Headphones, Eye, Heart, MessageCircle,
  ArrowLeft, Plus, Settings, Loader2, UserPlus, UserMinus, Bell, BellOff
} from 'lucide-react'

function formatViews(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export default function MediaChannel({ isApp = false }) {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const base = isApp ? '/app' : ''

  const [channel, setChannel]     = useState(null)
  const [content, setContent]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [following, setFollowing] = useState(false)
  const [joined, setJoined]       = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      axios.get(`/api/media/channels/${slug}`),
      axios.get(`/api/media/content?channel=`, { params: { platform: undefined } }),
    ]).then(([chRes]) => {
      const ch = chRes.data.channel
      setChannel(ch)
      // Fetch content for this channel
      return axios.get(`/api/media/content?channel=${ch._id}&limit=30`)
    }).then(res => {
      setContent(res.data.items || [])
    }).catch(() => toast.error('Failed to load channel.'))
    .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!channel || !user) return
    const isMember = channel.members?.some(m =>
      (m.user?._id || m.user?.toString()) === user._id
    )
    setJoined(isMember)
    // Check follow status via subscription check (approximated client-side)
  }, [channel, user])

  const toggleFollow = async () => {
    if (!user) return navigate('/login')
    setActionLoading(true)
    try {
      const { data } = await axios.post(`/api/media/channels/${channel._id}/follow`, {}, { withCredentials: true })
      setFollowing(data.following)
      setChannel(prev => ({ ...prev, followersCount: prev.followersCount + (data.following ? 1 : -1) }))
      toast.success(data.following ? 'Following!' : 'Unfollowed.')
    } catch { toast.error('Failed.') }
    finally { setActionLoading(false) }
  }

  const toggleJoin = async () => {
    if (!user) return navigate('/login')
    if (!user.mediaRole) return toast.error('A media role is required to join channels.')
    setActionLoading(true)
    try {
      const { data } = await axios.post(`/api/media/channels/${channel._id}/join`, {}, { withCredentials: true })
      setJoined(data.joined)
      toast.success(data.joined ? 'Joined channel!' : 'Left channel.')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setActionLoading(false) }
  }

  if (loading) return (
    <div className={`${isApp ? '-m-4 lg:-m-6' : ''} min-h-screen bg-[#060d1a] flex items-center justify-center`}>
      <Loader2 size={32} className="animate-spin text-amber-400" />
    </div>
  )

  if (!channel) return (
    <div className={`${isApp ? '-m-4 lg:-m-6' : ''} min-h-screen bg-[#060d1a] flex items-center justify-center`}>
      <p className="text-gray-400">Channel not found.</p>
    </div>
  )

  const isHost = user && channel.members?.some(m =>
    (m.user?._id || m.user) === user._id && m.role === 'host'
  )
  const canCreate = user && ['publisher', 'editor', 'chief-editor'].includes(user.mediaRole) && joined

  return (
    <div className={`${isApp ? '-m-4 lg:-m-6' : ''} min-h-screen bg-[#060d1a]`}>
      {/* Cover */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-[#1a3c5e] to-[#060d1a] overflow-hidden">
        {channel.coverImage && <img src={channel.coverImage} alt={channel.name} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060d1a] via-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-xl backdrop-blur-sm transition">
          <ArrowLeft size={18} />
        </button>
        {channel.isLive && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
            <Wifi size={12} className="animate-pulse" /> LIVE
          </div>
        )}
      </div>

      {/* Channel info */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-end gap-4 -mt-8 mb-5">
          {channel.logo
            ? <img src={channel.logo} alt={channel.name} className="w-20 h-20 rounded-2xl object-cover border-4 border-[#060d1a] flex-shrink-0" />
            : <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center border-4 border-[#060d1a] flex-shrink-0">
                <span className="text-[#1a3c5e] font-black text-2xl">{channel.name.charAt(0)}</span>
              </div>
          }
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-white font-black text-xl sm:text-2xl">{channel.name}</h1>
              {channel.isVerified && <CheckCircle size={18} className="text-amber-400 flex-shrink-0" />}
              <span className="text-xs text-gray-400 capitalize px-2 py-0.5 bg-white/10 rounded-full">{channel.platform}</span>
            </div>
            <p className="text-gray-400 text-sm mt-0.5">{channel.followersCount} follower{channel.followersCount !== 1 ? 's' : ''} · {channel.members?.length || 0} member{channel.members?.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {channel.description && <p className="text-gray-300 text-sm mb-5 leading-relaxed">{channel.description}</p>}

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          <button onClick={toggleFollow} disabled={actionLoading}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition disabled:opacity-60 ${
              following ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-amber-400 hover:bg-amber-300 text-[#1a3c5e]'
            }`}>
            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : following ? <BellOff size={14} /> : <Bell size={14} />}
            {following ? 'Following' : 'Follow'}
          </button>
          {user?.mediaRole && !isHost && (
            <button onClick={toggleJoin} disabled={actionLoading}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition border disabled:opacity-60 ${
                joined ? 'border-white/20 text-gray-300 hover:bg-white/10' : 'border-white/20 text-white hover:bg-white/10'
              }`}>
              {joined ? <UserMinus size={14} /> : <UserPlus size={14} />}
              {joined ? 'Leave' : 'Join'}
            </button>
          )}
          {canCreate && (
            <Link to={`${base}/media/create?channel=${channel._id}&platform=${channel.platform}`}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold border border-white/20 text-white hover:bg-white/10 rounded-xl transition">
              <Plus size={14} /> Add Content
            </Link>
          )}
          {isHost && (
            <Link to={`${base}/media/channel/${channel.slug}/settings`}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition">
              <Settings size={14} /> Settings
            </Link>
          )}
        </div>

        {/* Live embed */}
        {channel.isLive && channel.liveUrl && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Wifi size={14} className="text-red-400 animate-pulse" />
              <span className="text-red-400 font-bold text-sm">{channel.liveTitle || 'Live Now'}</span>
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
              <iframe src={channel.liveUrl.replace('watch?v=', 'embed/')} title="Live Stream"
                className="w-full h-full" frameBorder="0" allowFullScreen allow="autoplay; encrypted-media" />
            </div>
          </div>
        )}

        {/* Members */}
        {channel.members?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-white font-bold mb-3">Members</h3>
            <div className="flex gap-2 flex-wrap">
              {channel.members.map((m, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  {m.user?.avatar
                    ? <img src={m.user.avatar} alt={m.user.fullName} className="w-6 h-6 rounded-full object-cover" />
                    : <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center text-white text-xs font-bold">
                        {m.user?.fullName?.charAt(0)}
                      </div>
                  }
                  <span className="text-white text-xs font-medium">{m.user?.fullName}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${m.role === 'host' ? 'bg-amber-400/20 text-amber-400' : 'bg-white/10 text-gray-400'}`}>{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div>
          <h3 className="text-white font-bold mb-4">Content ({content.length})</h3>
          {content.length === 0
            ? <div className="text-center py-12 text-gray-500">No content yet.</div>
            : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
                {content.map(item => (
                  <Link key={item._id} to={`${base}/media/content/${item._id}`}
                    className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-2xl overflow-hidden transition">
                    <div className="relative aspect-video bg-[#0d1f35]">
                      {item.thumbnail
                        ? <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center">
                            {channel.platform === 'tv' ? <Play size={28} className="text-red-400/50" /> : <Headphones size={28} className="text-purple-400/50" />}
                          </div>
                      }
                    </div>
                    <div className="p-3">
                      <p className="text-white text-sm font-semibold line-clamp-2 group-hover:text-amber-400 transition">{item.title}</p>
                      <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Eye size={11} />{formatViews(item.views)}</span>
                        <span className="flex items-center gap-1"><Heart size={11} />{item.likes?.length || 0}</span>
                        <span className="flex items-center gap-1"><MessageCircle size={11} />{item.commentsCount || 0}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  )
}
