import { useState, useEffect } from 'react'
import axios from 'axios'
import { BookOpen, FileText, Download, Search, Calendar, User } from 'lucide-react'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'lecture-note', label: 'Lecture Notes' },
  { value: 'textbook', label: 'Textbooks' },
  { value: 'assignment', label: 'Assignments' },
  { value: 'other', label: 'Other' },
]

const CAT_STYLE = {
  'lecture-note': 'bg-blue-50 text-blue-600',
  'textbook':     'bg-green-50 text-green-600',
  'assignment':   'bg-purple-50 text-purple-600',
  'other':        'bg-gray-100 text-gray-500',
}

const catLabel = (v) => CATEGORIES.find(c => c.value === v)?.label ?? v
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Resources() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')

  useEffect(() => {
    axios
      .get('/api/resources?exclude=past-question')
      .then(res => setResources(res.data.resources || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const filtered = resources.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
    const matchCat = !catFilter || r.category === catFilter
    return matchSearch && matchCat
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">Resources</h1>
        <p className="text-gray-500 text-sm mt-1">Study materials organized by category</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCatFilter(c.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition border ${
                catFilter === c.value
                  ? 'bg-[#1a3c5e] text-white border-[#1a3c5e]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#1a3c5e]/40'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">Could not load resources</p>
          <p className="text-gray-400 text-sm mt-1">Make sure the server is running, then refresh.</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">
            {resources.length === 0 ? 'No resources uploaded yet' : 'No results found'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {resources.length === 0
              ? 'Resources will appear here once the admin uploads them.'
              : 'Try a different search or category.'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-3">
          {filtered.map(r => (
            <div
              key={r._id}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-[#1a3c5e]/20 transition flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-amber-500" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#1a3c5e] text-sm leading-snug truncate">
                  {r.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_STYLE[r.category] ?? 'bg-gray-100 text-gray-500'}`}>
                    {catLabel(r.category)}
                  </span>
                  {r.description && (
                    <span className="text-xs text-gray-400 truncate max-w-xs hidden sm:inline">
                      {r.description}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  {r.uploadedBy?.fullName && (
                    <span className="flex items-center gap-1">
                      <User size={11} /> {r.uploadedBy.fullName}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {fmtDate(r.createdAt)}
                  </span>
                </div>
              </div>

              <a
                href={r.fileUrl}
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
