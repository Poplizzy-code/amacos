import { useState } from 'react'
import { Rss, Newspaper, Calendar, Star, Megaphone, Tv2 } from 'lucide-react'
import SocialFeed from './SocialFeed'
import NewsFeed from './NewsFeed'
import Events from './Events'
import FinalYearSpotlight from './FinalYearSpotlight'
import PressRelease from './PressRelease'
import MediaHub from './MediaHub'

const TABS = [
  { id: 'feed',      label: 'Feed',      icon: Rss },
  { id: 'news',      label: 'News',      icon: Newspaper },
  { id: 'events',    label: 'Events',    icon: Calendar },
  { id: 'spotlight', label: 'Spotlight', icon: Star },
  { id: 'press',     label: 'Press',     icon: Megaphone },
  { id: 'media',     label: 'Media',     icon: Tv2 },
]

export default function AppExplore() {
  const [active, setActive] = useState('feed')

  return (
    <div className="relative -m-4 lg:-m-6 bg-[#060d1a]" style={{ minHeight: 'calc(100% + 0px)', paddingBottom: '64px' }}>

      {/* Content — no top bar */}
      {active === 'feed'  && <SocialFeed topOffset="top-0" hideHeader />}
      {active === 'media' && <MediaHub isApp />}

      {active !== 'feed' && active !== 'media' && (
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-4">
          {active === 'news'      && <NewsFeed />}
          {active === 'events'    && <Events />}
          {active === 'spotlight' && <FinalYearSpotlight />}
          {active === 'press'     && <PressRelease />}
        </div>
      )}

      {/* ── Bottom tab bar — fixed, compact ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10"
        style={{ background: 'rgba(6,13,26,0.97)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-around max-w-2xl mx-auto px-1 py-1 lg:max-w-screen-xl">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex flex-col items-center gap-0.5 flex-1 py-2 px-1 rounded-2xl transition-all duration-150 ${
                active === tab.id ? 'text-amber-400' : 'text-gray-600 hover:text-gray-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active === tab.id ? 'bg-amber-400/10' : ''}`}>
                <tab.icon size={17} strokeWidth={active === tab.id ? 2.5 : 1.8} />
              </div>
              <span className="text-[9px] font-semibold tracking-wide leading-none truncate">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>
    </div>
  )
}
