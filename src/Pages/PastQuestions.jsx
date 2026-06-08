import { useState, useEffect } from 'react'
import axios from 'axios'
import { FileQuestion, FileText, Download, Search, Calendar, User } from 'lucide-react'

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function PastQuestions() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    axios
      .get('/api/resources?category=past-question')
      .then(res => setQuestions(res.data.resources || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const filtered = questions.filter(q =>
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    q.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">Past Questions</h1>
        <p className="text-gray-500 text-sm mt-1">Previous exam questions by course</p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by course or title..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
        />
      </div>

      {loading && (
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <FileQuestion size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">Could not load past questions</p>
          <p className="text-gray-400 text-sm mt-1">Make sure the server is running, then refresh.</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <FileQuestion size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">
            {questions.length === 0 ? 'No past questions uploaded yet' : 'No results found'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {questions.length === 0
              ? 'Past questions will appear here once the admin uploads them.'
              : 'Try a different search term.'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-3">
          {filtered.map(q => (
            <div
              key={q._id}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-[#1a3c5e]/20 transition flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-amber-500" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#1a3c5e] text-sm leading-snug truncate">
                  {q.title}
                </h3>
                {q.description && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{q.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  {q.uploadedBy?.fullName && (
                    <span className="flex items-center gap-1">
                      <User size={11} /> {q.uploadedBy.fullName}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {fmtDate(q.createdAt)}
                  </span>
                </div>
              </div>

              <a
                href={q.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1a3c5e] hover:bg-[#162f4a] text-white text-xs font-medium rounded-xl transition flex-shrink-0"
              >
                <Download size={13} /> Open
              </a>
            </div>
          ))}
          <p className="text-xs text-gray-400 text-right mt-1">{filtered.length} file{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  )
}
