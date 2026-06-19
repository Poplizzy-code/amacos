import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, BookMarked, Newspaper, Users, ArrowRight, GraduationCap,
  MessageSquare, Monitor, Code2, Calendar, Heart, Globe,
  Sparkles, ChevronLeft, ChevronRight, Megaphone, Star,
  FileQuestion, Rss, ClipboardList,
} from 'lucide-react'

// ── Slide Graphics ─────────────────────────────────────────────────────────────

function WelcomeGraphic() {
  const orbitItems = [
    { Icon: BookOpen,      bg: '#3b82f6', deg: 0 },
    { Icon: Monitor,       bg: '#22c55e', deg: 60 },
    { Icon: Users,         bg: '#a855f7', deg: 120 },
    { Icon: Newspaper,     bg: '#f59e0b', deg: 180 },
    { Icon: Code2,         bg: '#06b6d4', deg: 240 },
    { Icon: GraduationCap, bg: '#ec4899', deg: 300 },
  ]
  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      <div className="absolute inset-0 rounded-full border border-amber-400/20 animate-spin-slow" />
      <div className="absolute rounded-full border border-white/5" style={{ inset: 28 }} />
      <div className="w-24 h-24 rounded-full overflow-hidden shadow-2xl z-10"
        style={{ boxShadow: '0 0 60px rgba(251,191,36,0.4)' }}>
        <img src="/logo.jpeg" alt="AMACOS" className="w-full h-full object-cover" />
      </div>
      {orbitItems.map(({ Icon, bg, deg }) => (
        <div key={deg}
          className="absolute rounded-xl flex items-center justify-center shadow-lg"
          style={{
            width: 40, height: 40, background: bg,
            top: '50%', left: '50%',
            marginTop: -20, marginLeft: -20,
            transform: `rotate(${deg}deg) translate(110px) rotate(-${deg}deg)`,
          }}>
          <Icon size={16} color="#fff" />
        </div>
      ))}
    </div>
  )
}

function StudyGraphic() {
  return (
    <div className="relative" style={{ width: 260, height: 240 }}>
      <div className="absolute rounded-2xl border border-white/10"
        style={{ width: 200, height: 128, top: 8, left: 28, transform: 'rotate(-8deg)', background: 'rgba(255,255,255,0.04)' }}>
        <div className="p-4 space-y-2.5">
          <div className="h-2.5 rounded bg-white/10 w-3/4" />
          <div className="h-2.5 rounded bg-white/10 w-1/2" />
          <div className="h-2.5 rounded bg-white/10 w-2/3" />
        </div>
      </div>
      <div className="absolute rounded-2xl border border-white/15 shadow-lg"
        style={{ width: 200, height: 128, top: 50, left: 8, transform: 'rotate(-3deg)', background: 'rgba(255,255,255,0.07)' }}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Monitor size={13} color="#4ade80" />
            <span className="text-white/60 text-xs">CBT Practice</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(74,222,128,0.15)' }}>
            <div className="h-full rounded-full bg-green-400" style={{ width: '68%' }} />
          </div>
          <span className="text-green-400 text-xs mt-2 block">68% complete</span>
        </div>
      </div>
      <div className="absolute rounded-2xl shadow-xl border border-blue-400/20"
        style={{ width: 200, height: 128, top: 100, left: 28, background: 'linear-gradient(135deg,#1a3c5e,#2563a8)' }}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileQuestion size={13} color="#fbbf24" />
            <span className="text-white text-xs font-semibold">Past Questions</span>
          </div>
          <div className="space-y-2">
            {['COM 201 — 2023', 'MCS 305 — 2022', 'JLS 102 — 2023'].map(c => (
              <div key={c} className="h-2 rounded bg-white/15" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CommunityGraphic() {
  return (
    <div className="relative" style={{ width: 260, height: 240 }}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <line x1="130" y1="48" x2="60"  y2="155" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
        <line x1="130" y1="48" x2="200" y2="155" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
        <line x1="60"  y1="155" x2="200" y2="155" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
      </svg>
      {[
        { i: 'A', grad: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', top: 8,   left: 98 },
        { i: 'B', grad: 'linear-gradient(135deg,#a855f7,#7c3aed)', top: 118, left: 24 },
        { i: 'C', grad: 'linear-gradient(135deg,#ec4899,#be185d)', top: 118, left: 172 },
      ].map(({ i, grad, top, left }) => (
        <div key={i}
          className="absolute w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-xl border-2 border-white/10"
          style={{ background: grad, top, left }}>
          {i}
        </div>
      ))}
      <div className="absolute rounded-xl px-3 py-2 border border-white/15 shadow-lg"
        style={{ top: 60, left: 160, background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-1.5 rounded bg-white/25 w-20 mb-1.5" />
        <div className="h-1.5 rounded bg-white/15 w-14" />
      </div>
      <div className="absolute flex items-center gap-1.5 rounded-full px-3 py-1.5 border border-red-400/20"
        style={{ bottom: 12, left: 88, background: 'rgba(239,68,68,0.15)' }}>
        <Heart size={11} className="fill-red-400 text-red-400" />
        <span className="text-red-400 text-xs font-medium">24 likes</span>
      </div>
    </div>
  )
}

function NewsGraphic() {
  return (
    <div className="relative" style={{ width: 260, height: 240 }}>
      <div className="absolute rounded-2xl border border-white/10 overflow-hidden"
        style={{ width: 190, height: 168, top: 0, left: 0, background: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10" style={{ background: 'rgba(26,60,94,0.6)' }}>
          <Newspaper size={11} color="#fbbf24" />
          <div className="h-2 rounded bg-amber-400/30 w-20" />
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          <div className="col-span-2 h-14 rounded-lg bg-white/5 mb-1" />
          <div className="space-y-1.5">{[1,2,3].map(i=><div key={i} className="h-1.5 rounded bg-white/10"/>)}</div>
          <div className="space-y-1.5">{[1,2,3].map(i=><div key={i} className="h-1.5 rounded bg-white/10"/>)}</div>
        </div>
      </div>
      <div className="absolute rounded-2xl shadow-xl border border-blue-400/20 overflow-hidden"
        style={{ width: 130, height: 108, bottom: 8, right: 0, background: 'linear-gradient(135deg,#1a3c5e,#2563a8)' }}>
        <div className="py-1.5 text-center bg-amber-400">
          <span className="text-[#0d1f35] text-xs font-bold">JUNE 2025</span>
        </div>
        <div className="p-2 grid grid-cols-4 gap-1">
          {[5,12,18,23,27,30].map((d,i)=>(
            <div key={d} className={`h-6 rounded text-xs flex items-center justify-center ${i===5?'bg-amber-400 text-[#0d1f35] font-bold':'bg-white/10 text-white/70'}`}>{d}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ExploreGraphic() {
  return (
    <div className="flex items-center justify-center" style={{ width: 260, height: 240 }}>
      <div className="relative flex items-center justify-center w-44 h-44">
        <div className="absolute inset-0 rounded-full border-2 border-amber-400/30" />
        <div className="absolute rounded-full border border-amber-400/15" style={{ inset: 18 }} />
        <Globe size={64} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 24px rgba(251,191,36,0.5))' }} />
        {[0,72,144,216,288].map(deg => (
          <div key={deg}
            className="absolute rounded-full shadow-lg"
            style={{
              width: 10, height: 10,
              background: 'rgba(251,191,36,0.7)',
              boxShadow: '0 0 8px rgba(251,191,36,0.4)',
              top: '50%', left: '50%',
              marginTop: -5, marginLeft: -5,
              transform: `rotate(${deg}deg) translate(80px) rotate(-${deg}deg)`,
            }} />
        ))}
      </div>
    </div>
  )
}

// ── Slide definitions ──────────────────────────────────────────────────────────
// enterFrom: direction the TEXT enters from. Graphic enters from the opposite.

const slides = [
  {
    enterFrom: 'Left',
    Graphic: WelcomeGraphic,
    tag: 'Mass Communication Dept · Adeleke University',
    line1: 'Welcome to',
    line2: 'AMACOS',
    amber: true,
    sub: 'Your all-in-one academic hub — resources, CBT, news, community and more, built for Mass Comm students.',
    features: null,
    isCta: false,
  },
  {
    enterFrom: 'Top',
    Graphic: StudyGraphic,
    tag: 'Study & Learn',
    line1: 'Study Smarter,',
    line2: 'Not Harder',
    amber: false,
    sub: 'Access past questions, practice CBT, download course resources — everything to help you ace your exams.',
    features: [
      { Icon: BookOpen,      label: 'Course Resources' },
      { Icon: FileQuestion,  label: 'Past Questions' },
      { Icon: Monitor,       label: 'CBT Practice' },
      { Icon: ClipboardList, label: 'Assignments' },
    ],
    isCta: false,
  },
  {
    enterFrom: 'Right',
    Graphic: CommunityGraphic,
    tag: 'Community',
    line1: 'A Community That',
    line2: 'Has Your Back',
    amber: false,
    sub: 'Share ideas, get support, and build lasting connections with fellow students, staff and alumni.',
    features: [
      { Icon: MessageSquare, label: "Let's Talk Forum" },
      { Icon: Rss,           label: 'Social Feed' },
      { Icon: Users,         label: 'Alumni Network' },
      { Icon: Code2,         label: 'Tech Community' },
    ],
    isCta: false,
  },
  {
    enterFrom: 'Bottom',
    Graphic: NewsGraphic,
    tag: 'Stay Informed',
    line1: 'Never Miss',
    line2: 'What Matters',
    amber: false,
    sub: 'Department news, press releases, upcoming events and final year spotlights — live and always up to date.',
    features: [
      { Icon: Newspaper, label: 'News Feed' },
      { Icon: Calendar,  label: 'Events' },
      { Icon: Megaphone, label: 'Press Releases' },
      { Icon: Star,      label: 'Spotlight' },
    ],
    isCta: false,
  },
  {
    enterFrom: 'Left',
    Graphic: ExploreGraphic,
    tag: 'Get Started',
    line1: 'Ready to',
    line2: 'Explore?',
    amber: true,
    sub: "Browse news, community posts, events and more — no account needed to look around.",
    features: null,
    isCta: true,
  },
]

const opposite = { Left: 'Right', Right: 'Left', Top: 'Bottom', Bottom: 'Top' }

// ── Main ───────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [current, setCurrent] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const total = slides.length

  const goTo = (idx) => {
    setCurrent(idx)
    setAnimKey(k => k + 1)
  }

  useEffect(() => {
    if (current === total - 1) return
    const t = setInterval(() => {
      setCurrent(c => (c + 1) % total)
      setAnimKey(k => k + 1)
    }, 6000)
    return () => clearInterval(t)
  }, [current, total])

  const prev = () => goTo((current - 1 + total) % total)
  const next = () => goTo((current + 1) % total)

  return (
    <div className="h-screen flex flex-col bg-[#060d1a] overflow-hidden">

      {/* CSS keyframes for directional slide animations */}
      <style>{`
        @keyframes slideFromLeft {
          0%   { opacity: 0; transform: translateX(-90px) scale(0.96); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes slideFromRight {
          0%   { opacity: 0; transform: translateX(90px) scale(0.96); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes slideFromTop {
          0%   { opacity: 0; transform: translateY(-90px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideFromBottom {
          0%   { opacity: 0; transform: translateY(90px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes itemReveal {
          0%   { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.5); }
          50%       { box-shadow: 0 0 0 6px rgba(251,191,36,0); }
        }
      `}</style>

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none select-none z-0">
        <div className="absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full opacity-30 animate-spin-slow"
          style={{ background: 'conic-gradient(from 0deg,transparent 0%,rgba(37,99,168,0.4) 30%,transparent 60%)', filter: 'blur(60px)' }} />
        <div className="absolute top-1/2 -left-32 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle,rgba(251,191,36,0.09) 0%,transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex-shrink-0 px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="AMACOS" className="w-9 h-9 rounded-xl object-cover flex-shrink-0 shadow-lg" />
          <div>
            <p className="text-white font-bold text-sm tracking-wide">AMACOS</p>
            <p className="text-blue-400 text-xs hidden sm:block">Adeleke University</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login"
            className="text-blue-300 hover:text-white text-sm transition px-4 py-2 rounded-lg hover:bg-white/5">
            Sign In
          </Link>
          <Link to="/register"
            className="bg-amber-400 hover:bg-amber-300 text-[#0d1f35] font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20">
            Join Now
          </Link>
        </div>
      </nav>

      {/* Slides viewport — absolute stacked */}
      <div className="relative z-10 flex-1 overflow-hidden">
        {slides.map(({ enterFrom, Graphic, tag, line1, line2, amber, sub, features, isCta }, i) => {
          const isActive = i === current
          const textAnim  = `slideFrom${enterFrom} 0.75s cubic-bezier(0.16, 1, 0.3, 1) both`
          const graphAnim = `slideFrom${opposite[enterFrom]} 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both`

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 24px',
                opacity: isActive ? 1 : 0,
                pointerEvents: isActive ? 'auto' : 'none',
                transition: 'opacity 0.35s ease',
              }}
            >
              {isActive && (
                <div className={`w-full max-w-5xl flex flex-col gap-8 items-center ${isCta ? '' : 'lg:flex-row lg:gap-16'}`}>

                  {/* Text block */}
                  <div
                    key={`text-${animKey}`}
                    className={`flex-1 text-center ${isCta ? '' : 'lg:text-left'} min-w-0`}
                    style={{ animation: textAnim }}
                  >
                    <div
                      className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full mb-5"
                      style={{ animation: 'itemReveal 0.5s ease 0.1s both' }}
                    >
                      <Sparkles size={11} className="text-amber-400" />
                      <span className="text-blue-200 text-xs font-medium">{tag}</span>
                      <Sparkles size={11} className="text-amber-400" />
                    </div>

                    <h1
                      className="font-display font-black text-white leading-[1.05] tracking-tight mb-4 text-4xl sm:text-5xl lg:text-6xl"
                      style={{ animation: 'itemReveal 0.5s ease 0.2s both' }}
                    >
                      {line1}<br />
                      <span className={amber ? 'text-gradient-amber' : 'text-white'}>{line2}</span>
                    </h1>

                    <p
                      className="text-blue-300 text-base lg:text-lg leading-relaxed mb-6 max-w-md mx-auto lg:mx-0"
                      style={{ animation: 'itemReveal 0.5s ease 0.3s both' }}
                    >
                      {sub}
                    </p>

                    {features && (
                      <div
                        className="flex flex-wrap gap-2 justify-center lg:justify-start"
                        style={{ animation: 'itemReveal 0.5s ease 0.4s both' }}
                      >
                        {features.map(({ Icon, label }) => (
                          <span key={label}
                            className="inline-flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-xs text-blue-200 font-medium">
                            <Icon size={11} className="text-amber-400" /> {label}
                          </span>
                        ))}
                      </div>
                    )}

                    {isCta && (
                      <>
                        <style>{`
                          @keyframes ctaPop {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.07); }
                          }
                          .cta-pop { animation: ctaPop 1.8s ease-in-out infinite; }
                          .cta-pop:hover { animation: none; transform: scale(1.04); }
                        `}</style>
                        <div
                          className="flex flex-col sm:flex-row gap-3 justify-center mt-2"
                          style={{ animation: 'itemReveal 0.5s ease 0.4s both' }}
                        >
                          <Link to="/social"
                            className="cta-pop inline-flex items-center justify-center gap-2 bg-white text-[#0d1f35] font-bold px-8 py-4 rounded-2xl shadow-xl text-base"
                            style={{ animationDelay: '0s' }}>
                            <Globe size={18} /> Explore Now
                          </Link>
                          <Link to="/register"
                            className="cta-pop inline-flex items-center justify-center gap-2 bg-amber-400 text-[#0d1f35] font-bold px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/25 text-base"
                            style={{ animationDelay: '0.9s' }}>
                            Join AMACOS <ArrowRight size={18} />
                          </Link>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Graphic — desktop only */}
                  {!isCta && (
                    <div
                      key={`graphic-${animKey}`}
                      className="hidden lg:flex flex-shrink-0 items-center justify-center"
                      style={{ animation: graphAnim }}
                    >
                      <Graphic />
                    </div>
                  )}

                  {isCta && (
                    <div
                      key={`graphic-cta-${animKey}`}
                      className="hidden lg:flex flex-shrink-0 items-center justify-center"
                      style={{ animation: textAnim }}
                    >
                      <Graphic />
                    </div>
                  )}

                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Slide controls */}
      <div className="relative z-20 flex-shrink-0 flex items-center justify-center gap-4 py-5 border-t border-white/5">
        <button onClick={prev}
          className="text-blue-500 hover:text-white transition p-2 rounded-xl hover:bg-white/5">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? '28px' : '8px',
                height: '8px',
                background: i === current ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                animation: i === current ? 'dotPulse 2s ease-in-out infinite' : 'none',
              }} />
          ))}
        </div>
        <button onClick={next}
          className="text-blue-500 hover:text-white transition p-2 rounded-xl hover:bg-white/5">
          <ChevronRight size={20} />
        </button>
        <span className="absolute right-6 text-blue-600 text-xs tabular-nums">
          {current + 1} / {total}
        </span>
      </div>

    </div>
  )
}
