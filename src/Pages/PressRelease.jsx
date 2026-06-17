import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import SignInPrompt from '../Components/SignInPrompt'
import { Megaphone, Calendar, User } from 'lucide-react'

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export default function PressRelease() {
  const { user } = useAuth()
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/press')
      .then(res => setReleases(res.data.releases || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">Press Releases</h1>
        <p className="text-gray-500 text-sm mt-1">Official statements from the department</p>
      </div>

      {loading && (
        <div className="grid gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
      )}

      {!loading && releases.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Megaphone size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">No press releases yet</p>
          <p className="text-gray-400 text-sm mt-1">Official statements will appear here.</p>
        </div>
      )}

      {!loading && releases.length > 0 && (
        <div className="grid gap-4 mb-8">
          {releases.map(r => (
            <div key={r._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition">
              {r.imageUrl && (
                <img src={r.imageUrl} alt={r.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {fmtDate(r.createdAt)}</span>
                  {r.author?.fullName && <span className="flex items-center gap-1"><User size={12} /> {r.author.fullName}</span>}
                </div>
                <h3 className="font-semibold text-[#1a3c5e] text-base mb-2">{r.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!user && releases.length > 0 && (
        <SignInPrompt feature="full press releases and document downloads" />
      )}
    </div>
  )
}
