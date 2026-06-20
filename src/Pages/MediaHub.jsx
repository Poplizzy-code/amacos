import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  Tv2, Radio, Newspaper, BookOpen, Play, Headphones,
  Eye, Heart, MessageCircle, Wifi, Plus, Clock, ChevronRight,
  Mail, CheckCircle, Loader2, Search, Star
} from 'lucide-react'

const TABS = [
  { id: 'tv',        label: 'TV',         icon: Tv2,       color: 'text-red-400',    bg: 'bg-red-400/10' },
  { id: 'radio',     label: 'Radio',      icon: Radio,     color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'newspaper', label: 'Newspaper',  icon: Newspaper, color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  { id: 'magazine',  label: 'Magazine',   icon: BookOpen,  color: 'text-emerald-400',bg: 'bg-emerald-400/10' },
]

const PLATFORM_CATEGORIES = {
  tv:        ['News Bulletin', 'Documentary', 'Talk Show', 'Campus Life', 'Sports', 'Entertainment'],
  radio:     ['Podcast', 'Live Show', 'News', 'Music Programme', 'Talk Show', 'Sports'],
  newspaper: ['Breaking News', 'Opinion', 'Campus Life', 'Sports', 'Arts & Culture', 'Investigation'],
  magazine:  ['Cover Story', 'Feature', 'Profile', 'Opinion', 'Arts & Culture', 'Lifestyle'],
}

function formatDuration(secs) {
  if (!secs) return ''
  const m = Math.floor(secs / 60), s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatViews(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

// ── Channel card ──────────────────────────────────────────────────────────────
function ChannelCard({ channel, isApp }) {
  const base = isApp ? '/app' : ''
  return (
    <Link to={`${base}/media/channel/${channel.slug}`}
      className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-2xl overflow-hidden transition-all">
      <div className="relative h-24 bg-gradient-to-br from-[#1a3c5e] to-[#060d1a] overflow-hidden">
        {channel.coverImage
          ? <img src={channel.coverImage} alt={channel.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-[#1a3c5e] to-[#0d1f35]" />}
        {channel.isLive && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            <Wifi size={10} className="animate-pulse" /> LIVE
          </div>
        )}
        {channel.isVerified && (
          <div className="absolute top-2 left-2"><CheckCircle size={14} className="text-amber-400" /></div>
        )}
      </div>
      <div className="p-3 flex items-center gap-3">
        {channel.logo
          ? <img src={channel.logo} alt={channel.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 -mt-7 border-2 border-[#060d1a]" />
          : <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center -mt-7 border-2 border-[#060d1a] flex-shrink-0">
              <span className="text-[#1a3c5e] font-black text-sm">{channel.name.charAt(0)}</span>
            </div>
        }
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white text-sm truncate">{channel.name}</p>
          <p className="text-xs text-gray-400">{channel.followersCount} follower{channel.followersCount !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </Link>
  )
}

// ── Content card ──────────────────────────────────────────────────────────────
function ContentCard({ item, isApp, variant = 'default' }) {
  const base = isApp ? '/app' : ''
  const isVideo = item.platform === 'tv'
  const isAudio = item.platform === 'radio'
  const isArticle = item.platform === 'newspaper' || item.platform === 'magazine'

  if (variant === 'list') {
    return (
      <Link to={`${base}/media/content/${item._id}`}
        className="group flex items-start gap-3 hover:bg-white/5 rounded-xl px-2 py-2.5 -mx-2 transition">
        {item.thumbnail
          ? <img src={item.thumbnail} alt={item.title} className="w-20 h-14 rounded-lg object-cover flex-shrink-0" />
          : <div className={`w-20 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${TABS.find(t => t.id === item.platform)?.bg || 'bg-white/10'}`}>
              {isVideo && <Play size={18} className="text-red-400" />}
              {isAudio && <Headphones size={18} className="text-purple-400" />}
              {isArticle && <Newspaper size={18} className="text-blue-400" />}
            </div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-snug line-clamp-2 group-hover:text-amber-400 transition">{item.title}</p>
          <p className="text-xs text-gray-500 mt-1">{item.author?.fullName} · {formatViews(item.views)} views</p>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`${base}/media/content/${item._id}`}
      className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-2xl overflow-hidden transition-all">
      <div className="relative aspect-video bg-[#0d1f35] overflow-hidden">
        {item.isLive && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            <Wifi size={10} className="animate-pulse" /> LIVE
          </div>
        )}
        {item.category && (
          <div className="absolute top-2 right-2 z-10 text-xs px-2 py-0.5 bg-black/60 text-gray-300 rounded-full backdrop-blur-sm">{item.category}</div>
        )}
        {item.thumbnail
          ? <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className={`w-full h-full flex items-center justify-center ${TABS.find(t => t.id === item.platform)?.bg || 'bg-white/5'}`}>
              {isVideo && <Play size={32} className="text-red-400/60" />}
              {isAudio && <Headphones size={32} className="text-purple-400/60" />}
              {isArticle && <Newspaper size={32} className="text-blue-400/60" />}
            </div>
        }
        {item.duration > 0 && (
          <div className="absolute bottom-2 right-2 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded font-mono">{formatDuration(item.duration)}</div>
        )}
      </div>
      <div className="p-3">
        <p className="text-white font-semibold text-sm leading-snug line-clamp-2 group-hover:text-amber-400 transition mb-1.5">{item.title}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{item.author?.fullName}</span>
          <span className="flex items-center gap-1"><Eye size={11} />{formatViews(item.views)}</span>
          <span className="flex items-center gap-1"><Heart size={11} />{item.likes?.length || 0}</span>
          <span className="flex items-center gap-1"><MessageCircle size={11} />{item.commentsCount || 0}</span>
        </div>
      </div>
    </Link>
  )
}

// ── TV/Radio platform tab ─────────────────────────────────────────────────────
function MediaVideoAudioTab({ platform, isApp }) {
  const [channels, setChannels]   = useState([])
  const [content, setContent]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [category, setCategory]   = useState('')
  const [search, setSearch]       = useState('')
  const [liveOnly, setLiveOnly]   = useState(false)
  const cats = PLATFORM_CATEGORIES[platform] || []
  const tab  = TABS.find(t => t.id === platform)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ platform, limit: 24 })
    if (category) params.set('category', category)
    if (search)   params.set('search', search)
    Promise.all([
      axios.get(`/api/media/channels?platform=${platform}&limit=12`),
      axios.get(`/api/media/content?${params}`),
    ]).then(([cRes, mRes]) => {
      setChannels(cRes.data.channels || [])
      let items = mRes.data.items || []
      if (liveOnly) items = items.filter(i => i.isLive)
      setContent(items)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [platform, category, search, liveOnly])

  const liveChannels = channels.filter(c => c.isLive)

  return (
    <div className="space-y-8">
      {/* Live banner */}
      {liveChannels.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wifi size={16} className="text-red-400 animate-pulse" />
            <span className="text-red-400 font-bold text-sm uppercase tracking-wide">Currently Live</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {liveChannels.map(ch => (
              <Link key={ch._id} to={`${isApp ? '/app' : ''}/media/channel/${ch.slug}`}
                className="flex-shrink-0 flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-xl px-3 py-2 transition">
                {ch.logo
                  ? <img src={ch.logo} alt={ch.name} className="w-8 h-8 rounded-lg object-cover" />
                  : <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center"><Wifi size={14} className="text-red-400" /></div>
                }
                <div>
                  <p className="text-white text-xs font-semibold">{ch.name}</p>
                  <p className="text-red-400 text-xs">{ch.liveTitle || 'Live now'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Channels */}
      {channels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">Channels</h3>
            <Link to={`${isApp ? '/app' : ''}/media?tab=${platform}&view=channels`} className="text-xs text-amber-400 hover:underline flex items-center gap-1">
              See all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {channels.slice(0, 8).map(ch => <ChannelCard key={ch._id} channel={ch} isApp={isApp} />)}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex-1 min-w-48">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${platform}…`}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setCategory('')}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${!category ? `${tab?.bg} ${tab?.color}` : 'text-gray-500 hover:text-gray-300'}`}>
            All
          </button>
          {cats.map(cat => (
            <button key={cat} onClick={() => setCategory(cat === category ? '' : cat)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${category === cat ? `${tab?.bg} ${tab?.color}` : 'text-gray-500 hover:text-gray-300'}`}>
              {cat}
            </button>
          ))}
        </div>
        <button onClick={() => setLiveOnly(v => !v)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${liveOnly ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300'}`}>
          <Wifi size={12} className={liveOnly ? 'animate-pulse' : ''} /> Live
        </button>
      </div>

      {/* Content grid */}
      {loading
        ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white/5 rounded-2xl aspect-video animate-pulse" />)}
          </div>
        : content.length === 0
          ? <div className="text-center py-20"><div className={`w-16 h-16 ${tab?.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              <tab.icon size={28} className={tab?.color} />
            </div><p className="text-gray-400">No content yet. Check back soon.</p></div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.map(item => <ContentCard key={item._id} item={item} isApp={isApp} />)}
            </div>
      }
    </div>
  )
}

// ── Article/Magazine tab ──────────────────────────────────────────────────────
function MediaArticleTab({ platform, isApp }) {
  const [content, setContent]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [category, setCategory] = useState('')
  const [search, setSearch]     = useState('')
  const [featured, setFeatured] = useState(null)
  const cats = PLATFORM_CATEGORIES[platform] || []
  const tab  = TABS.find(t => t.id === platform)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ platform, limit: 30 })
    if (category) params.set('category', category)
    if (search)   params.set('search', search)
    axios.get(`/api/media/content?${params}`)
      .then(res => {
        const items = res.data.items || []
        setFeatured(items[0] || null)
        setContent(items.slice(1))
      }).catch(() => {}).finally(() => setLoading(false))
  }, [platform, category, search])

  const base = isApp ? '/app' : ''

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex-1 min-w-48">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${platform}…`}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setCategory('')}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${!category ? `${tab?.bg} ${tab?.color}` : 'text-gray-500 hover:text-gray-300'}`}>
            All
          </button>
          {cats.map(cat => (
            <button key={cat} onClick={() => setCategory(cat === category ? '' : cat)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${category === cat ? `${tab?.bg} ${tab?.color}` : 'text-gray-500 hover:text-gray-300'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading
        ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
        : !featured
          ? <div className="text-center py-20"><div className={`w-16 h-16 ${tab?.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              <tab.icon size={28} className={tab?.color} />
            </div><p className="text-gray-400">No articles yet.</p></div>
          : <>
              {/* Featured article */}
              <Link to={`${base}/media/content/${featured._id}`}
                className="group block rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition">
                {featured.thumbnail && (
                  <div className="relative h-52 sm:h-72 overflow-hidden">
                    <img src={featured.thumbnail} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
                    <div className="absolute bottom-0 p-5">
                      {featured.category && <span className={`text-xs font-bold uppercase tracking-wider ${tab?.color} mb-2 block`}>{featured.category}</span>}
                      <h2 className="text-white font-black text-xl sm:text-2xl leading-tight line-clamp-3">{featured.title}</h2>
                      <p className="text-gray-300 text-sm mt-2">{featured.author?.fullName} · <span className="flex items-center gap-1 inline-flex"><Eye size={11} /> {formatViews(featured.views)}</span></p>
                    </div>
                  </div>
                )}
                {!featured.thumbnail && (
                  <div className="p-5">
                    {featured.category && <span className={`text-xs font-bold uppercase tracking-wider ${tab?.color} mb-2 block`}>{featured.category}</span>}
                    <h2 className="text-white font-black text-2xl leading-tight group-hover:text-amber-400 transition">{featured.title}</h2>
                    <p className="text-gray-400 text-sm mt-2 line-clamp-3">{featured.description}</p>
                    <p className="text-gray-500 text-xs mt-3">{featured.author?.fullName}</p>
                  </div>
                )}
              </Link>

              {/* Article list */}
              {platform === 'magazine'
                ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {content.map(item => <ContentCard key={item._id} item={item} isApp={isApp} />)}
                  </div>
                : <div className="space-y-1 divide-y divide-white/5">
                    {content.map(item => <ContentCard key={item._id} item={item} isApp={isApp} variant="list" />)}
                  </div>
              }
            </>
      }
    </div>
  )
}

// ── Newsletter subscribe widget ───────────────────────────────────────────────
function NewsletterWidget({ activePlatform }) {
  const [email, setEmail]         = useState('')
  const [platforms, setPlatforms] = useState([activePlatform])
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)

  const toggle = (p) => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  const submit = async (e) => {
    e.preventDefault()
    if (!email || !platforms.length) return toast.error('Enter email and pick at least one platform.')
    setLoading(true)
    try {
      await axios.post('/api/media/newsletter/subscribe', { email, platforms })
      setDone(true); toast.success('Subscribed!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to subscribe.') }
    finally { setLoading(false) }
  }

  if (done) return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
      <CheckCircle size={28} className="mx-auto mb-2 text-emerald-400" />
      <p className="text-white font-semibold">You're subscribed!</p>
      <p className="text-gray-400 text-sm mt-1">Weekly digest will hit your inbox every Friday.</p>
    </div>
  )

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Mail size={16} className="text-amber-400" />
        <p className="text-white font-semibold text-sm">Weekly Digest</p>
      </div>
      <p className="text-gray-400 text-xs mb-4">Get the best of AMACOS Media in your inbox every week.</p>
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/40" />
        <div className="flex flex-wrap gap-1.5">
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => toggle(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${platforms.includes(t.id) ? `${t.bg} ${t.color}` : 'text-gray-500 bg-white/5'}`}>
              <t.icon size={11} />{t.label}
            </button>
          ))}
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin" />}
          Subscribe
        </button>
      </form>
    </div>
  )
}

// ── Main MediaHub ─────────────────────────────────────────────────────────────
export default function MediaHub({ isApp = false }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const initialTab = searchParams.get('tab') || 'tv'
  const [active, setActive] = useState(initialTab)

  const setTab = (id) => {
    setActive(id)
    const base = isApp ? '/app' : ''
    navigate(`${base}/media?tab=${id}`, { replace: true })
  }

  const canCreate = user && ['publisher', 'editor', 'chief-editor'].includes(user.mediaRole)
  const canReview = user && ['editor', 'chief-editor'].includes(user.mediaRole)
  const tab = TABS.find(t => t.id === active)

  return (
    <div className={isApp ? 'relative -m-4 lg:-m-6 min-h-full bg-[#060d1a]' : 'min-h-screen bg-[#060d1a]'}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#060d1a] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top bar with branding + actions */}
          <div className="flex items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Tv2 size={16} className="text-[#1a3c5e]" />
              </div>
              <div>
                <p className="text-white font-black text-sm leading-none">AMACOS MEDIA</p>
                <p className="text-gray-500 text-xs">Student Journalism Hub</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canReview && (
                <Link to={`${isApp ? '/app' : ''}/media/queue`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-semibold rounded-xl transition">
                  <Clock size={13} /> Queue
                </Link>
              )}
              {canCreate && (
                <Link to={`${isApp ? '/app' : ''}/media/create`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] text-xs font-bold rounded-xl transition">
                  <Plus size={13} /> Create
                </Link>
              )}
            </div>
          </div>
          {/* Tabs */}
          <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                  active === t.id ? `${t.color} border-current` : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}>
                <t.icon size={14} />{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-8">
          {/* Main feed */}
          <div className="flex-1 min-w-0">
            {(active === 'tv' || active === 'radio') && <MediaVideoAudioTab platform={active} isApp={isApp} />}
            {(active === 'newspaper' || active === 'magazine') && <MediaArticleTab platform={active} isApp={isApp} />}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 gap-5">
            <NewsletterWidget activePlatform={active} />
            {/* Platform info card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className={`w-10 h-10 ${tab?.bg} rounded-xl flex items-center justify-center mb-3`}>
                {tab && <tab.icon size={20} className={tab.color} />}
              </div>
              <p className="text-white font-bold text-sm mb-1">AMACOS {tab?.label}</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                {active === 'tv'        && 'Video news, documentaries, and shows produced by AMACOS student journalists.'}
                {active === 'radio'     && 'Podcasts, talk shows, and live broadcasts from AMACOS Radio.'}
                {active === 'newspaper' && 'Breaking news, opinion, and investigative pieces from the AMACOS Newsroom.'}
                {active === 'magazine'  && 'In-depth features, profiles, and lifestyle content from the AMACOS Magazine.'}
              </p>
              {!user && (
                <Link to="/login" className="mt-4 flex items-center gap-1.5 text-xs text-amber-400 hover:underline">
                  Sign in to subscribe <ChevronRight size={12} />
                </Link>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
