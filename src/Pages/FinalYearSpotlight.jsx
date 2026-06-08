import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import SignInPrompt from '../components/SignInPrompt'
import { Loader2, User } from 'lucide-react'

export default function FinalYearSpotlight() {
  const { user } = useAuth()
  const [spotlights, setSpotlights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSpotlights = async () => {
      try {
        const { data } = await axios.get('/api/spotlights')
        setSpotlights(data.spotlights || [])
      } catch {
        toast.error('Unable to load final year spotlights.')
      } finally {
        setLoading(false)
      }
    }

    loadSpotlights()
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">Final Year Spotlight</h1>
        <p className="text-gray-500 text-sm mt-1">Featuring graduating students and their capstone work.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#1a3c5e]" />
        </div>
      ) : spotlights.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-gray-500 text-sm">No spotlight entries have been published yet. Admins can add them from the admin panel.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {spotlights.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1a3c5e]/10 flex items-center justify-center text-2xl font-bold text-[#1a3c5e] flex-shrink-0">
                  {item.studentName?.charAt(0) || 'F'}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[#1a3c5e] text-sm truncate">{item.studentName}</h3>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{item.level || '400L'}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">{item.projectTitle}</p>
                </div>
              </div>

              {item.description && <p className="text-sm text-gray-600">{item.description}</p>}

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><User size={12} />{item.createdBy?.fullName || 'Admin'}</span>
                <span>{new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!user && (
        <div className="mt-6">
          <SignInPrompt feature="view full member details and interact with spotlight entries" />
        </div>
      )}
    </div>
  )
}