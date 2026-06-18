import { useAuth } from '../context/AuthContext'
import { BookOpen, Users, FileQuestion, Monitor, Rss, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

const quickLinks = [
  { label: 'Resources', path: '/app/resources', icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
  { label: 'Past Questions', path: '/app/past-questions', icon: FileQuestion, color: 'bg-green-50 text-green-600' },
  { label: 'Social Feed', path: '/app/feed', icon: Rss, color: 'bg-purple-50 text-purple-600' },
  { label: 'CBT Practice', path: '/app/cbt', icon: Monitor, color: 'bg-amber-50 text-amber-600' },
  { label: 'Forum', path: '/app/forum', icon: Users, color: 'bg-pink-50 text-pink-600' },
  { label: 'Notifications', path: '/app/notifications', icon: Bell, color: 'bg-red-50 text-red-600' },
]

export default function Dashboard() {
  const { user } = useAuth()
  return (
    <div>
      {/* Welcome banner */}
      <div className="bg-[#1a3c5e] rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 right-16 w-20 h-20 bg-white/5 rounded-full translate-y-8"></div>
        <p className="text-blue-300 text-sm mb-1">Good day 👋</p>
        <h1 className="text-2xl font-display font-bold mb-1">
          Welcome back, {user?.fullName?.split(' ')[0]}!
        </h1>
        <p className="text-blue-200 text-sm capitalize">{user?.role}{user?.level && user.level !== 'staff' ? ` • ${user.level}L` : ''} • Mass Communication</p>
        {!user?.isTechMember && (
          <Link to="/app/tech"
            className="inline-block mt-4 bg-amber-400 hover:bg-amber-500 text-[#1a3c5e] text-xs font-bold px-4 py-2 rounded-lg transition">
            Join Tech Community →
          </Link>
        )}
      </div>

      {/* Quick links */}
      <h2 className="text-lg font-display font-bold text-[#1a3c5e] mb-4">Quick Access</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {quickLinks.map((item) => (
          <Link key={item.path} to={item.path}
            className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
              <item.icon size={18} />
            </div>
            <span className="font-medium text-gray-700 text-sm leading-tight min-w-0">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Your Level', value: user?.level === 'staff' ? 'Staff' : user?.level + 'L' },
          { label: 'Role', value: user?.role },
          { label: 'Tech Community', value: user?.isTechMember ? 'Member ✓' : 'Not joined' },
          { label: 'Account', value: 'Active ✓' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="font-bold text-[#1a3c5e] capitalize text-sm">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}