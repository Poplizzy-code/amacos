import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  Newspaper, Calendar, Users, ArrowRight,
  Heart, Globe, Film, Clock, MapPin, Star, Megaphone,
} from 'lucide-react'

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function CardSkeleton({ count = 4, className = 'h-52' }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`bg-white rounded-2xl border border-gray-100 ${className} animate-pulse`} />
      ))}
    </div>
  )
}

function Empty({ icon: Icon, text }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
      <Icon size={32} className="mx-auto mb-3 text-gray-200" />
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  )
}

function SectionHeader({ tag, title, desc, linkTo }) {
  return (
    <div className="flex items-end justify-between mb-7">
      <div>
        <span className="text-amber-500 text-xs font-bold tracking-widest uppercase">{tag}</span>
        <h2 className="text-2xl font-display font-bold text-[#0d1f35] mt-1">{title}</h2>
        {desc && <p className="text-gray-400 text-sm mt-0.5">{desc}</p>}
      </div>
      <Link to={linkTo}
        className="text-[#1a3c5e] text-sm font-medium hover:underline flex items-center gap-1 shrink-0">
        See all <ArrowRight size={14} />
      </Link>
    </div>
  )
}

export default function Explore() {
  const [news, setNews]     = useState([])
  const [events, setEvents] = useState([])
  const [posts, setPosts]   = useState([])
  const [press, setPress]   = useState([])
  const [loadingNews, setLoadingNews]     = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingPosts, setLoadingPosts]   = useState(true)
  const [loadingPress, setLoadingPress]   = useState(true)

  useEffect(() => {
    axios.get('/api/news?limit=4')
      .then(r => setNews(r.data.news || []))
      .catch(() => {})
      .finally(() => setLoadingNews(false))

    axios.get('/api/events')
      .then(r => {
        const upcoming = (r.data.events || [])
          .filter(e => new Date(e.date) >= new Date())
          .slice(0, 4)
        setEvents(upcoming)
      })
      .catch(() => {})
      .finally(() => setLoadingEvents(false))

    axios.get('/api/posts/public?limit=4')
      .then(r => setPosts(r.data.posts || []))
      .catch(() => {})
      .finally(() => setLoadingPosts(false))

    axios.get('/api/press')
      .then(r => setPress((r.data.releases || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoadingPress(false))
  }, [])

  return (
    <div>
      {/* Page header banner */}
      <div className="bg-gradient-to-r from-[#060d1a] to-[#0d1f35] -mx-4 -mt-8 px-6 py-16 mb-12 text-center"
        style={{ borderRadius: '0 0 24px 24px' }}>
        <span className="inline-block text-amber-400 text-xs font-bold tracking-widest uppercase mb-4">
          Public Hub
        </span>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
          Explore AMACOS
        </h1>
        <p className="text-blue-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8">
          News, events, community posts and more — everything happening in the Mass Communication Department at Adeleke University.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/register"
            className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0d1f35] font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/20">
            Join AMACOS <ArrowRight size={16} />
          </Link>
          <Link to="/login"
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition">
            Sign In
          </Link>
        </div>
      </div>

      <div className="space-y-16">

        {/* ── Latest News ─────────────────────────────────────── */}
        <section>
          <SectionHeader tag="Department Press" title="Latest News" desc="Announcements and updates" linkTo="/news" />
          {loadingNews ? <CardSkeleton count={4} className="h-52" /> : (
            news.length === 0
              ? <Empty icon={Newspaper} text="No news published yet. Check back soon." />
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {news.map(item => (
                    <Link key={item._id} to={`/news/${item._id}`}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-[#1a3c5e]/20 transition group">
                      <div className="h-36 bg-gray-50 overflow-hidden flex-shrink-0">
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                          : (
                            <div className="w-full h-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center">
                              <Newspaper size={24} className="text-white/20" />
                            </div>
                          )
                        }
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                          <Calendar size={10} /> {fmtDate(item.createdAt)}
                        </p>
                        <h3 className="font-semibold text-[#1a3c5e] text-sm leading-snug line-clamp-2 group-hover:text-[#2563a8] transition-colors">
                          {item.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              )
          )}
        </section>

        {/* ── Upcoming Events ──────────────────────────────────── */}
        <section>
          <SectionHeader tag="Calendar" title="Upcoming Events" desc="Don't miss what's happening" linkTo="/events" />
          {loadingEvents ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />
              ))}
            </div>
          ) : (
            events.length === 0
              ? <Empty icon={Calendar} text="No upcoming events at the moment." />
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {events.map(event => (
                    <div key={event._id}
                      className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 hover:shadow-md hover:border-[#1a3c5e]/20 transition">
                      <div className="w-14 h-14 rounded-xl bg-[#1a3c5e]/5 flex flex-col items-center justify-center flex-shrink-0 border border-[#1a3c5e]/10">
                        <span className="text-[#1a3c5e] font-bold text-xl leading-none">
                          {new Date(event.date).getDate()}
                        </span>
                        <span className="text-[#1a3c5e] text-xs uppercase tracking-wide">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[#1a3c5e] text-sm leading-snug mb-1.5 line-clamp-2">
                          {event.title}
                        </h3>
                        <div className="flex flex-col gap-0.5">
                          {event.time && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock size={10} /> {event.time}
                            </p>
                          )}
                          {event.location && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin size={10} /> {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
          )}
        </section>

        {/* ── Social Feed ───────────────────────────────────────── */}
        <section>
          <SectionHeader tag="Community" title="From the Social Feed" desc="Public posts from AMACOS members" linkTo="/social" />
          {loadingPosts ? <CardSkeleton count={4} className="h-48" /> : (
            posts.length === 0
              ? <Empty icon={Users} text="No public posts yet." />
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {posts.map(post => (
                    <Link key={post._id} to="/social"
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-[#1a3c5e]/20 transition group flex flex-col">
                      {post.mediaUrl && post.mediaType !== 'video' && (
                        <div className="h-36 overflow-hidden bg-gray-50 flex-shrink-0">
                          <img src={post.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        </div>
                      )}
                      {post.mediaUrl && post.mediaType === 'video' && (
                        <div className="h-36 bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Film size={24} className="text-gray-300" />
                        </div>
                      )}
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {post.author?.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1a3c5e] truncate">{post.author?.fullName}</p>
                            <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
                          </div>
                        </div>
                        {post.content && (
                          <p className="text-gray-600 text-xs leading-relaxed line-clamp-3 flex-1">{post.content}</p>
                        )}
                        <div className="flex items-center gap-3 text-gray-400 text-xs mt-3">
                          <span className="flex items-center gap-1"><Heart size={11} /> {post.likes?.length || 0}</span>
                          <span className="flex items-center gap-1 text-blue-300"><Globe size={11} /> Public</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
          )}
        </section>

        {/* ── Press Releases ────────────────────────────────────── */}
        {(!loadingPress && press.length > 0) && (
          <section>
            <SectionHeader tag="Official Statements" title="Press Releases" desc="Formal department communications" linkTo="/press" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {press.map(item => (
                <div key={item._id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-[#1a3c5e]/20 transition">
                  <div className="w-9 h-9 rounded-xl bg-[#1a3c5e]/5 flex items-center justify-center mb-4">
                    <Megaphone size={16} className="text-[#1a3c5e]" />
                  </div>
                  <h3 className="font-semibold text-[#1a3c5e] text-sm leading-snug line-clamp-2 mb-2">{item.title}</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={10} /> {fmtDate(item.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Quick links ───────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-display font-bold text-[#0d1f35] mb-5">More to Explore</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Final Year Spotlight', icon: Star,      path: '/spotlight', color: 'bg-pink-50 text-pink-600 border-pink-100' },
              { label: 'Press Releases',       icon: Megaphone, path: '/press',     color: 'bg-amber-50 text-amber-600 border-amber-100' },
              { label: 'All Events',           icon: Calendar,  path: '/events',    color: 'bg-blue-50 text-blue-600 border-blue-100' },
              { label: 'Social Feed',          icon: Users,     path: '/social',    color: 'bg-purple-50 text-purple-600 border-purple-100' },
            ].map(item => (
              <Link key={item.path} to={item.path}
                className={`flex flex-col items-center gap-2 p-5 rounded-2xl border text-center hover:shadow-md transition ${item.color}`}>
                <item.icon size={22} />
                <span className="text-xs font-semibold leading-snug">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Join CTA ──────────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-[#1a3c5e] to-[#2563a8] rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-display font-bold text-white mb-2">
            Ready to be part of AMACOS?
          </h2>
          <p className="text-blue-300 mb-7 text-sm max-w-md mx-auto">
            Get full access — post, interact, study with resources, CBT practice and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0d1f35] font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/20">
              Join AMACOS <ArrowRight size={16} />
            </Link>
            <Link to="/login"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition">
              Sign In
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
