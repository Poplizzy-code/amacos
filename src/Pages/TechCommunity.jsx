import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import {
  Code2, Users, MessageSquare, Loader2, Zap, Globe,
  BookOpen, Terminal, Cpu, Wifi, Lock, ChevronRight,
} from 'lucide-react'

const PERKS = [
  { icon: Terminal, title: 'Dev Discussions', desc: 'Dedicated tech threads in the forum — share code, ask for help, review projects.' },
  { icon: Users,    title: 'Member Directory', desc: 'Connect with other tech enthusiasts across all levels in your department.' },
  { icon: Globe,    title: 'Group Chat',       desc: 'Join the Tech Community group and collaborate in real time.' },
  { icon: BookOpen, title: 'Tech Resources',   desc: 'Access curated tech learning materials, tutorials, and links.' },
  { icon: Cpu,      title: 'Project Showcase', desc: 'Show off your projects and get feedback from peers.' },
  { icon: Wifi,     title: 'Stay Connected',   desc: 'Get notified about tech events, hackathons, and study sessions.' },
]

function MemberCard({ member }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition">
      {member.avatar ? (
        <img src={member.avatar} alt={member.fullName} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
          {member.fullName?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{member.fullName}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {member.accountType === 'staff' ? 'Staff' : `${member.level}L Student`}
        </p>
        {member.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{member.bio}</p>}
      </div>
      <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="Tech Member" />
    </div>
  )
}

function JoinView({ onJoin, joining }) {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#060d1a] via-[#0d1f35] to-[#1a3c5e] rounded-3xl p-8 overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 rounded-full -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/5 rounded-full translate-y-16 -translate-x-16" />
        <div className="relative z-10">
          <div className="w-14 h-14 bg-cyan-400/10 border border-cyan-400/20 rounded-2xl flex items-center justify-center mb-4">
            <Code2 size={28} className="text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Tech Community</h1>
          <p className="text-blue-300 text-sm leading-relaxed max-w-md">
            A space for Mass Communication students who love technology — from web development
            and design to data, media tech, and digital storytelling. Join the community and connect
            with like-minded peers.
          </p>
          <button
            onClick={onJoin}
            disabled={joining}
            className="mt-5 flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-[#060d1a] font-bold text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-cyan-400/20 disabled:opacity-60"
          >
            {joining ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {joining ? 'Joining...' : 'Join Tech Community'}
          </button>
        </div>
      </div>

      {/* Perks grid */}
      <div>
        <h2 className="text-lg font-bold text-[#1a3c5e] mb-4">What you get</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERKS.map(p => (
            <div key={p.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="w-9 h-9 bg-cyan-50 rounded-xl flex items-center justify-center mb-3">
                <p.icon size={17} className="text-cyan-600" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{p.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MemberView({ user, members, loadingMembers }) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('members')

  const filtered = members.filter(m =>
    m.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    m.bio?.toLowerCase().includes(search.toLowerCase())
  )

  const students = filtered.filter(m => m.accountType !== 'staff')
  const staff    = filtered.filter(m => m.accountType === 'staff')

  return (
    <div className="space-y-5">
      {/* Header banner */}
      <div className="relative bg-gradient-to-br from-[#060d1a] via-[#0d1f35] to-[#1a3c5e] rounded-3xl px-6 py-5 overflow-hidden text-white flex items-center gap-4">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-400/5 rounded-full -translate-y-12 translate-x-12" />
        <div className="w-12 h-12 bg-cyan-400/10 border border-cyan-400/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Code2 size={24} className="text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Tech Community</h1>
          <p className="text-blue-300 text-xs mt-0.5">
            {members.length} member{members.length !== 1 ? 's' : ''} · You're in!
          </p>
        </div>
        <div className="bg-cyan-400/10 border border-cyan-400/20 rounded-xl px-3 py-1.5 flex-shrink-0">
          <span className="text-cyan-400 text-xs font-bold flex items-center gap-1">
            <Zap size={12} /> Member
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm w-fit">
        {[
          { id: 'members', label: 'Members', icon: Users },
          { id: 'forum',   label: 'Tech Forum', icon: MessageSquare },
          { id: 'groups',  label: 'Group Chat', icon: Wifi },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-[#1a3c5e] text-white shadow-sm'
                : 'text-gray-500 hover:text-[#1a3c5e] hover:bg-gray-50'
            }`}
          >
            <t.icon size={14} className="flex-shrink-0" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'members' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="font-bold text-[#1a3c5e] flex-1">
              Members <span className="text-gray-400 font-normal text-sm">({members.length})</span>
            </h2>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members..."
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] w-full sm:w-52"
            />
          </div>

          {loadingMembers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#1a3c5e]" />
            </div>
          ) : (
            <>
              {staff.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Staff</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {staff.map(m => <MemberCard key={m._id} member={m} />)}
                  </div>
                </div>
              )}
              {students.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Students</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {students.map(m => <MemberCard key={m._id} member={m} />)}
                  </div>
                </div>
              )}
              {filtered.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <Users size={28} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400 text-sm">No members found.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'forum' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-[#1a3c5e] mb-1">Tech Discussions</h2>
            <p className="text-sm text-gray-500 mb-4">
              Browse and post in the Tech category of the community forum.
            </p>
            <Link
              to="/app/forum"
              className="inline-flex items-center gap-2 bg-[#1a3c5e] hover:bg-[#162f4a] text-white text-sm px-5 py-2.5 rounded-xl font-medium transition"
            >
              <MessageSquare size={15} /> Open Forum <ChevronRight size={14} />
            </Link>
          </div>
          <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4">
            <p className="text-xs text-cyan-700">
              <span className="font-semibold">Tip:</span> Filter by the <span className="font-bold">Tech</span> category
              in the forum to see only tech-related threads. You can start a new thread to ask questions,
              share projects, or discuss tools.
            </p>
          </div>
        </div>
      )}

      {tab === 'groups' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-[#1a3c5e] mb-1">Group Chats</h2>
            <p className="text-sm text-gray-500 mb-4">
              Create or join a tech group chat to collaborate with other members in real time.
            </p>
            <Link
              to="/app/groups"
              className="inline-flex items-center gap-2 bg-[#1a3c5e] hover:bg-[#162f4a] text-white text-sm px-5 py-2.5 rounded-xl font-medium transition"
            >
              <Users size={15} /> Open Groups <ChevronRight size={14} />
            </Link>
          </div>
          <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4">
            <p className="text-xs text-cyan-700">
              <span className="font-semibold">Tip:</span> Go to Groups and create a group named
              <span className="font-bold"> "Tech Community"</span> — add other tech members so you can all
              chat, share links, and coordinate projects in one place.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TechCommunity() {
  const { user, setUser } = useAuth()
  const [joining, setJoining] = useState(false)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const isMember = user?.isTechMember

  useEffect(() => {
    if (!isMember) return
    setLoadingMembers(true)
    axios.get('/api/users/tech-members', { withCredentials: true })
      .then(res => setMembers(res.data.users || []))
      .catch(() => toast.error('Failed to load members.'))
      .finally(() => setLoadingMembers(false))
  }, [isMember])

  const join = async () => {
    setJoining(true)
    try {
      const { data } = await axios.put('/api/users/join-tech', {}, { withCredentials: true })
      setUser(data.user)
      toast.success(data.message || 'Welcome to Tech Community!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join.')
    } finally {
      setJoining(false)
    }
  }

  if (!user) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
      <Code2 size={32} className="mx-auto mb-3 text-gray-300" />
      <p className="text-gray-500">Sign in to access the Tech Community.</p>
    </div>
  )

  return isMember
    ? <MemberView user={user} members={members} loadingMembers={loadingMembers} />
    : <JoinView onJoin={join} joining={joining} />
}
