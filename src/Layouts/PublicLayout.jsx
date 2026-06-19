import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, X, Rss, Newspaper, Calendar, Star, Megaphone, Info } from 'lucide-react'
import { useState, useEffect } from 'react'

const desktopNav = [
  { label: 'Social',    path: '/social' },
  { label: 'News',      path: '/news' },
  { label: 'Events',    path: '/events' },
  { label: 'Spotlight', path: '/spotlight' },
  { label: 'Press',     path: '/press' },
  { label: 'About',     path: '/about' },
]

const mobileNav = [
  { label: 'Social',    path: '/social',    icon: Rss },
  { label: 'News',      path: '/news',      icon: Newspaper },
  { label: 'Events',    path: '/events',    icon: Calendar },
  { label: 'Spotlight', path: '/spotlight', icon: Star },
  { label: 'Press',     path: '/press',     icon: Megaphone },
]

export default function PublicLayout() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Close mobile menu on navigation
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  return (
    <div className="min-h-screen bg-[#060d1a] overflow-x-hidden">

      {/* ── Top Navbar ── */}
      <nav className="sticky top-0 z-20 shadow-sm"
        style={{ background: 'linear-gradient(90deg, #060d1a 0%, #0d1f35 50%, #060d1a 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo.jpeg" alt="AMACOS" className="w-8 h-8 rounded-xl object-cover flex-shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-md" />
            <div>
              <p className="text-white font-bold text-sm tracking-wide">AMACOS</p>
              <p className="text-blue-500 text-xs hidden sm:block">Adeleke University</p>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {desktopNav.map(item => (
              <NavLink key={item.path} to={item.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                    isActive
                      ? 'text-amber-300 bg-amber-400/10 font-medium'
                      : 'text-blue-300 hover:text-white hover:bg-white/10'
                  }`
                }>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/app/dashboard"
                className="bg-amber-400 hover:bg-amber-300 text-[#0d1f35] font-semibold text-sm px-4 py-2 rounded-xl transition shadow-md shadow-amber-500/20">
                My Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login"
                  className="text-blue-300 hover:text-white text-sm transition px-3 py-2 rounded-lg hover:bg-white/5 hidden sm:block">
                  Sign In
                </Link>
                <Link to="/register"
                  className="bg-amber-400 hover:bg-amber-300 text-[#0d1f35] font-semibold text-sm px-4 py-2 rounded-xl transition shadow-md shadow-amber-500/20">
                  Join Now
                </Link>
              </>
            )}
            {/* Mobile hamburger — only shows remaining links (About etc.) */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-white p-1.5 rounded-lg hover:bg-white/10 transition">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown (about + sign in) */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/5 px-4 py-3 flex flex-col gap-1"
            style={{ background: 'rgba(6,13,26,0.97)', backdropFilter: 'blur(16px)' }}>
            <NavLink to="/about" onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-sm transition flex items-center gap-2 ${
                  isActive ? 'text-amber-300 bg-amber-400/10 font-medium' : 'text-blue-300 hover:text-white hover:bg-white/5'
                }`}>
              <Info size={15} /> About
            </NavLink>
            {!user && (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm text-blue-300 hover:text-white hover:bg-white/5 transition">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 font-medium transition">
                  Join AMACOS
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Content — social feed handles its own layout; other pages get a container */}
      <main className={location.pathname === '/social'
        ? 'pb-20 md:pb-0'
        : 'max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-10'
      }>
        <Outlet />
      </main>

      {/* ── Desktop Footer ── */}
      <footer className="hidden md:block mt-16 py-8 px-6 text-center border-t border-white/5">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src="/logo.jpeg" alt="AMACOS" className="w-6 h-6 rounded-lg object-cover" />
          <span className="font-bold text-white text-sm">AMACOS</span>
        </div>
        <p className="text-gray-600 text-xs mb-3">Mass Communication Department, Adeleke University</p>
        <div className="flex justify-center gap-5 text-xs text-gray-600">
          <Link to="/login"    className="hover:text-white transition">Sign In</Link>
          <Link to="/register" className="hover:text-white transition">Register</Link>
          <Link to="/about"    className="hover:text-white transition">About</Link>
        </div>
      </footer>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-white/5"
        style={{ background: 'rgba(6,13,26,0.97)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-around px-2 py-1.5 safe-bottom">
          {mobileNav.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 min-w-0 flex-1 ${
                  isActive
                    ? 'text-amber-400'
                    : 'text-gray-600 hover:text-gray-300'
                }`
              }>
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-amber-400/10' : ''}`}>
                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className={`text-[10px] font-medium truncate ${isActive ? 'font-bold' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
