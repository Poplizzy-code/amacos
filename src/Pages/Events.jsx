import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import SignInPrompt from '../Components/SignInPrompt'
import { Calendar, Clock, MapPin, Image as ImageIcon } from 'lucide-react'

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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">Events Calendar</h1>
        <p className="text-gray-500 text-sm mt-1">Upcoming department events and activities</p>
      </div>

      {loading && (
        <div className="grid gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
      )}

      {!loading && events.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Calendar size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">No events posted yet</p>
          <p className="text-gray-400 text-sm mt-1">Events will appear here once the admin posts them.</p>
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="grid gap-4">
            {upcoming.map(ev => <EventCard key={ev._id} ev={ev} />)}
          </div>
        </div>
      )}

      {!loading && past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Past Events</h2>
          <div className="grid gap-4 opacity-60">
            {past.map(ev => <EventCard key={ev._id} ev={ev} past />)}
          </div>
        </div>
      )}

      {!user && <div className="mt-8"><SignInPrompt feature="event registration and reminders" /></div>}
    </div>
  )
}

function EventCard({ ev, past }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col sm:flex-row`}>
      {ev.imageUrl ? (
        <img src={ev.imageUrl} alt={ev.title} className="sm:w-40 h-32 sm:h-auto object-cover flex-shrink-0" />
      ) : (
        <div className="sm:w-40 h-24 sm:h-auto bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center flex-shrink-0">
          <Calendar size={28} className="text-white/30" />
        </div>
      )}
      <div className="p-5 flex flex-col justify-center">
        {past && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium w-fit mb-2">Past</span>}
        <h3 className="font-semibold text-[#1a3c5e] text-base mb-2">{ev.title}</h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{ev.description}</p>
        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Calendar size={12} /> {fmtDate(ev.date)}</span>
          {ev.time && <span className="flex items-center gap-1"><Clock size={12} /> {ev.time}</span>}
          {ev.location && <span className="flex items-center gap-1"><MapPin size={12} /> {ev.location}</span>}
        </div>
      </div>
    </div>
  )
}
