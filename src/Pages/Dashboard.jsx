import { useAuth } from '../context/AuthContext'
import { BookOpen, Users, FileQuestion, Monitor, Compass, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

const quickLinks = [
  { label: 'Explore',        path: '/app/explore',        icon: Compass,      color: 'bg-purple-50 text-purple-600' },
  { label: 'Resources',      path: '/app/resources',      icon: BookOpen,     color: 'bg-blue-50 text-blue-600' },
  { label: 'Past Questions', path: '/app/past-questions', icon: FileQuestion, color: 'bg-green-50 text-green-600' },
  { label: 'CBT Practice',   path: '/app/cbt',            icon: Monitor,      color: 'bg-amber-50 text-amber-600' },
  { label: 'Forum',          path: '/app/forum',          icon: Users,        color: 'bg-pink-50 text-pink-600' },
  { label: 'Notifications',  path: '/app/notifications',  icon: Bell,         color: 'bg-red-50 text-red-600' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.fullName?.split(' ')[0]
  const levelLabel = user?.isAlumni ? 'Alumni' : user?.level === 'staff' ? 'Staff' : user?.level ? `${user.level}L` : ''

  return (
    <div className="min-w-0">
      {/* Welcome banner */}
      <div className="bg-[#1a3c5e] rounded-2xl p-4 sm:p-6 mb-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/10 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
        <div className="absolute bottom-0 right-12 w-16 h-16 bg-white/5 rounded-full translate-y-6 pointer-events-none" />
        <p className="text-blue-300 text-xs mb-1">Good day 👋</p>
        <h1 className="text-xl sm:text-2xl font-bold mb-1 truncate">
          Welcome, {firstName}!
        </h1>
        <p className="text-blue-200 text-xs capitalize truncate">
          {user?.role}{levelLabel ? ` · ${levelLabel}` : ''} · Mass Communication
        </p>
        {!user?.isTechMember && (
          <Link to="/app/tech"
            className="inline-block mt-3 bg-amber-400 hover:bg-amber-500 text-[#1a3c5e] text-xs font-bold px-4 py-2 rounded-lg transition">
            Join Tech Community →
          </Link>
        )}
      </div>

      {/* Quick links */}
      <h2 className="text-sm font-bold text-[#1a3c5e] mb-3">Quick Access</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {quickLinks.map((item) => (
          <Link key={item.path} to={item.path}
            className="bg-white rounded-2xl p-3 border border-gray-100 hover:shadow-md transition flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
              <item.icon size={16} />
            </div>
            <span className="font-medium text-gray-700 text-xs leading-tight min-w-0 truncate">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Your Level',     value: levelLabel || '—' },
          { label: 'Role',           value: user?.role || '—' },
          { label: 'Tech Community', value: user?.isTechMember ? 'Member ✓' : 'Not joined' },
          { label: 'Account',        value: 'Active ✓' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm min-w-0">
            <p className="text-xs text-gray-400 mb-0.5 truncate">{stat.label}</p>
            <p className="font-bold text-[#1a3c5e] capitalize text-sm truncate">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
