import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import SignInPrompt from '../Components/SignInPrompt'
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
    axios.get('/api/news')
      .then((res) => setNews(res.data.news || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pt-2">
      <div className="mb-8 px-1">
        <h1 className="text-2xl font-bold text-white">News Feed</h1>
        <p className="text-gray-500 text-sm mt-1">Department news and announcements</p>
      </div>

      {loading && (
        <div className="divide-y divide-white/5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="py-4 flex gap-4 animate-pulse">
              <div className="w-24 h-20 bg-white/5 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-2.5 bg-white/5 rounded-full w-24" />
                <div className="h-3.5 bg-white/10 rounded-full w-3/4" />
                <div className="h-2.5 bg-white/5 rounded-full w-full" />
                <div className="h-2.5 bg-white/5 rounded-full w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="py-20 text-center">
          <Newspaper size={40} className="mx-auto mb-3 text-gray-700" />
          <p className="text-gray-400 font-medium">Could not load news</p>
          <p className="text-gray-600 text-sm mt-1">Make sure the server is running, then refresh.</p>
        </div>
      )}

      {!loading && !error && news.length === 0 && (
        <div className="py-20 text-center">
          <Newspaper size={40} className="mx-auto mb-3 text-gray-700" />
          <p className="text-gray-400">No news published yet.</p>
        </div>
      )}

      {!loading && !error && news.length > 0 && (
        <div className="divide-y divide-white/5">
          {news.map((item) => (
            <Link
              key={item._id}
              to={`${isApp ? '/app' : ''}/news/${item._id}`}
              className="py-4 flex gap-4 group block">
              <div className="w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-[#1a3c5e]/30">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Newspaper size={22} className="text-white/20" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1.5 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(item.createdAt)}</span>
                  {item.author?.fullName && (
                    <span className="flex items-center gap-1"><User size={11} /> {item.author.fullName}</span>
                  )}
                </div>
                <h3 className="font-semibold text-white text-sm leading-snug mb-1.5 group-hover:text-amber-400 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-xs line-clamp-2">
                  {truncate(item.content, 160)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!user && news.length > 0 && (
        <div className="mt-6">
          <SignInPrompt feature="full news feed interaction" />
        </div>
      )}
    </div>
  )
}
