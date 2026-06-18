import { Outlet, Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Menu, X } from 'lucide-react'
import { useState } from 'react'

const publicNav = [
  { label: 'Explore',   path: '/explore' },
  { label: 'News',      path: '/news' },
  { label: 'Events',    path: '/events' },
  { label: 'Spotlight', path: '/spotlight' },
  { label: 'Social',    path: '/social' },
  { label: 'Press',     path: '/press' },
  { label: 'About',     path: '/about' },
]

export default function PublicLayout() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f0f4f8] overflow-x-hidden">

      {/* Navbar */}
      <nav className="sticky top-0 z-20 shadow-sm"
        style={{ background: 'linear-gradient(90deg, #060d1a 0%, #0d1f35 50%, #060d1a 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform duration-200">
              <BookOpen size={15} className="text-[#0d1f35]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wide">AMACOS</p>
              <p className="text-blue-500 text-xs hidden sm:block">Adeleke University</p>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {publicNav.map(item => (
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
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-white p-1.5 rounded-lg hover:bg-white/10 transition">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/5 px-4 py-3 flex flex-col gap-1"
            style={{ background: 'rgba(6,13,26,0.95)', backdropFilter: 'blur(16px)' }}>
            {publicNav.map(item => (
              <NavLink key={item.path} to={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-xl text-sm transition ${
                    isActive ? 'text-amber-300 bg-amber-400/10 font-medium' : 'text-blue-300 hover:text-white hover:bg-white/5'
                  }`
                }>
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 px-6 text-center border-t border-gray-200/60 bg-white/50">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center">
            <BookOpen size={11} className="text-[#0d1f35]" />
          </div>
          <span className="font-bold text-[#1a3c5e] text-sm">AMACOS</span>
        </div>
        <p className="text-gray-400 text-xs mb-3">© 2025 Mass Communication Department, Adeleke University.</p>
        <div className="flex justify-center gap-5 text-xs text-gray-400">
          <Link to="/login"    className="hover:text-[#1a3c5e] transition">Sign In</Link>
          <Link to="/register" className="hover:text-[#1a3c5e] transition">Register</Link>
          <Link to="/about"    className="hover:text-[#1a3c5e] transition">About</Link>
        </div>
      </footer>
    </div>
  )
}
