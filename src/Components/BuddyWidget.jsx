import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { X, Send, Loader2, ChevronDown, Mic, MicOff, Paperclip, Trash2 } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

// Point PDF.js worker at the bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href

// ── Buddy face ────────────────────────────────────────────────────────────────
function BuddyFace({ mood = 'happy', size = 48, blink = false }) {
  const s = size
  const eyeY = s * 0.36
  const eyeSize = s * 0.1
  const eyeOffX = s * 0.22
  const mouthY = s * 0.65
  const mouthW = s * 0.32
  const mouthH = s * 0.1

  const eyeStyle = {
    position: 'absolute',
    width: eyeSize,
    height: blink ? 2 : eyeSize,
    background: '#1a3c5e',
    borderRadius: '50%',
    top: eyeY,
    transition: 'height 0.08s',
  }

  const mouthStyle = mood === 'happy' ? {
    position: 'absolute',
    width: mouthW,
    height: mouthH,
    border: `${s * 0.045}px solid #1a3c5e`,
    borderTop: 'none',
    borderRadius: `0 0 ${mouthW}px ${mouthW}px`,
    left: '50%',
    top: mouthY,
    transform: 'translateX(-50%)',
  } : mood === 'excited' ? {
    position: 'absolute',
    width: mouthW * 1.1,
    height: mouthH * 1.4,
    border: `${s * 0.045}px solid #1a3c5e`,
    borderTop: 'none',
    borderRadius: `0 0 ${mouthW}px ${mouthW}px`,
    left: '50%',
    top: mouthY * 0.95,
    transform: 'translateX(-50%)',
  } : {
    position: 'absolute',
    width: mouthW * 0.8,
    height: 0,
    borderTop: `${s * 0.045}px solid #1a3c5e`,
    left: '50%',
    top: mouthY + mouthH * 0.5,
    transform: 'translateX(-50%)',
  }

  return (
    <div style={{
      width: s, height: s, borderRadius: '50%', position: 'relative', flexShrink: 0,
      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      boxShadow: '0 4px 14px rgba(251,191,36,0.45)',
    }}>
      <div style={{ position: 'absolute', width: s * 0.18, height: s * 0.1, background: 'rgba(239,68,68,0.18)', borderRadius: '50%', top: eyeY + eyeSize * 1.8, left: s * 0.07 }} />
      <div style={{ position: 'absolute', width: s * 0.18, height: s * 0.1, background: 'rgba(239,68,68,0.18)', borderRadius: '50%', top: eyeY + eyeSize * 1.8, right: s * 0.07 }} />
      <div style={{ ...eyeStyle, left: s / 2 - eyeOffX - eyeSize / 2 }} />
      <div style={{ ...eyeStyle, left: s / 2 + eyeOffX - eyeSize / 2 }} />
      <div style={mouthStyle} />
    </div>
  )
}

// ── Nudge triggers ────────────────────────────────────────────────────────────
const PAGE_LABELS = {
  '/app/explore':        'the feed',
  '/app/dashboard':      'the dashboard',
  '/app/resources':      'resources',
  '/app/cbt':            'CBT',
  '/app/past-questions': 'past questions',
  '/app/assignments':    'assignments',
  '/app/alumni':         'the alumni network',
  '/app/communities':    'communities',
  '/app/lets-talk':      "Let's Talk",
  '/app/elections':      'elections',
}

const STUDY_PAGES = ['/app/resources', '/app/cbt', '/app/past-questions', '/app/assignments']

function getNudge(pathname, minutesOnFeed, hour, userName) {
  const name = userName?.split(' ')[0] || 'boss'
  if (hour >= 0 && hour < 4)
    return { text: `${name} 😭 it's ${hour === 0 ? 'midnight' : `${hour}am`}! Close this app and sleep abeg. Your brain needs rest o.`, mood: 'concerned' }
  if (pathname === '/app/explore' && minutesOnFeed >= 12)
    return { text: `Oga ${name}, you've been scrolling for ${minutesOnFeed} minutes 😅 The feed will still be here. Go check your resources abeg!`, mood: 'thinking' }
  if (STUDY_PAGES.includes(pathname)) {
    const lines = [
      `See you being serious! 🔥 That's the energy, ${name}.`,
      `Ahh ${name} dey read! NEXUS team is proud of you fr 💪`,
      `This is the way. Keep going, ${name}! 📚`,
    ]
    return { text: lines[Math.floor(Math.random() * lines.length)], mood: 'excited' }
  }
  return null
}

// ── PDF text extractor ────────────────────────────────────────────────────────
async function extractPdfText(arrayBuffer) {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pages = []
    for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
      const page = await pdf.getPage(i)
      const tc = await page.getTextContent()
      pages.push(tc.items.map(item => item.str).join(' '))
    }
    return pages.join('\n')
  } catch {
    return null
  }
}

const MEMORY_LIMIT = 60 // max messages to persist
const WELCOME = { role: 'buddy', text: `Hey! I'm Buddy 👋 Your AMACOS campus companion. Ask me anything or just vibe with me 😄` }

function loadMessages(userId) {
  try {
    const saved = localStorage.getItem(`buddy_msgs_${userId}`)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  return [WELCOME]
}

function saveMessages(userId, msgs) {
  try {
    localStorage.setItem(`buddy_msgs_${userId}`, JSON.stringify(msgs.slice(-MEMORY_LIMIT)))
  } catch { /* storage full — ignore */ }
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function BuddyWidget() {
  const { user } = useAuth()
  const location = useLocation()

  const [open, setOpen] = useState(false)
  const [minimised, setMinimised] = useState(false)
  const [messages, setMessages] = useState(() => loadMessages(user?._id || 'guest'))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [blink, setBlink] = useState(false)
  const [nudge, setNudge] = useState(null)
  const [mood, setMood] = useState('happy')
  const [unread, setUnread] = useState(0)

  const [listening, setListening] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null) // { name, content, type }
  const [fileLoading, setFileLoading] = useState(false)
  const fileRef = useRef()

  const [pos, setPos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('buddy_pos')) || { bottom: 80, right: 12 } }
    catch { return { bottom: 80, right: 12 } }
  })
  const dragging = useRef(false)
  const dragStart = useRef({})
  const widgetRef = useRef()
  const feedMinutes = useRef(0)
  const feedTimer = useRef(null)
  const nudgeFired = useRef({})
  const messagesEndRef = useRef()
  const inputRef = useRef()
  const recognitionRef = useRef(null)

  const userName = user?.fullName?.split(' ')[0] || 'boss'
  const storageKey = `buddy_msgs_${user?._id || 'guest'}`

  // ── Persist messages to localStorage ─────────────────────────────────────
  useEffect(() => {
    saveMessages(user?._id || 'guest', messages)
  }, [messages, user?._id])

  const clearHistory = () => {
    const fresh = [WELCOME]
    setMessages(fresh)
    try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
  }

  // ── Drag ──────────────────────────────────────────────────────────────────
  const onDragStart = (e) => {
    dragging.current = true
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    dragStart.current = { x: clientX, y: clientY, bottom: pos.bottom, right: pos.right }
    e.preventDefault()
  }
  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const dx = dragStart.current.x - clientX
      const dy = dragStart.current.y - clientY
      const newRight = Math.max(4, Math.min(window.innerWidth - 60, dragStart.current.right + dx))
      const newBottom = Math.max(4, Math.min(window.innerHeight - 60, dragStart.current.bottom + dy))
      setPos({ right: newRight, bottom: newBottom })
    }
    const onEnd = () => {
      if (!dragging.current) return
      dragging.current = false
      setPos(p => { localStorage.setItem('buddy_pos', JSON.stringify(p)); return p })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [])

  // ── Voice input ───────────────────────────────────────────────────────────
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const rec = new SR()
    rec.lang = 'en-NG'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(prev => prev ? `${prev} ${transcript}` : transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }

  // ── File attachment — all types, with PDF text extraction ──────────────────
  const handleFileAttach = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setFileLoading(true)

    try {
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
      const isImage = file.type.startsWith('image/')
      const isText = file.type.startsWith('text/') || /\.(txt|md|csv|json|js|ts|jsx|tsx|py|html|css)$/i.test(file.name)

      if (isPdf) {
        const buf = await file.arrayBuffer()
        const text = await extractPdfText(buf)
        if (text && text.trim().length > 20) {
          setAttachedFile({ name: file.name, content: text, type: 'pdf' })
        } else {
          setAttachedFile({ name: file.name, content: `[PDF: ${file.name} — could not extract text. Student has attached this PDF.]`, type: 'pdf-unreadable' })
        }
      } else if (isImage) {
        // Send image name as context; Buddy acknowledges without vision
        setAttachedFile({ name: file.name, content: `[Image file: ${file.name}. Student has attached an image to their message.]`, type: 'image' })
      } else if (isText) {
        const text = await file.text()
        setAttachedFile({ name: file.name, content: text, type: 'text' })
      } else {
        // Binary or unknown — just mention the file name
        setAttachedFile({ name: file.name, content: `[File attachment: ${file.name} (${(file.size / 1024).toFixed(1)} KB). Student attached this file.]`, type: 'other' })
      }
    } catch {
      setAttachedFile({ name: file.name, content: `[File: ${file.name}]`, type: 'other' })
    } finally {
      setFileLoading(false)
    }
  }

  // ── Send message — auto-lookup platform resources ─────────────────────────
  const send = async () => {
    const text = input.trim()
    if ((!text && !attachedFile) || loading) return
    setInput('')

    const displayText = attachedFile
      ? `📎 ${attachedFile.name}${text ? `\n${text}` : ''}`
      : text
    const newMessages = [...messages, { role: 'user', text: displayText }]
    setMessages(newMessages)
    const fileToSend = attachedFile
    setAttachedFile(null)
    setLoading(true)
    setMood('thinking')

    try {
      // Search platform resources in parallel with any network delay
      let platformContext = ''
      if (text) {
        try {
          const { data: lookup } = await axios.get('/api/buddy/lookup', { params: { q: text } })
          platformContext = lookup.context || ''
        } catch { /* non-fatal */ }
      }

      const { data } = await axios.post('/api/buddy/chat', {
        message: text,
        context: { page: location.pathname, timeOnPage: feedMinutes.current, hour: new Date().getHours() },
        history: newMessages.slice(-10).map(m => ({ role: m.role, text: m.text })),
        fileContent: fileToSend?.content || null,
        fileName: fileToSend?.name || null,
        platformContext,
      })
      setMessages(p => [...p, { role: 'buddy', text: data.reply }])
      setMood('happy')
    } catch {
      setMessages(p => [...p, { role: 'buddy', text: "Abeg my signal cut 😅 try again?" }])
      setMood('happy')
    } finally {
      setLoading(false)
    }
  }

  // ── Blink ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const blinker = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 120)
    }, 4000 + Math.random() * 2000)
    return () => clearInterval(blinker)
  }, [])

  // ── Feed timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (location.pathname === '/app/explore') {
      feedTimer.current = setInterval(() => { feedMinutes.current += 1 }, 60000)
    } else {
      clearInterval(feedTimer.current)
      feedMinutes.current = 0
    }
    return () => clearInterval(feedTimer.current)
  }, [location.pathname])

  // ── Study page nudge ──────────────────────────────────────────────────────
  useEffect(() => {
    const key = location.pathname
    if (STUDY_PAGES.includes(key) && !nudgeFired.current[key]) {
      nudgeFired.current[key] = true
      setTimeout(() => {
        const n = getNudge(key, feedMinutes.current, new Date().getHours(), userName)
        if (n) fireNudge(n)
      }, 3000)
    }
  }, [location.pathname])

  // ── Night owl check ───────────────────────────────────────────────────────
  useEffect(() => {
    const h = new Date().getHours()
    if ((h >= 0 && h < 4) && !nudgeFired.current['night']) {
      nudgeFired.current['night'] = true
      setTimeout(() => fireNudge(getNudge(location.pathname, 0, h, userName)), 5000)
    }
  }, [])

  // ── Feed scroll nudge ─────────────────────────────────────────────────────
  useEffect(() => {
    const checker = setInterval(() => {
      if (location.pathname !== '/app/explore') return
      const n = getNudge('/app/explore', feedMinutes.current, new Date().getHours(), userName)
      if (n && feedMinutes.current > 0 && feedMinutes.current % 12 === 0) fireNudge(n)
    }, 60000)
    return () => clearInterval(checker)
  }, [location.pathname, userName])

  // ── Daily greeting ────────────────────────────────────────────────────────
  useEffect(() => {
    const today = new Date().toDateString()
    const last = localStorage.getItem('buddy_last_seen')
    if (last !== today) {
      localStorage.setItem('buddy_last_seen', today)
      const h = new Date().getHours()
      const greeting = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
      setTimeout(() => fireNudge({
        text: `Good ${greeting}, ${userName}! 🔥 The AMACOS platform is live and you're here — let's make today count!`,
        mood: 'excited',
      }), 4000)
    }
  }, [])

  const fireNudge = useCallback((n) => {
    setNudge(n)
    setMood(n.mood || 'happy')
    if (!open) setUnread(c => c + 1)
    setMessages(prev => [...prev, { role: 'buddy', text: n.text }])
  }, [open])

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (open) { setUnread(0); setNudge(null) }
  }, [open])

  if (minimised) return (
    <button onClick={() => setMinimised(false)}
      className="fixed z-50 flex items-center gap-2 bg-[#1a3c5e] text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg"
      style={{ bottom: pos.bottom, right: pos.right }}>
      <BuddyFace size={20} mood="happy" />
      Buddy
      {unread > 0 && <span className="bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">{unread}</span>}
    </button>
  )

  return (
    <div ref={widgetRef} className="fixed z-50 flex flex-col items-end gap-2"
      style={{ bottom: pos.bottom, right: pos.right, pointerEvents: 'none' }}>

      {/* Nudge bubble */}
      {nudge && !open && (
        <div className="flex items-end gap-2 mb-1" style={{ pointerEvents: 'auto', maxWidth: 260 }}>
          <div className="relative bg-white rounded-2xl rounded-br-none shadow-xl border border-gray-100 px-3 py-2.5">
            <button onClick={() => setNudge(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center">
              <X size={10} className="text-gray-500" />
            </button>
            <p className="text-gray-700 text-xs leading-relaxed">{nudge.text}</p>
            <button onClick={() => { setOpen(true); setNudge(null) }}
              className="text-[#1a3c5e] text-[10px] font-bold mt-1 hover:underline">
              Chat with Buddy →
            </button>
          </div>
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ width: 300, height: 420, pointerEvents: 'auto' }}>

          {/* Header */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #0d2137 0%, #1a3c5e 100%)' }}>
            <BuddyFace size={32} mood={mood} blink={blink} />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Buddy</p>
              <p className="text-blue-300 text-[10px]">Your AMACOS companion · {messages.length - 1} messages</p>
            </div>
            <button onClick={clearHistory} title="Clear chat history"
              className="p-1 text-white/30 hover:text-red-400 transition">
              <Trash2 size={13} />
            </button>
            <button onClick={() => setMinimised(true)} className="p-1 text-white/40 hover:text-white/80 transition">
              <ChevronDown size={15} />
            </button>
            <button onClick={() => setOpen(false)} className="p-1 text-white/40 hover:text-white/80 transition">
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5" style={{ background: '#f8fafc' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex items-end gap-1.5 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {m.role === 'buddy' && <BuddyFace size={22} mood="happy" />}
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#1a3c5e] text-white rounded-br-none'
                    : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-end gap-1.5">
                <BuddyFace size={22} mood="thinking" />
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-none px-3 py-2 flex gap-1">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* File attachment preview */}
          {attachedFile && (
            <div className="mx-3 mb-1 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-2.5 py-1.5">
              <Paperclip size={11} className="text-blue-500 flex-shrink-0" />
              <p className="text-blue-700 text-[11px] font-semibold flex-1 truncate">{attachedFile.name}</p>
              <button onClick={() => setAttachedFile(null)} className="text-blue-400 hover:text-red-500"><X size={11} /></button>
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-1.5 px-3 py-2.5 border-t border-gray-100 bg-white">
            {/* Accept all file types */}
            <input ref={fileRef} type="file" accept="*" className="hidden" onChange={handleFileAttach} />
            <button onClick={() => fileRef.current?.click()} disabled={fileLoading}
              className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 bg-gray-100 text-gray-400 hover:bg-gray-200 transition disabled:opacity-50">
              {fileLoading ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
            </button>
            <button onClick={toggleVoice}
              className={`w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 transition ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
              {listening ? <MicOff size={12} /> : <Mic size={12} />}
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={listening ? 'Listening…' : attachedFile ? 'Add a message…' : 'Say something…'}
              style={{ fontSize: 14 }}
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
            />
            <button onClick={send} disabled={loading || fileLoading || (!input.trim() && !attachedFile)}
              className="w-7 h-7 bg-[#1a3c5e] hover:bg-[#15324f] disabled:opacity-40 text-white rounded-full flex items-center justify-center transition flex-shrink-0">
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>
        </div>
      )}

      {/* Floating Buddy button — drag to move, tap to open */}
      <div style={{ pointerEvents: 'auto', position: 'relative', touchAction: 'none' }}>
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 z-10 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow">
            {unread}
          </span>
        )}
        <button
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          onClick={() => { if (!dragging.current) { setOpen(o => !o); setNudge(null) } }}
          className="transition-transform hover:scale-110 active:scale-95 cursor-grab active:cursor-grabbing"
          style={{
            animation: nudge && !open ? 'buddyBounce 0.6s ease infinite alternate' : 'buddyIdle 3s ease-in-out infinite',
          }}
        >
          <BuddyFace size={52} mood={mood} blink={blink} />
        </button>
      </div>

      <style>{`
        @keyframes buddyIdle {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes buddyBounce {
          0%   { transform: translateY(0px) rotate(-5deg); }
          100% { transform: translateY(-8px) rotate(5deg); }
        }
      `}</style>
    </div>
  )
}
