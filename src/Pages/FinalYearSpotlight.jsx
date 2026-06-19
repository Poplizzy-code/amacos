import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import SignInPrompt from '../Components/SignInPrompt'
import { Loader2, User } from 'lucide-react'

export default function FinalYearSpotlight() {
  const { user } = useAuth()
  const [spotlights, setSpotlights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/spotlights')
      .then(res => setSpotlights(res.data.spotlights || []))
      .catch(() => toast.error('Unable to load final year spotlights.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pt-2">
      <div className="mb-8 px-1">
        <h1 className="text-2xl font-bold text-white">Final Year Spotlight</h1>
        <p className="text-gray-500 text-sm mt-1">Featuring graduating students and their capstone work.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-600" />
        </div>
      )}

      {!loading && spotlights.length === 0 && (
        <div className="py-20 text-center">
          <User size={40} className="mx-auto mb-3 text-gray-700" />
          <p className="text-gray-400 text-sm">No spotlight entries published yet.</p>
        </div>
      )}

      {!loading && spotlights.length > 0 && (
        <div className="divide-y divide-white/5">
          {spotlights.map((item) => (
            <div key={item._id} className="py-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e] flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                  {item.studentName?.charAt(0) || 'F'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white text-sm">{item.studentName}</h3>
                    <span className="text-xs bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">{item.level || '400L'}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{item.projectTitle}</p>
                  {item.description && <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><User size={11} />{item.createdBy?.fullName || 'Admin'}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!user && spotlights.length > 0 && (
        <div className="mt-6">
          <SignInPrompt feature="view full member details and interact with spotlight entries" />
        </div>
      )}
    </div>
  )
}
