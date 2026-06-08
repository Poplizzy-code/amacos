import { useState, useEffect } from 'react'
import axios from 'axios'
import { FlaskConical, ExternalLink, Calendar, Search } from 'lucide-react'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'research', label: 'Research' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'internship', label: 'Internship' },
  { value: 'other', label: 'Other' },
]

const CAT_STYLE = {
  research:    'bg-blue-50 text-blue-600',
  opportunity: 'bg-green-50 text-green-600',
  scholarship: 'bg-purple-50 text-purple-600',
  internship:  'bg-amber-50 text-amber-600',
  other:       'bg-gray-100 text-gray-500',
}

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Research() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    axios.get('/api/research')
      .then(res => setItems(res.data.research || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(it => {
    const matchSearch = it.title.toLowerCase().includes(search.toLowerCase()) ||
      it.description?.toLowerCase().includes(search.toLowerCase())
    const matchCat = !catFilter || it.category === catFilter
    return matchSearch && matchCat
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">Research & Opportunities</h1>
        <p className="text-gray-500 text-sm mt-1">Scholarships, internships, research opportunities and more</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search opportunities..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCatFilter(c.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition border ${catFilter === c.value ? 'bg-[#1a3c5e] text-white border-[#1a3c5e]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#1a3c5e]/40'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="grid gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>}

      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <FlaskConical size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">{items.length === 0 ? 'No items posted yet' : 'No results found'}</p>
          <p className="text-gray-400 text-sm mt-1">{items.length === 0 ? 'Research and opportunities will appear here.' : 'Try a different search or category.'}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid gap-4">
          {filtered.map(it => (
            <div key={it._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col sm:flex-row">
              {it.imageUrl ? (
                <img src={it.imageUrl} alt={it.title} className="sm:w-40 h-32 sm:h-auto object-cover flex-shrink-0" />
              ) : (
                <div className="sm:w-40 h-20 sm:h-auto bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center flex-shrink-0">
                  <FlaskConical size={28} className="text-white/30" />
                </div>
              )}
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_STYLE[it.category] ?? 'bg-gray-100 text-gray-500'}`}>
                      {CATEGORIES.find(c => c.value === it.category)?.label ?? it.category}
                    </span>
                    {it.deadline && (
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <Calendar size={11} /> Deadline: {fmtDate(it.deadline)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-[#1a3c5e] mb-1">{it.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-3">{it.description}</p>
                </div>
                {it.link && (
                  <a href={it.link} target="_blank" rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-[#1a3c5e] text-sm font-medium hover:underline">
                    <ExternalLink size={14} /> Apply / Learn more
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
