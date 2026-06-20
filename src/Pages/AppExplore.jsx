import { useState } from 'react'
import { Rss, Newspaper, Calendar, Star, Megaphone, Tv2 } from 'lucide-react'
import SocialFeed from './SocialFeed'
import NewsFeed from './NewsFeed'
import Events from './Events'
import FinalYearSpotlight from './FinalYearSpotlight'
import PressRelease from './PressRelease'
import MediaHub from './MediaHub'

const TABS = [
  { id: 'feed',      label: 'Feed',       icon: Rss },
  { id: 'news',      label: 'News',       icon: Newspaper },
  { id: 'events',    label: 'Events',     icon: Calendar },
  { id: 'spotlight', label: 'Spotlight',  icon: Star },
  { id: 'press',     label: 'Press',      icon: Megaphone },
  { id: 'media',     label: 'Media',      icon: Tv2 },
]

const TAB_H = 'top-[45px]'

export default function AppExplore() {
  const [active, setActive] = useState('feed')

  return (
    <div className="relative -m-4 lg:-m-6 min-h-full bg-[#060d1a]">

      {/* Sticky tab bar */}
      <div className="sticky top-0 z-30 bg-[#060d1a] border-b border-white/10">
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                active === tab.id
                  ? 'text-amber-400 border-amber-400'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {active === 'feed'   && <SocialFeed topOffset={TAB_H} />}
      {active === 'media'  && <MediaHub isApp />}

      {active !== 'feed' && active !== 'media' && (
        <div className="max-w-2xl mx-auto px-4 pb-10">
          {active === 'news'      && <NewsFeed />}
          {active === 'events'    && <Events />}
          {active === 'spotlight' && <FinalYearSpotlight />}
          {active === 'press'     && <PressRelease />}
        </div>
      )}
    </div>
  )
}
