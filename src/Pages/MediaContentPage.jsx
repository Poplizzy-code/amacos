import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  ArrowLeft, Heart, MessageCircle, Eye, Share2, Loader2,
  Play, Headphones, CheckCircle, Wifi, Send, Trash2, CornerDownRight
} from 'lucide-react'

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
}
function formatViews(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function Comment({ comment, onDelete, onLike, onReply, user, base }) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying]   = useState(false)
  const liked = user && comment.likes?.includes(user._id)
  const isOwn = user && comment.author?._id === user._id
  const canDelete = isOwn || user?.mediaRole === 'chief-editor' || user?.isStaffAdmin

  const submitReply = async () => {
    if (!replyText.trim()) return
    setReplying(true)
    try {
      await onReply(comment._id, replyText.trim())
      setReplyText(''); setShowReply(false)
    } finally { setReplying(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        {comment.author?.avatar
          ? <img src={comment.author.avatar} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt={comment.author.fullName} />
          : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{comment.author?.fullName?.charAt(0)}</div>
        }
        <div className="flex-1 min-w-0">
          <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
            <p className="text-white text-xs font-semibold mb-1">{comment.author?.fullName}</p>
            <p className="text-gray-300 text-sm leading-relaxed">{comment.body}</p>
          </div>
          <div className="flex items-center gap-3 mt-1.5 px-1">
            <button onClick={() => onLike(comment._id)} className={`text-xs flex items-center gap-1 transition ${liked ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'}`}>
              <Heart size={12} fill={liked ? 'currentColor' : 'none'} /> {comment.likes?.length || 0}
            </button>
            {user && <button onClick={() => setShowReply(v => !v)} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition">
              <CornerDownRight size={12} /> Reply
            </button>}
            {canDelete && <button onClick={() => onDelete(comment._id)} className="text-xs text-gray-600 hover:text-red-400 transition ml-auto"><Trash2 size={12} /></button>}
          </div>
          {showReply && (
            <div className="flex items-center gap-2 mt-2 ml-1">
              <input value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitReply()}
                placeholder="Write a reply…"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/40" />
              <button onClick={submitReply} disabled={replying || !replyText.trim()}
                className="p-2 bg-amber-400 text-[#1a3c5e] rounded-xl disabled:opacity-50">
                {replying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Replies */}
      {comment.replies?.length > 0 && (
        <div className="ml-11 space-y-3">
          {comment.replies.map(r => (
            <div key={r._id} className="flex items-start gap-3">
              {r.author?.avatar
                ? <img src={r.author.avatar} className="w-7 h-7 rounded-full object-cover flex-shrink-0" alt={r.author.fullName} />
                : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{r.author?.fullName?.charAt(0)}</div>
              }
              <div className="flex-1 min-w-0">
                <div className="bg-white/5 rounded-2xl rounded-tl-sm px-3 py-2.5">
                  <p className="text-white text-xs font-semibold mb-0.5">{r.author?.fullName}</p>
                  <p className="text-gray-300 text-sm">{r.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MediaContentPage({ isApp = false }) {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const base = isApp ? '/app' : ''
  const commentRef = useRef()

  const [item, setItem]         = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [liked, setLiked]       = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commenting, setCommenting]   = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      axios.get(`/api/media/content/${id}`),
      axios.get(`/api/media/content/${id}/comments`),
    ]).then(([iRes, cRes]) => {
      setItem(iRes.data.item)
      setComments(cRes.data.comments || [])
      if (user) setLiked(iRes.data.item?.likes?.includes(user._id))
    }).catch(() => toast.error('Failed to load content.'))
    .finally(() => setLoading(false))
  }, [id, user])

  const toggleLike = async () => {
    if (!user) return navigate('/login')
    try {
      const { data } = await axios.post(`/api/media/content/${id}/like`, {}, { withCredentials: true })
      setLiked(data.liked)
      setItem(prev => ({ ...prev, likes: { length: data.likesCount } }))
    } catch { toast.error('Failed.') }
  }

  const postComment = async () => {
    if (!commentText.trim()) return
    if (!user) return navigate('/login')
    setCommenting(true)
    try {
      const { data } = await axios.post(`/api/media/content/${id}/comments`, { body: commentText.trim() }, { withCredentials: true })
      setComments(prev => [...prev, { ...data.comment, replies: [] }])
      setCommentText('')
      setItem(prev => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }))
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setCommenting(false) }
  }

  const replyToComment = async (parentId, body) => {
    const { data } = await axios.post(`/api/media/content/${id}/comments`, { body, parentComment: parentId }, { withCredentials: true })
    setComments(prev => prev.map(c => c._id === parentId ? { ...c, replies: [...(c.replies || []), data.comment] } : c))
    setItem(prev => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }))
  }

  const deleteComment = async (commentId) => {
    try {
      await axios.delete(`/api/media/content/${id}/comments/${commentId}`, { withCredentials: true })
      setComments(prev => prev.filter(c => c._id !== commentId))
      setItem(prev => ({ ...prev, commentsCount: Math.max(0, (prev.commentsCount || 0) - 1) }))
      toast.success('Deleted.')
    } catch { toast.error('Failed.') }
  }

  const likeComment = async (commentId) => {
    if (!user) return navigate('/login')
    // Comment likes can be added as a future feature — for now just toggle UI
    setComments(prev => prev.map(c => {
      if (c._id !== commentId) return c
      const already = c.likes?.includes(user._id)
      return { ...c, likes: already ? c.likes.filter(id => id !== user._id) : [...(c.likes || []), user._id] }
    }))
  }

  const share = () => {
    const url = `${window.location.origin}/media/content/${id}`
    if (navigator.share) {
      navigator.share({ title: item?.title, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    }
  }

  if (loading) return (
    <div className={`${isApp ? '-m-4 lg:-m-6' : ''} min-h-screen bg-[#060d1a] flex items-center justify-center`}>
      <Loader2 size={32} className="animate-spin text-amber-400" />
    </div>
  )
  if (!item) return (
    <div className={`${isApp ? '-m-4 lg:-m-6' : ''} min-h-screen bg-[#060d1a] flex items-center justify-center`}>
      <p className="text-gray-400">Content not found.</p>
    </div>
  )

  const isVideo   = item.platform === 'tv'
  const isAudio   = item.platform === 'radio'
  const isArticle = item.platform === 'newspaper' || item.platform === 'magazine'
  const likesCount = Array.isArray(item.likes) ? item.likes.length : (item.likes?.length || 0)

  return (
    <div className={`${isApp ? '-m-4 lg:-m-6' : ''} min-h-screen bg-[#060d1a]`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-5 transition">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Media player */}
        {isVideo && item.mediaUrl && (
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-6">
            <video src={item.mediaUrl} controls className="w-full h-full" poster={item.thumbnail || undefined} />
          </div>
        )}
        {isVideo && item.isLive && item.liveUrl && (
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-6">
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              <Wifi size={10} className="animate-pulse" /> LIVE
            </div>
            <iframe src={item.liveUrl.replace('watch?v=', 'embed/')} title={item.title}
              className="w-full h-full" frameBorder="0" allowFullScreen allow="autoplay; encrypted-media" />
          </div>
        )}
        {isAudio && item.mediaUrl && (
          <div className="bg-gradient-to-r from-[#1a3c5e] to-[#0d1f35] rounded-2xl p-6 mb-6 flex items-center gap-5">
            {item.thumbnail
              ? <img src={item.thumbnail} alt={item.title} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
              : <div className="w-24 h-24 rounded-xl bg-purple-400/20 flex items-center justify-center flex-shrink-0">
                  <Headphones size={32} className="text-purple-400" />
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg mb-3 truncate">{item.title}</p>
              <audio src={item.mediaUrl} controls className="w-full" style={{ accentColor: '#f59e0b' }} />
            </div>
          </div>
        )}

        {/* Article thumbnail */}
        {isArticle && item.thumbnail && (
          <div className="rounded-2xl overflow-hidden mb-6 aspect-video">
            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Title and meta */}
        <div className="mb-6">
          {item.category && (
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 block">{item.category}</span>
          )}
          <h1 className="text-white font-black text-2xl sm:text-3xl leading-tight mb-4">{item.title}</h1>

          <div className="flex items-center gap-3 flex-wrap text-sm text-gray-400 mb-4">
            {item.channel && (
              <Link to={`${base}/media/channel/${item.channel.slug}`} className="flex items-center gap-1.5 hover:text-amber-400 transition">
                {item.channel.logo && <img src={item.channel.logo} alt={item.channel.name} className="w-5 h-5 rounded" />}
                <span className="font-medium text-gray-300">{item.channel.name}</span>
                {item.channel.isVerified && <CheckCircle size={12} className="text-amber-400" />}
              </Link>
            )}
            <span>By {item.author?.fullName}</span>
            <span>{formatDate(item.publishedAt || item.createdAt)}</span>
            <span className="flex items-center gap-1"><Eye size={13} />{formatViews(item.views)}</span>
          </div>

          {item.description && !isArticle && (
            <p className="text-gray-400 leading-relaxed">{item.description}</p>
          )}

          {/* Article body */}
          {isArticle && item.body && (
            <div className="text-gray-300 leading-relaxed text-base whitespace-pre-wrap border-t border-white/5 pt-5">{item.body}</div>
          )}

          {/* Tags */}
          {item.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-4">
              {item.tags.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 bg-white/5 text-gray-400 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-3 py-4 border-y border-white/10 mb-8">
          <button onClick={toggleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${liked ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> {likesCount}
          </button>
          <button onClick={() => commentRef.current?.focus()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition">
            <MessageCircle size={16} /> {item.commentsCount || 0}
          </button>
          <button onClick={share}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition ml-auto">
            <Share2 size={16} /> Share
          </button>
        </div>

        {/* Comments */}
        <div>
          <h3 className="text-white font-bold mb-5">Comments ({item.commentsCount || 0})</h3>

          {user ? (
            <div className="flex items-start gap-3 mb-6">
              {user.avatar
                ? <img src={user.avatar} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt={user.fullName} />
                : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center text-white font-bold flex-shrink-0">{user.fullName?.charAt(0)}</div>
              }
              <div className="flex-1 flex gap-2">
                <input ref={commentRef} value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()}
                  placeholder="Add a comment…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/40" />
                <button onClick={postComment} disabled={commenting || !commentText.trim()}
                  className="p-3 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] rounded-2xl transition disabled:opacity-50">
                  {commenting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl px-5 py-4 mb-6 text-center">
              <p className="text-gray-400 text-sm"><Link to="/login" className="text-amber-400 hover:underline">Sign in</Link> to leave a comment.</p>
            </div>
          )}

          <div className="space-y-5">
            {comments.length === 0
              ? <p className="text-gray-500 text-sm text-center py-8">No comments yet. Be the first!</p>
              : comments.map(c => (
                  <Comment key={c._id} comment={c} user={user} base={base}
                    onDelete={deleteComment} onLike={likeComment} onReply={replyToComment} />
                ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
