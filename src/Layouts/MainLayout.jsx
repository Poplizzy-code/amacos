import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, BookOpen, FileQuestion, MessageSquare,
  Monitor, Code2, Rss, Newspaper, Star, Megaphone,
  FlaskConical, Calendar, Users, Mail, Bell, Shield,
  Info, LogOut, Menu, X, BookMarked, ClipboardList,
  GraduationCap, ChevronRight, Settings, ArrowLeft,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',            path: '/app/dashboard',      icon: LayoutDashboard },
  { label: 'Social Feed',          path: '/app/feed',           icon: Rss },
  { label: 'News Feed',            path: '/app/news',           icon: Newspaper },
  { label: 'Resources',            path: '/app/resources',      icon: BookOpen },
  { label: 'Past Questions',       path: '/app/past-questions', icon: FileQuestion },
  { label: 'Assignments',          path: '/app/assignments',    icon: ClipboardList },
  { label: "Let's Talk",           path: '/app/forum',          icon: MessageSquare },
  { label: 'CBT',                  path: '/app/cbt',            icon: Monitor },
  { label: 'Final Year Spotlight', path: '/app/spotlight',      icon: Star },
  { label: 'Press Release',        path: '/app/press',          icon: Megaphone },
  { label: 'Research & Opps',      path: '/app/research',       icon: FlaskConical },
  { label: 'Events',               path: '/app/events',         icon: Calendar },
  { label: 'Alumni Network',       path: '/app/alumni',         icon: Users },
  { label: 'Messages',             path: '/app/messages',       icon: Mail },
  { label: 'Notifications',        path: '/app/notifications',  icon: Bell },
  { label: 'Tech Community',       path: '/app/tech',           icon: Code2,         techOnly: true },
  { label: 'Staff Panel',          path: '/app/staff-panel',    icon: GraduationCap, staffOnly: true },
  { label: 'Admin',                path: '/app/admin',          icon: Shield,        staffAdminOnly: true },
  { label: 'Settings',             path: '/app/settings',       icon: Settings },
  { label: 'About',                path: '/about',              icon: Info },
]

export default function MainLayout() {
  const { user, logout } = useAuth()
  const { notifCount, resetNotifCount } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isDashboard = location.pathname === '/app/dashboard'

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully.')
    navigate('/login')
  }

  const filteredNav = navItems.filter(item => {
    if (item.staffOnly && user?.accountType !== 'staff') return false
    if (item.staffAdminOnly && !user?.isStaffAdmin)      return false
    if (item.techOnly && !user?.isTechMember)             return false
    return true
  })

  const initial = user?.fullName?.charAt(0).toUpperCase()
  const firstName = user?.fullName?.split(' ')[0]

  return (
    <div className="flex h-screen bg-[#f0f4f8] overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-30 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `} style={{ background: 'linear-gradient(180deg, #060d1a 0%, #0d1f35 50%, #0a1a2e 100%)' }}>

        {/* Subtle side glow */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
              <BookMarked size={16} className="text-[#0d1f35]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wide">AMACOS</p>
              <p className="text-blue-500 text-xs">Adeleke University</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white transition p-1">
            <X size={18} />
          </button>
        </div>

        {/* User card */}
        <div className="mx-3 my-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-[#0d1f35] font-bold text-sm flex-shrink-0 shadow-lg shadow-amber-500/20">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.fullName}</p>
              <p className="text-blue-400 text-xs capitalize">
                {user?.accountType === 'staff'
                  ? [user.isStaffAdmin && 'Staff Admin', user.isLecturer && 'Lecturer'].filter(Boolean).join(' · ') || 'Staff'
                  : user?.isStudentAdmin ? 'Student Admin' : `Student${user?.level && user.level !== 'staff' ? ` · ${user.level}L` : ''}`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {filteredNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group relative
                ${isActive
                  ? 'bg-amber-400/10 text-amber-300 font-semibold'
                  : 'text-blue-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-full" />
                  )}
                  <item.icon size={16} className={isActive ? 'text-amber-400' : 'text-blue-500 group-hover:text-white transition-colors'} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && <ChevronRight size={14} className="text-amber-400/60 flex-shrink-0" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 py-3 border-t border-white/5">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-blue-400 hover:bg-red-500/10 hover:text-red-400 transition w-full group">
            <LogOut size={16} className="group-hover:text-red-400 transition-colors" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-gradient-to-r from-white/70 via-slate-50/70 to-white/70 backdrop-blur-xl border-b border-gray-200/70 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-1 lg:hidden">
            <button onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
              <Menu size={20} />
            </button>
            {!isDashboard && (
              <button onClick={() => navigate(-1)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
                <ArrowLeft size={20} />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-sm">
            <span className="font-bold text-[#1a3c5e]">AMACOS</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-400">Mass Communication Department</span>
          </div>

          <div className="flex items-center gap-3">
            <NavLink to="/app/notifications"
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 relative transition"
              onClick={() => resetNotifCount()}>
              <Bell size={18} />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-sm">
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </NavLink>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {initial}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-700">{firstName}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
