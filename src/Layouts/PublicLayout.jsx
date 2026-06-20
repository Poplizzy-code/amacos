import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Rss, Newspaper, Calendar, Star, Megaphone, Tv2, Info } from 'lucide-react'

const NAV = [
  { label: 'Social',    path: '/social',    icon: Rss },
  { label: 'News',      path: '/news',      icon: Newspaper },
  { label: 'Events',    path: '/events',    icon: Calendar },
  { label: 'Spotlight', path: '/spotlight', icon: Star },
  { label: 'Press',     path: '/press',     icon: Megaphone },
  { label: 'Media',     path: '/media',     icon: Tv2 },
]

export default function PublicLayout() {
  const { user }   = useAuth()
  const location   = useLocation()
  const isFullBleed = location.pathname === '/social' || location.pathname.startsWith('/media')

  return (
    <div className="min-h-screen bg-[#060d1a] overflow-x-hidden flex flex-col">

      {/* ── Mini header — scrolls with page, never fixed ── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/5 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.jpeg" alt="AMACOS" className="w-7 h-7 rounded-xl object-cover shadow-md" />
          <div className="leading-none">
            <p className="text-white font-bold text-sm tracking-wide">AMACOS</p>
            <p className="text-blue-500 text-[10px]">Adeleke University</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/app/dashboard"
              className="bg-amber-400 hover:bg-amber-300 text-[#0d1f35] font-bold text-xs px-3.5 py-2 rounded-xl transition">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login"
                className="text-gray-400 hover:text-white text-xs px-3 py-2 rounded-xl hover:bg-white/5 transition">
                Sign In
              </Link>
              <Link to="/register"
                className="bg-amber-400 hover:bg-amber-300 text-[#0d1f35] font-bold text-xs px-3.5 py-2 rounded-xl transition">
                Join Now
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── Page content ── */}
      <main className={`flex-1 ${isFullBleed ? 'pb-16' : 'max-w-5xl w-full mx-auto px-4 py-5 pb-24'}`}>
        <Outlet />
      </main>

      {/* ── Bottom navigation — fixed, all screen sizes ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10"
        style={{ background: 'rgba(6,13,26,0.97)', backdropFilter: 'blur(24px)' }}>
        <div className="flex items-center justify-around max-w-2xl mx-auto px-1 py-1">
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-2 rounded-2xl transition-all duration-150 flex-1 min-w-0 ${
                  isActive ? 'text-amber-400' : 'text-gray-600 hover:text-gray-300'
                }`
              }>
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-amber-400/10' : ''}`}>
                    <item.icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className="text-[9px] font-semibold tracking-wide truncate leading-none">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        {/* iOS safe area spacer */}
        <div className="h-safe-bottom" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </nav>
    </div>
  )
}
