import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import SignInPrompt from '../Components/SignInPrompt'
import { Calendar, Clock, MapPin } from 'lucide-react'

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
const isPast = (date) => new Date(date) < new Date()

export default function Events() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/events')
      .then(res => setEvents(res.data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const upcoming = events.filter(e => !isPast(e.date))
  const past = events.filter(e => isPast(e.date))

  return (
    <div className="pt-2">
      <div className="mb-8 px-1">
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <p className="text-gray-500 text-sm mt-1">Department events and activities</p>
      </div>

      {loading && (
        <div className="divide-y divide-white/5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="py-5 flex gap-4 animate-pulse">
              <div className="w-24 h-20 bg-white/5 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-white/10 rounded-full w-3/4" />
                <div className="h-2.5 bg-white/5 rounded-full w-1/2" />
                <div className="h-2.5 bg-white/5 rounded-full w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="py-20 text-center">
          <Calendar size={40} className="mx-auto mb-3 text-gray-700" />
          <p className="text-gray-400 font-medium">No events posted yet</p>
          <p className="text-gray-600 text-sm mt-1">Events will appear here once the admin posts them.</p>
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 px-1">Coming Up</p>
          <div className="divide-y divide-white/5">
            {upcoming.map(ev => <EventCard key={ev._id} ev={ev} />)}
          </div>
        </div>
      )}

      {!loading && past.length > 0 && (
        <div className="opacity-50">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 px-1">Past Events</p>
          <div className="divide-y divide-white/5">
            {past.map(ev => <EventCard key={ev._id} ev={ev} past />)}
          </div>
        </div>
      )}

      {!user && events.length > 0 && (
        <div className="mt-8"><SignInPrompt feature="event registration and reminders" /></div>
      )}
    </div>
  )
}

function EventCard({ ev, past }) {
  return (
    <div className="py-4 flex gap-4">
      {ev.imageUrl ? (
        <img src={ev.imageUrl} alt={ev.title} className="w-24 h-20 object-cover rounded-xl flex-shrink-0" />
      ) : (
        <div className="w-24 h-20 bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] rounded-xl flex items-center justify-center flex-shrink-0">
          <Calendar size={22} className="text-white/30" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {past && <span className="text-xs bg-white/5 text-gray-500 px-2 py-0.5 rounded-full font-medium inline-block mb-1.5">Past</span>}
        <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">{ev.title}</h3>
        {ev.description && <p className="text-gray-500 text-xs mb-2 line-clamp-2">{ev.description}</p>}
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(ev.date)}</span>
          {ev.time && <span className="flex items-center gap-1"><Clock size={11} /> {ev.time}</span>}
          {ev.location && <span className="flex items-center gap-1"><MapPin size={11} /> {ev.location}</span>}
        </div>
      </div>
    </div>
  )
}
