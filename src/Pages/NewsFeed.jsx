import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import SignInPrompt from '../components/SignInPrompt'
import { Newspaper, Calendar, User } from 'lucide-react'

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

const truncate = (text, n) =>
  text && text.length > n ? text.slice(0, n) + '…' : text ?? ''

export default function NewsFeed() {
  const { user } = useAuth()
  const location = useLocation()
  const isApp = location.pathname.startsWith('/app')

  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    axios
      .get('/api/news')
      .then((res) => setNews(res.data.news || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">News Feed</h1>
        <p className="text-gray-500 text-sm mt-1">Department news and announcements</p>
      </div>

      {loading && (
        <div className="grid gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-40 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-20 text-red-400">
          <Newspaper size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Could not load news</p>
          <p className="text-sm text-gray-400 mt-1">Make sure the server is running, then refresh.</p>
        </div>
      )}

      {!loading && !error && news.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Newspaper size={48} className="mx-auto mb-3 opacity-30" />
          <p>No news published yet.</p>
        </div>
      )}

      {!loading && !error && news.length > 0 && (
        <div className="grid gap-4 mb-8">
          {news.map((item) => (
            <Link
              key={item._id}
              to={`${isApp ? '/app' : ''}/news/${item._id}`}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-[#1a3c5e]/20 transition group flex flex-col sm:flex-row">
              {/* Thumbnail */}
              <div className="sm:w-48 sm:flex-shrink-0 h-40 sm:h-auto bg-[#1a3c5e]/10 overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center">
                    <Newspaper size={32} className="text-white/20" />
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {fmtDate(item.createdAt)}
                    </span>
                    {item.author?.fullName && (
                      <span className="flex items-center gap-1">
                        <User size={12} /> {item.author.fullName}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-[#1a3c5e] text-base leading-snug mb-2 group-hover:text-[#2563a8] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-3">
                    {truncate(item.content, 200)}
                  </p>
                </div>
                <span className="text-[#1a3c5e] text-xs font-semibold mt-3 group-hover:underline">
                  Read more →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!user && (
        <div className="mt-4">
          <p className="text-center text-gray-400 text-sm mb-4">
            Sign in to post, comment and interact with news
          </p>
          <SignInPrompt feature="full news feed interaction" />
        </div>
      )}
    </div>
  )
}
