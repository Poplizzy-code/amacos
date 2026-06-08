import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, User, Newspaper } from 'lucide-react'
import axios from 'axios'

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

export default function NewsArticle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    axios
      .get(`/api/news/${id}`)
      .then((res) => setNews(res.data.news))
      .catch(() => setError('This article could not be found.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#1a3c5e] border-t-transparent rounded-full animate-spin" />
      </div>
    )

  if (error || !news)
    return (
      <div className="text-center py-24 px-4">
        <Newspaper size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">{error || 'Article not found.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-[#1a3c5e] text-sm font-medium hover:underline">
          ← Go back
        </button>
      </div>
    )

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#1a3c5e] text-sm font-medium mb-6 hover:underline">
        <ArrowLeft size={16} /> Back to News
      </button>

      {news.imageUrl ? (
        <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden mb-6">
          <img
            src={news.imageUrl}
            alt={news.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-[#1a3c5e] to-[#2d6fa8] flex items-center justify-center mb-6">
          <Newspaper size={48} className="text-white/30" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} />
          {fmtDate(news.createdAt)}
        </span>
        {news.author?.fullName && (
          <span className="flex items-center gap-1.5">
            <User size={14} />
            {news.author.fullName}
          </span>
        )}
      </div>

      <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1a3c5e] leading-tight mb-6">
        {news.title}
      </h1>

      <div className="border-t border-gray-100 pt-6">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
          {news.content}
        </p>
      </div>
    </article>
  )
}
