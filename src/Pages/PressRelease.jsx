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
    <div className="pt-2">
      <div className="mb-8 px-1">
        <h1 className="text-2xl font-bold text-white">Press Releases</h1>
        <p className="text-gray-500 text-sm mt-1">Official statements from the department</p>
      </div>

      {loading && (
        <div className="divide-y divide-white/5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="py-5 space-y-2 animate-pulse">
              <div className="h-2.5 bg-white/5 rounded-full w-32" />
              <div className="h-4 bg-white/10 rounded-full w-2/3" />
              <div className="h-3 bg-white/5 rounded-full w-full" />
              <div className="h-3 bg-white/5 rounded-full w-4/5" />
            </div>
          ))}
        </div>
      )}

      {!loading && releases.length === 0 && (
        <div className="py-20 text-center">
          <Megaphone size={40} className="mx-auto mb-3 text-gray-700" />
          <p className="text-gray-400 font-medium">No press releases yet</p>
          <p className="text-gray-600 text-sm mt-1">Official statements will appear here.</p>
        </div>
      )}

      {!loading && releases.length > 0 && (
        <div className="divide-y divide-white/5">
          {releases.map(r => (
            <div key={r._id} className="py-5">
              {r.imageUrl && (
                <img src={r.imageUrl} alt={r.title} className="w-full h-48 object-cover rounded-xl mb-4" />
              )}
              <div className="flex items-center gap-3 mb-2 text-xs text-gray-600">
                <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(r.createdAt)}</span>
                {r.author?.fullName && <span className="flex items-center gap-1"><User size={11} /> {r.author.fullName}</span>}
              </div>
              <h3 className="font-semibold text-white text-base mb-2">{r.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}
        </div>
      )}

      {!user && releases.length > 0 && (
        <div className="mt-6">
          <SignInPrompt feature="full press releases and document downloads" />
        </div>
      )}
    </div>
  )
}
