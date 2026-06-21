import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import axios from 'axios'
const FilterStudio = lazy(() => import('../Components/FilterStudio'))
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import SignInPrompt from '../Components/SignInPrompt'
import {
  Heart, MessageCircle, Bookmark, MoreHorizontal, X,
  Globe, Lock, Loader2, Image as ImageIcon, Plus,
  ArrowLeft, Trash2, Send, Search, Check, Camera,
  RefreshCw, Zap, ZapOff, Smile, Paperclip, Share2,
  UserPlus, UserCheck, Clock, AlertCircle, Film, File as FileIcon,
} from 'lucide-react'

// ── Effects ────────────────────────────────────────────────────────────────────
const EFFECTS = [
  { id: 'normal',    name: 'Normal',    emoji: '✨', css: 'none',                                                                  svgId: null },
  { id: 'glam',      name: 'Glam',      emoji: '💅', css: 'brightness(1.18) saturate(1.4) contrast(1.08)',                        svgId: null },
  { id: 'neon',      name: 'Neon',      emoji: '⚡', css: 'saturate(2.8) brightness(1.1) hue-rotate(20deg) contrast(1.35)',       svgId: null },
  { id: 'cyber',     name: 'Cyber',     emoji: '🤖', css: 'hue-rotate(258deg) saturate(2.2) contrast(1.5) brightness(0.88)',      svgId: null },
  { id: 'glitch',    name: 'Glitch',    emoji: '📡', css: 'contrast(1.4) saturate(2)',                                            svgId: 'ef-glitch' },
  { id: 'amacos',    name: 'AMACOS',    emoji: '🔷', css: 'sepia(1) hue-rotate(178deg) saturate(3.5)',                           svgId: 'ef-duotone' },
  { id: 'dreamy',    name: 'Dreamy',    emoji: '🌸', css: 'brightness(1.12) saturate(1.25) contrast(0.88)',                       svgId: 'ef-dreamy' },
  { id: 'lofi',      name: 'Lo-Fi',     emoji: '📻', css: 'saturate(0.5) contrast(1.25) brightness(0.95) sepia(0.28)',           svgId: null },
  { id: 'noir',      name: 'Noir',      emoji: '🎭', css: 'grayscale(1) contrast(1.6) brightness(0.82)',                         svgId: null },
  { id: 'summer',    name: 'Summer',    emoji: '☀️', css: 'saturate(1.7) brightness(1.12) hue-rotate(-18deg) contrast(1.06)',    svgId: null },
  { id: 'vintage',   name: 'Vintage',   emoji: '📷', css: 'sepia(0.75) contrast(1.12) brightness(1.06) saturate(0.65)',          svgId: null },
  { id: 'vhs',       name: 'VHS',       emoji: '📼', css: 'saturate(1.5) contrast(1.25) brightness(0.82) hue-rotate(6deg)',      svgId: 'ef-grain' },
  { id: 'cinematic', name: 'Cinematic', emoji: '🎬', css: 'saturate(0.82) contrast(1.4) brightness(0.9)',                        svgId: null },
  { id: 'aurora',    name: 'Aurora',    emoji: '🌌', css: 'hue-rotate(218deg) saturate(2) brightness(1.12) contrast(1.25)',      svgId: null },
  { id: 'bold',      name: 'Bold',      emoji: '💥', css: 'saturate(2.4) contrast(1.55) brightness(1.06)',                       svgId: null },
  { id: 'film',      name: 'Film',      emoji: '🎞️', css: 'contrast(1.15) brightness(0.93) saturate(0.8)',                      svgId: 'ef-grain' },
]

const effectStyle = (e) => {
  if (!e || e.id === 'normal') return {}
  if (e.svgId) {
    const svg = `url(#${e.svgId})`
    return { filter: e.css && e.css !== 'none' ? `${svg} ${e.css}` : svg }
  }
  return e.css && e.css !== 'none' ? { filter: e.css } : {}
}

const captureCss = (e) => {
  if (!e || e.id === 'normal' || !e.css || e.css === 'none') return null
  return e.css
}

const getVideoMime = () => {
  if (typeof MediaRecorder === 'undefined') return ''
  const list = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  return list.find(t => MediaRecorder.isTypeSupported(t)) || ''
}

const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}
const fmtNum = (n = 0) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n)
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// ── Emoji & Sticker Data ────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = [
  {
    label: '😀 Faces', emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😉','😊','😇','🥰','😍','🤩','😘',
      '😋','😛','😜','🤪','😝','🤑','🤗','🤔','😐','😑','😶','😏','😒','🙄','😬','🤥',
      '😔','😪','😴','😷','🤒','🤕','🤢','🤧','🥵','🥶','🥴','😵','🤯','😎','🤓','🧐',
      '😕','🙁','☹️','😮','😲','😳','🥺','😦','😨','😰','😥','😢','😭','😱','😖','😣',
      '😞','😓','😩','😫','🥱','😤','😡','😠','🤬','👿','💀','☠️','💩','🤡','👹','👺',
    ],
  },
  {
    label: '👋 Gestures', emojis: [
      '👋','🤚','🖐️','✋','🖖','👌','🤌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇',
      '☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🙏','✍️','💪','🦾','🫶',
    ],
  },
  {
    label: '❤️ Hearts', emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖',
      '💘','💝','💟','💯','💢','💥','💫','💦','💨','💬','💭','💤','✨','🌟','⭐','🌈',
    ],
  },
  {
    label: '🎉 Fun', emojis: [
      '🎉','🎊','🎈','🎁','🎀','🎂','🎆','🎇','✨','🏆','🥇','🎯','🎮','🎬','🎤','🎧',
      '🎵','🎶','🎸','🥁','🎹','🎺','🎻','🚀','⚡','🔥','💎','👑','🌊','🌸','🌺','🌻',
    ],
  },
  {
    label: '🔥 Trending', emojis: [
      '🔥','💯','👑','💎','🌈','🚀','⚡','🌊','🍀','✈️','🌍','🎯','🏆','💪','🦁','🐯',
      '🦊','🐻','🐼','🐨','🦄','🦋','🌸','🌺','🌻','🌹','🍕','🍔','🍟','🌮','🍰','🎂',
      '🍦','🧋','🎮','📱','💻','📸','🌙','☀️','🌟','💫','🏄','🎭','🎪','🤹','🎠',
    ],
  },
]

const STICKER_PACKS = [
  {
    name: 'AMACOS',
    stickers: [
      { id: 'am-1', label: 'Study Mode',   text: '📚\nStudy Mode\nON!' },
      { id: 'am-2', label: 'Graduate',     text: '🎓\nFuture\nGraduate!' },
      { id: 'am-3', label: 'Notes',        text: '✏️\nTaking\nNotes!' },
      { id: 'am-4', label: 'Mass Comm',    text: '🎬\nMass Comm\nVibes' },
      { id: 'am-5', label: 'Breaking',     text: '🗞️\nBREAKING\nNEWS!' },
      { id: 'am-6', label: 'On Air',       text: '📡\nLIVE\nON AIR' },
    ],
  },
  {
    name: 'Reactions',
    stickers: [
      { id: 're-1', label: 'Dead',         text: '💀\nI\'m dead\n💀' },
      { id: 're-2', label: 'Wow',          text: '🤩\nWOW!!!' },
      { id: 're-3', label: 'Ugh',          text: '😤\nUGH!' },
      { id: 're-4', label: 'Please',       text: '🥺\nPlease...' },
      { id: 're-5', label: 'LOL',          text: '😂\nLOL!!!' },
      { id: 're-6', label: 'Fire',         text: '🔥\nThis is\nFIRE!' },
      { id: 're-7', label: 'Facts',        text: '💯\nFACTS!' },
      { id: 're-8', label: 'Crying',       text: '😭\nI can\'t...' },
      { id: 're-9', label: 'No way',       text: '😱\nNO WAY!!!' },
      { id: 're-10', label: 'Slay',        text: '👑\nSLAY\nQUEEN!' },
    ],
  },
  {
    name: 'Campus Life',
    stickers: [
      { id: 'ca-1', label: 'Lecture',      text: '🏫\nOff to\nLecture!' },
      { id: 'ca-2', label: 'Boring',       text: '😴\nLecture\nis boring...' },
      { id: 'ca-3', label: 'Exam',         text: '📖\nExam\nSeason 😰' },
      { id: 'ca-4', label: 'Holiday',      text: '🎉\nSchool\nis out!!!' },
      { id: 'ca-5', label: 'Coffee',       text: '☕\nNeed Coffee\nASAP' },
      { id: 'ca-6', label: 'Hungry',       text: '🍔\nCanteen\ntime!' },
      { id: 'ca-7', label: 'Assignment',   text: '💻\nDoing\nassignment...' },
      { id: 'ca-8', label: 'Pass Please',  text: '🤞\nPlease let\nme pass!' },
      { id: 'ca-9', label: 'Group Work',   text: '👥\nGroup work\ntime!' },
      { id: 'ca-10', label: 'Weekend',     text: '🎊\nIt\'s the\nweekend!' },
    ],
  },
]

// ── SVG Filters ────────────────────────────────────────────────────────────────
function SVGFilters() {
  return (
    <svg style={{ display: 'none', position: 'absolute' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ef-glitch" x="-5%" y="-5%" width="110%" height="110%">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" in="SourceGraphic" result="r"/>
          <feOffset dx="6" dy="-2" in="r" result="r2"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" in="SourceGraphic" result="g"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" in="SourceGraphic" result="b"/>
          <feOffset dx="-6" dy="2" in="b" result="b2"/>
          <feBlend in="r2" in2="g" mode="screen" result="rg"/>
          <feBlend in="rg" in2="b2" mode="screen"/>
        </filter>
        <filter id="ef-duotone">
          <feColorMatrix type="saturate" values="0" result="gray"/>
          <feComponentTransfer in="gray">
            <feFuncR type="table" tableValues="0.102 0.961"/>
            <feFuncG type="table" tableValues="0.235 0.620"/>
            <feFuncB type="table" tableValues="0.369 0.043"/>
          </feComponentTransfer>
        </filter>
        <filter id="ef-dreamy" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="4" in="SourceGraphic" result="blur"/>
          <feBlend in="SourceGraphic" in2="blur" mode="screen" result="glow"/>
          <feComponentTransfer in="glow">
            <feFuncR type="linear" slope="1.08" intercept="0.04"/>
            <feFuncB type="linear" slope="1.14" intercept="0.08"/>
          </feComponentTransfer>
        </filter>
        <filter id="ef-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" result="noise"/>
          <feColorMatrix type="saturate" values="0" in="noise" result="gn"/>
          <feBlend in="SourceGraphic" in2="gn" mode="overlay" result="blended"/>
          <feComponentTransfer in="blended">
            <feFuncR type="linear" slope="0.94" intercept="0"/>
            <feFuncG type="linear" slope="0.90" intercept="0"/>
            <feFuncB type="linear" slope="0.86" intercept="0.02"/>
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  )
}

// ── Effect Strip ───────────────────────────────────────────────────────────────
function EffectStrip({ active, onChange, thumbSrc }) {
  const stripRef = useRef()
  useEffect(() => {
    const el = stripRef.current?.querySelector(`[data-id="${active.id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [active.id])
  return (
    <div ref={stripRef} className="flex gap-2.5 overflow-x-auto px-4 py-3 scrollbar-none">
      {EFFECTS.map(e => {
        const isActive = active.id === e.id
        return (
          <button key={e.id} data-id={e.id} onClick={() => onChange(e)}
            className="flex-shrink-0 flex flex-col items-center gap-1.5">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden transition-all duration-150"
              style={{ outline: isActive ? '3px solid #f59e0b' : '3px solid transparent', outlineOffset: '1px' }}>
              {thumbSrc ? (
                <img src={thumbSrc} alt={e.name} className="w-full h-full object-cover" style={effectStyle(e)} />
              ) : (
                <div className="w-full h-full"
                  style={{ background: 'linear-gradient(135deg,#1a3c5e 0%,#7c3aed 38%,#ec4899 65%,#f59e0b 100%)', ...effectStyle(e) }} />
              )}
              <div className="absolute bottom-0.5 right-0.5 text-[11px] leading-none drop-shadow">{e.emoji}</div>
            </div>
            <span className={`text-[10px] font-bold transition-colors leading-none ${isActive ? 'text-amber-400' : 'text-white/55'}`}>
              {e.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Emoji / Sticker Picker ─────────────────────────────────────────────────────
function EmojiPicker({ onEmoji, onSticker, onSendCustomSticker, onClose }) {
  const [tab, setTab] = useState('emoji')
  const [emojiCat, setEmojiCat] = useState(0)
  const [stickerPack, setStickerPack] = useState(0)
  // custom sticker creator state
  const [customImgUrl, setCustomImgUrl] = useState('')
  const [customText, setCustomText] = useState('')
  const [customTextColor, setCustomTextColor] = useState('#ffffff')
  const [customTextPos, setCustomTextPos] = useState('bottom') // 'top' | 'bottom'
  const [imgReady, setImgReady] = useState(false)
  const [creating, setCreating] = useState(false)
  const canvasRef = useRef()
  const hiddenImgRef = useRef()
  const filePickRef = useRef()
  const ref = useRef()

  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const img = hiddenImgRef.current
    if (!canvas || !img || !img.complete || !img.naturalWidth) return
    const SIZE = 300
    canvas.width = SIZE; canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    // cover-fit image
    const scale = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight)
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h)
    // text overlay
    if (customText.trim()) {
      const lines = customText.trim().split('\n').slice(0, 3)
      const lineH = 34
      const padding = 12
      const totalH = lines.length * lineH + padding * 2
      const yStart = customTextPos === 'bottom' ? SIZE - totalH : 0
      // semi-transparent backing
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(0, yStart, SIZE, totalH)
      // text
      ctx.font = 'bold 22px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.shadowColor = 'rgba(0,0,0,0.9)'
      ctx.shadowBlur = 6
      ctx.fillStyle = customTextColor
      lines.forEach((line, i) => ctx.fillText(line, SIZE / 2, yStart + padding + i * lineH, SIZE - 24))
    }
  }, [customText, customTextColor, customTextPos, imgReady])

  useEffect(() => { if (imgReady) drawCanvas() }, [drawCanvas, imgReady])

  const onImgLoad = () => { setImgReady(true) }

  const pickStickerImage = (e) => {
    const f = e.target.files[0]; if (!f) return
    if (!f.type.startsWith('image/')) { return }
    setCustomImgUrl(URL.createObjectURL(f))
    setImgReady(false)
    e.target.value = ''
  }

  const sendCustom = () => {
    if (!canvasRef.current || !imgReady || creating) return
    setCreating(true)
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `sticker-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onSendCustomSticker(file)
        setCustomImgUrl(''); setCustomText(''); setImgReady(false)
        setTab('sticker')
      }
      setCreating(false)
    }, 'image/jpeg', 0.92)
  }

  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100">
        {[['emoji','😀 Emoji'],['sticker','🎭 Packs'],['create','✨ Create']].map(([t,label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[11px] font-bold transition ${tab === t ? 'text-[#1a3c5e] border-b-2 border-[#1a3c5e]' : 'text-gray-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'emoji' && (
        <>
          <div className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-none border-b border-gray-50">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button key={i} onClick={() => setEmojiCat(i)}
                className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-semibold transition ${emojiCat === i ? 'bg-[#1a3c5e]/10 text-[#1a3c5e]' : 'text-gray-400 hover:text-gray-600'}`}>
                {cat.label.split(' ')[0]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-0 p-2 max-h-44 overflow-y-auto">
            {EMOJI_CATEGORIES[emojiCat].emojis.map((em, i) => (
              <button key={i} onClick={() => onEmoji(em)}
                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 rounded-lg transition">
                {em}
              </button>
            ))}
          </div>
        </>
      )}

      {tab === 'sticker' && (
        <>
          <div className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-none border-b border-gray-50">
            {STICKER_PACKS.map((pack, i) => (
              <button key={i} onClick={() => setStickerPack(i)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition ${stickerPack === i ? 'bg-[#1a3c5e]/10 text-[#1a3c5e]' : 'text-gray-400 hover:text-gray-600'}`}>
                {pack.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 p-3 max-h-52 overflow-y-auto">
            {STICKER_PACKS[stickerPack].stickers.map(s => (
              <button key={s.id} onClick={() => onSticker(s)}
                className="flex items-center justify-center p-2 bg-gray-50 hover:bg-[#1a3c5e]/5 rounded-xl transition border border-gray-100 min-h-[72px] text-xs font-bold text-[#1a3c5e] leading-snug whitespace-pre-line text-center">
                {s.text}
              </button>
            ))}
          </div>
        </>
      )}

      {tab === 'create' && (
        <div className="p-3 space-y-3">
          {/* Hidden canvas + img for compositing */}
          {customImgUrl && (
            <img ref={hiddenImgRef} src={customImgUrl} onLoad={onImgLoad}
              className="hidden" alt="" crossOrigin="anonymous" />
          )}

          {/* Image picker or preview */}
          {!customImgUrl ? (
            <button onClick={() => filePickRef.current?.click()}
              className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#1a3c5e]/40 hover:text-[#1a3c5e] transition">
              <ImageIcon size={22} />
              <span className="text-xs font-bold">Pick a photo</span>
            </button>
          ) : (
            <div className="relative">
              <canvas ref={canvasRef}
                className="w-full rounded-xl border border-gray-100" style={{ aspectRatio: '1/1' }} />
              <button onClick={() => { setCustomImgUrl(''); setImgReady(false) }}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition">
                <X size={11} />
              </button>
            </div>
          )}

          {/* Text input */}
          <input value={customText} onChange={e => setCustomText(e.target.value)}
            placeholder="Add text (optional)"
            maxLength={60}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none text-gray-700" />

          {/* Controls row */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-semibold">Color</span>
              {['#ffffff','#ffea00','#ff4757','#2ed573','#1e90ff','#000000'].map(c => (
                <button key={c} onClick={() => setCustomTextColor(c)}
                  style={{ background: c, outline: customTextColor === c ? `2px solid #1a3c5e` : '2px solid transparent' }}
                  className="w-5 h-5 rounded-full border border-gray-200 transition" />
              ))}
            </div>
            <div className="ml-auto flex gap-1">
              {['top','bottom'].map(p => (
                <button key={p} onClick={() => setCustomTextPos(p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${customTextPos === p ? 'bg-[#1a3c5e] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {p === 'top' ? '⬆️' : '⬇️'}
                </button>
              ))}
            </div>
          </div>

          <button onClick={sendCustom} disabled={!imgReady || creating}
            className="w-full py-2.5 bg-[#1a3c5e] hover:bg-[#152f4a] text-white text-xs font-bold rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2">
            {creating ? <Loader2 size={12} className="animate-spin" /> : '🚀'}
            {creating ? 'Sending…' : 'Send Custom Sticker'}
          </button>

          <input ref={filePickRef} type="file" accept="image/*" className="hidden" onChange={pickStickerImage} />
        </div>
      )}
    </div>
  )
}

// ── Camera Modal ───────────────────────────────────────────────────────────────
function CameraModal({ open, onClose, user, onPost }) {
  const [stage, setStage] = useState('compose')
  const [mode, setMode] = useState('photo')
  const [advancedMode, setAdvancedMode] = useState(false)
  const [stream, setStream] = useState(null)
  const [facingMode, setFacingMode] = useState('user')
  const [torchOn, setTorchOn] = useState(false)
  const [effect, setEffect] = useState(EFFECTS[0])
  const [recording, setRecording] = useState(false)
  const [recSecs, setRecSecs] = useState(0)
  const [captured, setCaptured] = useState(null)
  const [thumbSrc, setThumbSrc] = useState(null)
  const [content, setContent] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [posting, setPosting] = useState(false)
  const [camErr, setCamErr] = useState(false)

  const videoRef   = useRef()
  const mrRef      = useRef()
  const chunksRef  = useRef([])
  const fileRef    = useRef()
  const recTimer   = useRef()
  const recInterval = useRef()

  const startCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        videoRef.current.onloadeddata = grabThumb
      }
      setCamErr(false)
    } catch { setCamErr(true) }
  }

  const stopCam = () => { stream?.getTracks().forEach(t => t.stop()); setStream(null) }
  const grabThumb = () => {
    const v = videoRef.current
    if (!v?.videoWidth) return
    const c = document.createElement('canvas')
    c.width = 80; c.height = 80
    c.getContext('2d').drawImage(v, 0, 0, 80, 80)
    setThumbSrc(c.toDataURL('image/jpeg', 0.7))
  }

  useEffect(() => { if (open && stage === 'camera') startCam(); return () => stopCam() }, [open, facingMode, stage])
  useEffect(() => { if (!open) resetAll() }, [open])

  const resetAll = () => {
    setCaptured(null); setContent(''); setStage('compose')
    setEffect(EFFECTS[0]); setThumbSrc(null); setRecSecs(0); setRecording(false)
  }

  const toggleTorch = async () => {
    const track = stream?.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] })
      setTorchOn(v => !v)
    } catch { toast('Flash not available on this device', { icon: '⚡' }) }
  }

  const snapPhoto = () => {
    const v = videoRef.current
    if (!v?.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth; canvas.height = v.videoHeight
    const ctx = canvas.getContext('2d')
    if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
    const css = captureCss(effect)
    if (css) ctx.filter = css
    ctx.drawImage(v, 0, 0)
    canvas.toBlob(blob => {
      setCaptured({ url: URL.createObjectURL(blob), rawBlob: blob, type: 'image', fileName: 'capture.jpg', mimeType: 'image/jpeg' })
      setEffect(EFFECTS[0]); stopCam(); setStage('preview')
    }, 'image/jpeg', 0.92)
  }

  const startRec = () => {
    if (!stream) return
    const mime = getVideoMime()
    if (!mime) { toast.error('Video recording not supported on this browser.'); return }
    chunksRef.current = []
    try {
      const mr = new MediaRecorder(stream, { mimeType: mime })
      mr.ondataavailable = e => { if (e.data?.size) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        clearInterval(recInterval.current)
        const blob = new Blob(chunksRef.current, { type: mime })
        setCaptured({ url: URL.createObjectURL(blob), rawBlob: blob, type: 'video', fileName: 'capture.webm', mimeType: mime, effectCss: captureCss(effect) })
        stopCam(); setStage('preview'); setRecording(false)
      }
      mr.onerror = () => toast.error('Recording error. Try again.')
      mrRef.current = mr
      mr.start(250)
      setRecording(true); setRecSecs(0)
      recInterval.current = setInterval(() => setRecSecs(s => s + 1), 1000)
      recTimer.current = setTimeout(stopRec, 60000)
    } catch (err) { toast.error('Could not start recording: ' + err.message) }
  }

  const stopRec = () => {
    clearTimeout(recTimer.current); clearInterval(recInterval.current)
    if (mrRef.current?.state === 'recording') mrRef.current.stop()
  }

  const handleGallery = (e) => {
    const f = e.target.files[0]
    if (!f) return
    const isVid = f.type.startsWith('video/')
    const isImg = f.type.startsWith('image/')
    const max = isVid ? 100 : isImg ? 10 : 50
    if (f.size > max * 1024 * 1024) { toast.error(`File must be under ${max} MB.`); return }
    const type = isVid ? 'video' : isImg ? 'image' : 'file'
    setCaptured({ url: URL.createObjectURL(f), rawBlob: f, type, fileName: f.name, mimeType: f.type })
    stopCam(); setStage('preview')
    e.target.value = ''
  }

  const handlePost = () => {
    if (!content.trim() && !captured) return toast.error('Write something or capture media.')

    // Snapshot everything needed before closing the modal
    const snap = { content, captured, isPublic, effect }
    resetAll()
    onClose()

    // Fire-and-forget upload — user can keep using the app
    const tid = toast.loading(snap.captured ? 'Uploading media…' : 'Posting…', { duration: Infinity })

    const doUpload = async () => {
      try {
        const fd = new FormData()
        fd.append('content', snap.content)
        fd.append('isPublic', snap.isPublic)
        if (snap.captured) {
          let blob = snap.captured.rawBlob
          if (snap.captured.type === 'image' && snap.effect.id !== 'normal') {
            blob = await bakeEffect(snap.captured.url, captureCss(snap.effect)) || blob
          }
          fd.append('media', new File([blob], snap.captured.fileName, { type: snap.captured.mimeType }))
        }
        const token = localStorage.getItem('amacos_token')
        const { data } = await axios.post('/api/posts', fd, {
          withCredentials: true,
          timeout: snap.captured?.type === 'video' ? 300000 : snap.captured ? 60000 : 15000,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        toast.dismiss(tid)
        try { onPost(data.post) } catch { /* feed may have unmounted */ }
        toast.success('Post published! Scroll up to view it.', { duration: 5000 })
      } catch (err) {
        toast.dismiss(tid)
        const isConnErr = !err.response && (err.code === 'ERR_NETWORK' || err.message === 'Network Error')
        toast.error(
          isConnErr
            ? 'Connection lost. Wait a moment and try posting again.'
            : err.response?.data?.message || (err.code === 'ECONNABORTED' ? 'Upload timed out. Try a smaller file.' : 'Post failed. Please try again.'),
          { duration: 6000 }
        )
      }
    }

    doUpload()
  }

  const retake = () => { setCaptured(null); setEffect(EFFECTS[0]); setStage('camera') }
  const handleClose = () => { stopCam(); stopRec(); resetAll(); onClose() }

  if (!open) return null

  if (stage === 'compose') return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#080f1c' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
        <button onClick={handleClose} className="text-white/60 hover:text-white transition text-sm font-semibold">
          Cancel
        </button>
        <h2 className="font-bold text-white text-sm tracking-wide">Create Post</h2>
        <button onClick={handlePost} disabled={!content.trim() && !captured}
          className="bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-[#0d1f35] font-black text-sm px-5 py-1.5 rounded-full transition-all hover:bg-amber-300">
          Post
        </button>
      </div>

      {/* Text area */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-[#0d1f35] font-bold text-sm flex-shrink-0 mt-0.5 shadow-lg shadow-amber-500/20">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
              : user?.fullName?.charAt(0)?.toUpperCase()
            }
          </div>
          <div className="flex-1">
            <p className="text-white/50 text-xs font-semibold mb-1">{user?.fullName}</p>
            <textarea autoFocus value={content} onChange={e => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
              className="w-full bg-transparent text-white placeholder-white/25 text-base leading-relaxed resize-none focus:outline-none" />
          </div>
        </div>

        {/* Attached media preview */}
        {captured && (
          <div className="mt-4 relative rounded-2xl overflow-hidden bg-black/40 border border-white/10">
            {captured.type === 'video'
              ? <video src={captured.url} className="w-full max-h-64 object-contain" playsInline controls={false} />
              : <img src={captured.url} alt="" className="w-full max-h-64 object-cover" />
            }
            <button onClick={() => setCaptured(null)}
              className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black transition">
              <X size={14} />
            </button>
            <span className="absolute bottom-2 left-2 text-xs text-white/60 bg-black/50 px-2 py-0.5 rounded-full capitalize">{captured.type}</span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="border-t border-white/10 px-5 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setStage('camera')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium transition">
              <Camera size={16} /> Camera
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium transition">
              <ImageIcon size={16} /> Gallery
            </button>
          </div>
          <button onClick={() => setIsPublic(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition ${
              isPublic ? 'border-blue-500/40 bg-blue-500/10 text-blue-300' : 'border-amber-400/40 bg-amber-400/10 text-amber-300'
            }`}>
            {isPublic ? <><Globe size={11} /> Public</> : <><Lock size={11} /> AMACOS Only</>}
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="*" className="hidden" onChange={handleGallery} />
    </div>
  )

  const CIRC = 2 * Math.PI * 38

  if (stage === 'camera') return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none">
      <SVGFilters />
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <button onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition">
          <X size={20} />
        </button>
        <button onClick={() => setAdvancedMode(v => !v)}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition text-[11px] font-bold ${advancedMode ? 'bg-amber-400/70 text-[#1a3c5e]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
          <span className="font-black">{advancedMode ? 'Camera' : 'All'}</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={toggleTorch}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition">
            {torchOn ? <Zap size={18} className="text-amber-400" /> : <ZapOff size={18} />}
          </button>
          <button onClick={() => { stopCam(); setFacingMode(f => f === 'user' ? 'environment' : 'user') }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {!advancedMode ? (
        <div className="flex-1 relative overflow-hidden min-h-0">
          {camErr ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <Camera size={52} className="text-white/20 mb-3" />
              <p className="text-white font-semibold text-lg">Camera unavailable</p>
              <p className="text-white/50 text-sm mt-1">Allow camera access in your browser, or use the gallery</p>
              <button onClick={() => fileRef.current.click()}
                className="mt-6 px-6 py-2.5 bg-white/10 border border-white/20 text-white text-sm font-bold rounded-full hover:bg-white/20 transition flex items-center gap-2">
                <ImageIcon size={16} /> Open Gallery
              </button>
            </div>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"
              style={{ ...effectStyle(effect), transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
          )}
          {recording && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm text-white text-sm font-black px-4 py-1.5 rounded-full shadow-xl">
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
              {fmtTime(recSecs)} · REC
            </div>
          )}
          {!recording && !camErr && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <div className="flex bg-black/50 backdrop-blur-sm rounded-full p-1 gap-1 border border-white/10">
                {['photo', 'video'].map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`px-5 py-1.5 rounded-full text-xs font-black transition-all capitalize ${mode === m ? 'bg-white text-[#1a3c5e] shadow' : 'text-white/60 hover:text-white'}`}>
                    {m === 'photo' ? '📷 Photo' : '🎬 Video'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-[#08101f] p-4">
          <div className="mx-auto w-full max-w-6xl rounded-3xl border border-white/10 bg-black/80 p-4 shadow-2xl">
            <Suspense fallback={<div className="flex items-center justify-center h-40"><Loader2 size={24} className="animate-spin text-white/50" /></div>}>
              <FilterStudio initialMode="camera" />
            </Suspense>
          </div>
        </div>
      )}

      {!camErr && !advancedMode && (
        <div className="bg-gradient-to-t from-black via-black/95 to-black/80">
          <EffectStrip active={effect} onChange={setEffect} thumbSrc={thumbSrc} />
        </div>
      )}

      <div className="bg-black pb-10 pt-5 px-8 flex items-center justify-between flex-shrink-0">
        <button onClick={() => fileRef.current.click()} className="flex flex-col items-center gap-1.5 group">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all">
            <ImageIcon size={22} className="text-white" />
          </div>
          <span className="text-white/50 text-[11px] font-semibold">Gallery</span>
        </button>

        <div className="flex flex-col items-center gap-2">
          <div className="relative w-[88px] h-[88px] flex items-center justify-center">
            {recording && (
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4"/>
                <circle cx="44" cy="44" r="38" fill="none" stroke="#ef4444" strokeWidth="4"
                  strokeLinecap="round" strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - Math.min(recSecs, 60) / 60)}
                  style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
            )}
            {mode === 'photo' && !recording ? (
              <button onClick={snapPhoto} disabled={camErr || !stream}
                className="w-20 h-20 rounded-full bg-white disabled:opacity-30 active:scale-90 transition-all duration-100 shadow-2xl ring-[3px] ring-white/30 flex items-center justify-center">
                <div className="w-[68px] h-[68px] rounded-full bg-white border-[3px] border-gray-200" />
              </button>
            ) : mode === 'video' && !recording ? (
              <button onClick={startRec} disabled={camErr || !stream}
                className="w-20 h-20 rounded-full disabled:opacity-30 active:scale-90 transition-all duration-100 shadow-2xl ring-[3px] ring-red-400/50 flex items-center justify-center"
                style={{ background: 'radial-gradient(circle, #ef4444 60%, #b91c1c 100%)' }}>
                <div className="w-8 h-8 rounded-full bg-white" />
              </button>
            ) : (
              <button onClick={stopRec}
                className="w-20 h-20 rounded-full bg-red-500 active:scale-90 transition-all duration-100 shadow-2xl ring-[3px] ring-red-300/50 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-md" />
              </button>
            )}
          </div>
          <span className="text-white/50 text-[11px] font-semibold">
            {recording ? 'Tap to stop' : mode === 'photo' ? 'Tap to snap' : 'Tap to record'}
          </span>
        </div>

        <button onClick={() => { stopCam(); setFacingMode(f => f === 'user' ? 'environment' : 'user') }}
          className="flex flex-col items-center gap-1.5 group" disabled={recording}>
          <div className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all disabled:opacity-30">
            <RefreshCw size={22} className="text-white" />
          </div>
          <span className="text-white/50 text-[11px] font-semibold">Flip</span>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="*" className="hidden" onChange={handleGallery} />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <SVGFilters />
      <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
        <button onClick={retake}
          className="flex items-center gap-1.5 text-white/80 hover:text-white transition text-sm font-bold">
          <ArrowLeft size={18} /> Retake
        </button>
        <button onClick={handlePost} disabled={!content.trim() && !captured}
          className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] text-sm font-black rounded-full disabled:opacity-40 transition">
          Post
        </button>
      </div>
      <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-black min-h-0">
        {captured?.type === 'video' ? (
          <video src={captured.url} className="w-full h-full object-contain"
            style={captured.effectCss ? { filter: captured.effectCss } : {}} controls playsInline loop />
        ) : captured?.type === 'image' ? (
          <img src={captured.url} alt="" className="w-full h-full object-contain" style={effectStyle(effect)} />
        ) : captured?.type === 'file' ? (
          <div className="text-center text-white/70 p-8">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ImageIcon size={32} className="text-white/40" />
            </div>
            <p className="font-semibold text-white truncate px-4">{captured.fileName}</p>
          </div>
        ) : null}
      </div>
      {captured?.type === 'image' && (
        <div className="bg-black/95 border-t border-white/5">
          <EffectStrip active={effect} onChange={setEffect} thumbSrc={captured.url} />
        </div>
      )}
      <div className="bg-[#080f1c] border-t border-white/10 px-4 py-4 flex-shrink-0">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-white/20">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Write a caption…" rows={2}
              className="w-full bg-transparent text-white placeholder-white/35 text-sm resize-none focus:outline-none leading-relaxed" />
            <button onClick={() => setIsPublic(v => !v)}
              className={`mt-2 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition ${
                isPublic ? 'border-blue-500/40 bg-blue-500/10 text-blue-300' : 'border-amber-400/40 bg-amber-400/10 text-amber-300'
              }`}>
              {isPublic ? <><Globe size={11} /> Public</> : <><Lock size={11} /> AMACOS Only</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

async function bakeEffect(srcUrl, css) {
  if (!css) return null
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth; c.height = img.naturalHeight
      const ctx = c.getContext('2d')
      ctx.filter = css
      ctx.drawImage(img, 0, 0)
      c.toBlob(b => resolve(b), 'image/jpeg', 0.92)
    }
    img.onerror = () => resolve(null)
    img.src = srcUrl
  })
}

// ── Comments Drawer ────────────────────────────────────────────────────────────
function CommentsDrawer({ open, onClose, post, currentUser }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const inputRef = useRef()
  const bottomRef = useRef()

  useEffect(() => {
    if (!open || !post?._id) return
    setLoading(true)
    axios.get(`/api/posts/${post._id}/comments`, { withCredentials: true })
      .then(r => setComments(r.data.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }, [open, post?._id])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 300) }, [open])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments])

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const { data } = await axios.post(`/api/posts/${post._id}/comments`, { text }, { withCredentials: true })
      setComments(prev => [...prev, data.comment])
      setText('')
    } catch { toast.error('Could not post comment.') }
    finally { setSending(false) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-[#1a3c5e]">Comments</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading && <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-[#1a3c5e]" /></div>}
          {!loading && comments.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No comments yet</p>
            </div>
          )}
          {comments.map((c, i) => (
            <div key={c._id || i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {c.author?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#1a3c5e]">{c.author?.fullName}</p>
                <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{c.text}</p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(c.createdAt)}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {currentUser && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3 flex-shrink-0 bg-white">
            <div className="w-8 h-8 rounded-full bg-[#1a3c5e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {currentUser.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2.5 border border-gray-100">
              <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Add a comment…"
                className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400" />
              <button onClick={send} disabled={!text.trim() || sending}
                className="text-[#1a3c5e] disabled:opacity-30 transition hover:opacity-70">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Share Modal ────────────────────────────────────────────────────────────────
function ShareModal({ open, onClose, post, currentUser }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [caption, setCaption] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelected(null); setCaption(''); setSearch('')
    setLoadingUsers(true)
    axios.get('/api/users/community', { withCredentials: true })
      .then(r => setUsers(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoadingUsers(false))
  }, [open])

  const sendShare = async () => {
    if (!selected || sending) return
    setSending(true)
    try {
      const authorName = post.author?.fullName || 'Someone'
      const postContent = post.content ? post.content.slice(0, 100) + (post.content.length > 100 ? '…' : '') : ''
      const shareText = [
        caption.trim() ? caption.trim() : null,
        `🔗 Shared a post from ${authorName}:`,
        postContent ? `"${postContent}"` : null,
        post.mediaUrl ? `[${post.mediaType === 'video' ? '🎬 Video' : '🖼️ Image'} attached]` : null,
      ].filter(Boolean).join('\n')

      await axios.post('/api/messages', {
        recipientId: selected._id,
        content: shareText,
        messageType: 'text',
      }, { withCredentials: true })

      toast.success(`Shared to ${selected.fullName.split(' ')[0]}!`)
      onClose()
    } catch (err) {
      if (err.response?.data?.code === 'FRIEND_REQUIRED') {
        toast.error('You need to be friends to share with this person.')
      } else {
        toast.error(err.response?.data?.message || 'Could not share.')
      }
    } finally { setSending(false) }
  }

  if (!open) return null

  const filtered = users.filter(u => u.fullName?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:w-96 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-[#1a3c5e] flex items-center gap-2"><Share2 size={16} /> Share Post</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Post preview */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <div className="flex gap-2 items-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {post?.author?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#1a3c5e]">{post?.author?.fullName}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{post?.content || (post?.mediaType === 'video' ? '🎬 Video post' : '🖼️ Image post')}</p>
            </div>
            {post?.mediaUrl && (
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                {post.mediaType === 'video'
                  ? <div className="w-full h-full flex items-center justify-center bg-[#1a3c5e]"><Film size={14} className="text-white" /></div>
                  : <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                }
              </div>
            )}
          </div>
        </div>

        {!selected ? (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…"
                  className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400" autoFocus />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loadingUsers && <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#1a3c5e]" /></div>}
              {filtered.map(u => (
                <button key={u._id} onClick={() => setSelected(u)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {u.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{u.fullName}</p>
                    <p className="text-xs text-gray-400 capitalize">{u.accountType === 'staff' ? 'Staff' : `Student${u.level ? ` · ${u.level}L` : ''}`}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col p-4 gap-3">
            <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-[#1a3c5e] font-bold">
              <ArrowLeft size={15} /> Back
            </button>
            <div className="flex items-center gap-3 bg-[#1a3c5e]/5 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {selected.fullName?.charAt(0).toUpperCase()}
              </div>
              <p className="font-semibold text-[#1a3c5e]">{selected.fullName}</p>
            </div>
            <textarea value={caption} onChange={e => setCaption(e.target.value)}
              placeholder="Add a message (optional)…" rows={3}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none text-gray-700 resize-none" />
            <button onClick={sendShare} disabled={sending}
              className="w-full py-3 bg-[#1a3c5e] hover:bg-[#152f4a] text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2">
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
              {sending ? 'Sharing…' : `Share to ${selected.fullName.split(' ')[0]}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── DM Panel ───────────────────────────────────────────────────────────────────
function DMPanel({ open, onClose, currentUser }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [friendStatus, setFriendStatus] = useState('none')
  const [iAmSender, setIAmSender] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [friendRequestId, setFriendRequestId] = useState(null)
  const [sendingFR, setSendingFR] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [mediaFile, setMediaFile] = useState(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const inputRef = useRef()
  const bottomRef = useRef()
  const fileRef = useRef()

  useEffect(() => {
    if (!open) return
    setLoadingUsers(true)
    axios.get('/api/users/community', { withCredentials: true })
      .then(r => setUsers(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoadingUsers(false))
  }, [open])

  useEffect(() => {
    if (!selected) return
    setLoadingMsgs(true)
    setMessages([]); setFriendStatus('none'); setIAmSender(false); setSentCount(0); setFriendRequestId(null)
    axios.get(`/api/messages/${selected._id}`, { withCredentials: true })
      .then(r => {
        setMessages(r.data.messages || [])
        setFriendStatus(r.data.friendStatus || 'none')
        setSentCount(r.data.sentCount || 0)
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false))

    if (selected._id !== currentUser._id) {
      axios.get(`/api/friends/status/${selected._id}`, { withCredentials: true })
        .then(r => {
          setFriendStatus(r.data.status || 'none')
          setFriendRequestId(r.data.requestId || null)
          setIAmSender(r.data.isSender || false)
        })
        .catch(() => {})
    }
  }, [selected])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (selected) setTimeout(() => inputRef.current?.focus(), 200) }, [selected])

  const isSelf = selected && selected._id === currentUser._id
  const canMessage = isSelf || friendStatus === 'accepted' || (friendStatus !== 'accepted' && sentCount < 3)
  const remaining = isSelf ? null : (friendStatus !== 'accepted' ? Math.max(0, 3 - sentCount) : null)

  const sendMsg = async (overrideContent = null, msgType = 'text', stickerId = null) => {
    const body = overrideContent ?? text.trim()
    if ((!body && !mediaFile) || sending || !selected) return
    setSending(true)
    const opt = {
      _id: `tmp-${Date.now()}`,
      content: body,
      messageType: stickerId ? 'sticker' : msgType,
      stickerId: stickerId || '',
      sender: { _id: currentUser._id },
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, opt])
    if (!stickerId) setText('')
    setShowEmoji(false)
    try {
      const fd = new FormData()
      fd.append('recipientId', selected._id)
      if (body) fd.append('content', body)
      fd.append('messageType', stickerId ? 'sticker' : msgType)
      if (stickerId) fd.append('stickerId', stickerId)
      if (mediaFile) {
        fd.append('media', mediaFile)
        setUploadingMedia(true)
      }
      const { data } = await axios.post('/api/messages', fd, {
        withCredentials: true,
        headers: mediaFile ? { 'Content-Type': 'multipart/form-data' } : {},
        timeout: mediaFile ? 120000 : 15000,
      })
      setMessages(prev => prev.map(m => m._id === opt._id ? data.message : m))
      setMediaFile(null)
      if (friendStatus !== 'accepted' && !isSelf) setSentCount(c => c + 1)
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not send message.'
      const code = err.response?.data?.code
      if (code === 'FRIEND_REQUIRED') {
        toast.error('Send a friend request to continue messaging.')
      } else {
        toast.error(msg)
      }
      setMessages(prev => prev.filter(m => m._id !== opt._id))
    } finally { setSending(false); setUploadingMedia(false) }
  }

  const sendFriendRequest = async () => {
    if (!selected || sendingFR) return
    setSendingFR(true)
    try {
      const { data } = await axios.post('/api/friends/request', { recipientId: selected._id }, { withCredentials: true })
      setFriendStatus('pending')
      setIAmSender(true)
      setFriendRequestId(data.request?._id)
      toast.success('Friend request sent!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send request.')
    } finally { setSendingFR(false) }
  }

  const acceptFriendRequest = async () => {
    if (!friendRequestId) return
    try {
      await axios.put(`/api/friends/accept/${friendRequestId}`, {}, { withCredentials: true })
      setFriendStatus('accepted')
      setIAmSender(false)
      setSentCount(0)
      toast.success(`You and ${selected.fullName.split(' ')[0]} are now friends! 🎉`)
    } catch { toast.error('Could not accept request.') }
  }

  const rejectFriendRequest = async () => {
    if (!friendRequestId) return
    try {
      await axios.put(`/api/friends/reject/${friendRequestId}`, {}, { withCredentials: true })
      setFriendStatus('rejected')
      setFriendRequestId(null)
      setIAmSender(false)
    } catch { toast.error('Could not reject request.') }
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    const isVid = f.type.startsWith('video/')
    const max = isVid ? 100 : 50
    if (f.size > max * 1024 * 1024) { toast.error(`File must be under ${max} MB.`); return }
    setMediaFile(f)
    e.target.value = ''
  }

  const onEmoji = useCallback((em) => { setText(t => t + em) }, [])
  const onSticker = useCallback((s) => { sendMsg(s.text, 'sticker', s.id) }, [selected, sending])
  const onSendCustomSticker = useCallback((file) => {
    setMediaFile(file)
    setShowEmoji(false)
    // trigger send immediately with the file
    setTimeout(() => {
      const fd = new FormData()
      fd.append('recipientId', selected._id)
      fd.append('messageType', 'media')
      fd.append('media', file)
      setSending(true)
      const opt = { _id: `tmp-${Date.now()}`, content: '', messageType: 'media', mediaType: 'image', sender: { _id: currentUser._id }, createdAt: new Date().toISOString() }
      setMessages(prev => [...prev, opt])
      axios.post('/api/messages', fd, { withCredentials: true, timeout: 60000 })
        .then(({ data }) => setMessages(prev => prev.map(m => m._id === opt._id ? data.message : m)))
        .catch(() => { toast.error('Could not send sticker.'); setMessages(prev => prev.filter(m => m._id !== opt._id)) })
        .finally(() => { setSending(false); setMediaFile(null) })
    }, 0)
  }, [selected, currentUser])

  const filtered = users.filter(u => u.fullName?.toLowerCase().includes(search.toLowerCase()))

  if (!open) return null

  const friendLabel = () => {
    if (isSelf) return null
    if (friendStatus === 'accepted') return <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><UserCheck size={12}/> Friends</span>
    if (friendStatus === 'pending' && iAmSender) return <span className="flex items-center gap-1 text-amber-500 text-xs font-bold"><Clock size={12}/> Request sent</span>
    if (friendStatus === 'pending' && !iAmSender) return <span className="flex items-center gap-1 text-blue-500 text-xs font-bold"><UserPlus size={12}/> Wants to connect</span>
    return null
  }

  // They sent ME a request (they are sender, I'm recipient)
  const theyRequestedMe = friendStatus === 'pending' && !isSelf && !iAmSender
  // I sent them a request and it's still pending
  const iSentRequest = friendStatus === 'pending' && !isSelf && iAmSender

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-end sm:justify-end sm:p-4">
      <div className="absolute inset-0 sm:bg-transparent bg-black/50" onClick={!selected ? onClose : undefined} />
      <div className="relative w-full sm:w-80 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: '76vh' }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ background: 'linear-gradient(135deg,#0d1f35,#1a3c5e)' }}>
          {selected && (
            <button onClick={() => { setSelected(null); setShowEmoji(false) }}
              className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white rounded-full hover:bg-white/10 transition">
              <ArrowLeft size={17} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-white text-sm truncate">{selected ? selected.fullName : 'Messages'}</p>
              {selected && friendLabel()}
            </div>
            {selected && <p className="text-xs text-blue-300 capitalize">{isSelf ? 'Note to self' : selected.accountType}</p>}
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white rounded-full hover:bg-white/10 transition">
            <X size={17} />
          </button>
        </div>

        {!selected ? (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…"
                  className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loadingUsers && <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#1a3c5e]" /></div>}
              {!loadingUsers && filtered.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm"><div className="text-3xl mb-2">💬</div>No members found</div>
              )}
              {filtered.map(u => {
                const isMe = u._id === currentUser._id
                return (
                  <button key={u._id} onClick={() => setSelected(u)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${isMe ? 'bg-gradient-to-br from-amber-400 to-amber-500' : 'bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e]'}`}>
                      {u.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {u.fullName}{isMe ? ' (You)' : ''}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{u.accountType === 'staff' ? 'Staff' : `Student${u.level ? ` · ${u.level}L` : ''}`}</p>
                    </div>
                    {isMe && <span className="text-xs text-amber-500 font-bold flex-shrink-0">📝 Notes</span>}
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            {/* Add friend banner — no relationship yet */}
            {!isSelf && (friendStatus === 'none' || friendStatus === 'rejected') && (
              <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between flex-shrink-0">
                <p className="text-xs text-blue-700 font-medium">Add as friend for unlimited chat</p>
                <button onClick={sendFriendRequest} disabled={sendingFR}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-full transition">
                  {sendingFR ? <Loader2 size={10} className="animate-spin" /> : <UserPlus size={10} />}
                  Add Friend
                </button>
              </div>
            )}

            {/* I sent a request — waiting for them */}
            {iSentRequest && (
              <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2 flex-shrink-0">
                <Clock size={12} className="text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-medium">Friend request sent — waiting for {selected.fullName.split(' ')[0]} to accept</p>
              </div>
            )}

            {/* They sent ME a request — show accept/decline */}
            {theyRequestedMe && (
              <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between flex-shrink-0">
                <p className="text-xs text-emerald-700 font-medium">{selected.fullName.split(' ')[0]} wants to be friends 👋</p>
                <div className="flex gap-1.5">
                  <button onClick={acceptFriendRequest}
                    className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 rounded-full transition">
                    Accept
                  </button>
                  <button onClick={rejectFriendRequest}
                    className="text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition">
                    Decline
                  </button>
                </div>
              </div>
            )}

            {/* Message limit bar */}
            {!isSelf && friendStatus !== 'accepted' && remaining !== null && remaining <= 3 && (
              <div className={`px-4 py-2 flex items-center gap-2 flex-shrink-0 ${remaining === 0 ? 'bg-red-50 border-b border-red-100' : 'bg-amber-50 border-b border-amber-100'}`}>
                <AlertCircle size={12} className={remaining === 0 ? 'text-red-400' : 'text-amber-500'} />
                <p className={`text-xs font-medium ${remaining === 0 ? 'text-red-600' : 'text-amber-700'}`}>
                  {remaining === 0
                    ? '🔒 Intro limit reached — accept the friend request to keep chatting'
                    : remaining === 1
                    ? '⚡ Last intro message — send a friend request to keep chatting after this'
                    : `💬 ${remaining} intro messages left — add each other as friends for unlimited chat`}
                </p>
              </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50">
              {loadingMsgs && <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-[#1a3c5e]" /></div>}
              {!loadingMsgs && messages.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  {isSelf ? '📝 Your private notes' : 'Say hello 👋'}
                </div>
              )}
              {messages.map((m, i) => {
                const mine = (m.sender?._id || m.sender) === currentUser._id
                const isSticker = m.messageType === 'sticker'
                const isMedia = m.messageType === 'media'
                return (
                  <div key={m._id || i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    {isSticker ? (
                      <div className={`max-w-[60%] px-3 py-2 rounded-2xl text-center text-sm leading-snug font-bold whitespace-pre-line ${mine ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-100 shadow-sm'}`}>
                        {m.content}
                      </div>
                    ) : isMedia ? (
                      <div className={`max-w-[78%] rounded-2xl overflow-hidden ${mine ? 'rounded-br-md' : 'rounded-bl-md shadow-sm'}`}>
                        {m.mediaType === 'image' ? (
                          <img src={m.mediaUrl} alt={m.mediaName || 'image'} className="max-w-full rounded-2xl cursor-pointer" onClick={() => window.open(m.mediaUrl, '_blank')} />
                        ) : m.mediaType === 'video' ? (
                          <video src={m.mediaUrl} controls playsInline className="max-w-full rounded-2xl" />
                        ) : (
                          <a href={m.mediaUrl} target="_blank" rel="noreferrer"
                            className={`flex items-center gap-2 px-4 py-3 text-sm ${mine ? 'bg-[#1a3c5e] text-white' : 'bg-white text-gray-800 border border-gray-100'}`}>
                            <FileIcon size={16} /> {m.mediaName || 'File'}
                          </a>
                        )}
                        {m.content && (
                          <div className={`px-3 py-1.5 text-xs ${mine ? 'bg-[#1a3c5e] text-white/80' : 'bg-white text-gray-600'}`}>
                            {m.content}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        mine ? 'bg-[#1a3c5e] text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                      }`}>
                        {m.content}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Media preview */}
            {mediaFile && (
              <div className="px-3 py-2 bg-amber-50 border-t border-amber-100 flex items-center gap-2 flex-shrink-0">
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  {mediaFile.type.startsWith('image/') ? <ImageIcon size={14} className="text-amber-600" />
                    : mediaFile.type.startsWith('video/') ? <Film size={14} className="text-amber-600" />
                    : <FileIcon size={14} className="text-amber-600" />}
                  <span className="text-xs text-amber-700 truncate font-medium">{mediaFile.name}</span>
                </div>
                <button onClick={() => setMediaFile(null)} className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-200 text-amber-700 hover:bg-amber-300 transition flex-shrink-0">
                  <X size={10} />
                </button>
              </div>
            )}

            {/* Input area */}
            <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0 bg-white relative">
              {showEmoji && (
                <EmojiPicker
                  onEmoji={onEmoji}
                  onSticker={onSticker}
                  onSendCustomSticker={onSendCustomSticker}
                  onClose={() => setShowEmoji(false)}
                />
              )}
              <div className="flex items-center gap-2">
                <button onClick={() => setShowEmoji(v => !v)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition flex-shrink-0 ${showEmoji ? 'bg-amber-100 text-amber-500' : 'text-gray-400 hover:bg-gray-100'}`}>
                  <Smile size={18} />
                </button>
                <button onClick={() => fileRef.current?.click()}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition flex-shrink-0">
                  <Paperclip size={17} />
                </button>
                <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && canMessage && sendMsg()}
                  placeholder={
                    !canMessage
                      ? 'Add friend to continue…'
                      : isSelf
                      ? 'Write a note…'
                      : `Message ${selected.fullName.split(' ')[0]}…`
                  }
                  disabled={!canMessage}
                  className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-sm focus:outline-none text-gray-700 border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" />
                <button onClick={() => sendMsg()} disabled={(!text.trim() && !mediaFile) || sending || !canMessage || uploadingMedia}
                  className="w-10 h-10 bg-[#1a3c5e] rounded-full flex items-center justify-center text-white disabled:opacity-40 hover:bg-[#152f4a] transition flex-shrink-0">
                  {sending || uploadingMedia ? <Loader2 size={14} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip" />
          </>
        )}
      </div>
    </div>
  )
}

// ── Post Card ──────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, onDelete, onLike, onOpenComments, onShare }) {
  const [showMenu, setShowMenu] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [likePop, setLikePop] = useState(false)
  const menuRef = useRef()
  const isOwn = (post.author?._id || post.author) === currentUser?._id
  const liked = currentUser && post.likes?.some(l => (l._id || l) === currentUser._id)
  const initial = post.author?.fullName?.charAt(0).toUpperCase()
  const commentCount = post.comments?.length || 0
  const MAX = 160
  const isLong = (post.content?.length || 0) > MAX

  const handleLike = () => {
    if (!currentUser) return
    setLikePop(true); setTimeout(() => setLikePop(false), 500)
    onLike(post._id)
  }

  useEffect(() => {
    if (!showMenu) return
    const h = (e) => { if (!menuRef.current?.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showMenu])

  return (
    <article className="border-b border-white/5 w-full">
      {post.mediaUrl && (
        <div className="relative w-full bg-black overflow-hidden">
          {post.mediaType === 'video'
            ? <video src={post.mediaUrl} className="w-full max-h-[560px] object-contain" controls playsInline />
            : <img src={post.mediaUrl} alt="" className="w-full max-h-[560px] object-cover" loading="lazy" />
          }
          <span className={`absolute top-3 right-3 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-md ${
            post.isPublic ? 'bg-black/40 text-white' : 'bg-amber-400/90 text-[#1a2a3a]'
          }`}>
            {post.isPublic ? <Globe size={10} /> : <Lock size={10} />}
            {post.isPublic ? 'Public' : 'AMACOS'}
          </span>
          {currentUser && (
            <button onClick={() => onShare(post)}
              className="absolute top-3 left-3 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition">
              <Share2 size={10} /> Share
            </button>
          )}
        </div>
      )}

      <div className="px-4 pt-3 pb-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initial}
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">{post.author?.fullName}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                <span>{timeAgo(post.createdAt)}</span>
                {!post.mediaUrl && (<>
                  <span>·</span>
                  {post.isPublic
                    ? <span className="flex items-center gap-0.5"><Globe size={10} /> Public</span>
                    : <span className="flex items-center gap-0.5 text-amber-500"><Lock size={10} /> AMACOS</span>
                  }
                </>)}
              </div>
            </div>
          </div>

          {isOwn && (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(v => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-500 transition">
                <MoreHorizontal size={18} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-[#0d1f35] border border-white/10 rounded-2xl shadow-xl z-20 overflow-hidden w-36">
                  <button onClick={() => { onDelete(post._id); setShowMenu(false) }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition">
                    <Trash2 size={14} /> Delete post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {post.content && (
          <div className="mb-3">
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
              {isLong && !expanded ? post.content.slice(0, MAX) + '…' : post.content}
            </p>
            {isLong && (
              <button onClick={() => setExpanded(v => !v)} className="text-xs font-bold text-blue-400 mt-1">
                {expanded ? 'less' : 'more'}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
          <div className="flex items-center gap-1">
            <button onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold transition-all duration-200 ${
                liked ? 'text-rose-400 bg-rose-500/10' : 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/5'
              } ${likePop ? 'scale-125' : 'scale-100'}`}>
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} strokeWidth={liked ? 0 : 2} />
              <span>{fmtNum(post.likes?.length)}</span>
            </button>
            <button onClick={() => onOpenComments(post)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold text-gray-500 hover:text-blue-300 hover:bg-blue-500/5 transition">
              <MessageCircle size={18} />
              <span>{fmtNum(commentCount)}</span>
            </button>
            {currentUser && (
              <button onClick={() => onShare(post)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold text-gray-500 hover:text-blue-300 hover:bg-blue-500/5 transition">
                <Share2 size={18} />
              </button>
            )}
          </div>
          <button onClick={() => setBookmarked(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold transition ${
              bookmarked ? 'text-amber-400 bg-amber-400/10' : 'text-gray-500 hover:text-amber-400 hover:bg-amber-400/5'
            }`}>
            <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
            {bookmarked && <Check size={13} />}
          </button>
        </div>
      </div>
    </article>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function SocialFeed({ topOffset = 'top-0', hideHeader = false }) {
  const { user, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [tab, setTab] = useState('all')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [dmOpen, setDmOpen] = useState(false)
  const [commentPost, setCommentPost] = useState(null)
  const [sharePost, setSharePost] = useState(null)
  const pageRef = useRef(1)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(false)
  const sentinelRef = useRef()

  const displayPosts = tab === 'amacos' ? posts.filter(p => !p.isPublic) : posts

  const loadPosts = useCallback(async (attempt = 0) => {
    setLoading(true)
    setFetchError(false)
    pageRef.current = 1
    const url = user ? '/api/posts?page=1&limit=12' : '/api/posts/public?page=1&limit=12'
    try {
      const res = await axios.get(url)
      setPosts(res.data.posts || [])
      hasMoreRef.current = res.data.hasMore || false
      setHasMore(res.data.hasMore || false)
      setLoading(false)
    } catch {
      if (attempt < 4) {
        // Server cold start — keep skeleton visible, silently retry
        await new Promise(r => setTimeout(r, 6000))
        return loadPosts(attempt + 1)
      }
      setFetchError(true)
      setLoading(false)
      toast.error('Server is not responding. Please try again in a minute.')
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    loadPosts()
  }, [authLoading, loadPosts])

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || !hasMoreRef.current || loadingMoreRef.current) return
      loadingMoreRef.current = true
      setLoadingMore(true)
      const nextPage = pageRef.current + 1
      const url = user ? `/api/posts?page=${nextPage}&limit=12` : `/api/posts/public?page=${nextPage}&limit=12`
      axios.get(url)
        .then(res => {
          const newPosts = res.data.posts || []
          if (newPosts.length > 0) {
            setPosts(prev => [...prev, ...newPosts])
            pageRef.current = nextPage
          }
          hasMoreRef.current = res.data.hasMore || false
          setHasMore(res.data.hasMore || false)
        })
        .catch(() => {})
        .finally(() => { loadingMoreRef.current = false; setLoadingMore(false) })
    }, { threshold: 0.5 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [user])

  const handlePost = (p) => setPosts(prev => [p, ...prev])

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/posts/${id}`, { withCredentials: true })
      setPosts(prev => prev.filter(p => p._id !== id))
      toast.success('Deleted.')
    } catch { toast.error('Failed to delete.') }
  }

  const handleLike = async (id) => {
    if (!user) return
    try {
      const { data } = await axios.put(`/api/posts/${id}/like`, {}, { withCredentials: true })
      setPosts(prev => prev.map(p => p._id === id
        ? { ...p, likes: data.liked ? [...(p.likes || []), user._id] : (p.likes || []).filter(l => (l._id || l) !== user._id) }
        : p
      ))
    } catch { toast.error('Failed to update like.') }
  }

  return (
    <div className="relative min-h-full bg-[#060d1a]">

      {/* ── Sticky top bar — hidden inside the app (MainLayout already has a header) ── */}
      {!hideHeader && (
        <div className={`sticky ${topOffset} z-20 bg-[#060d1a]/95 backdrop-blur-md border-b border-white/5`}>
          <div className="px-4 pt-3 pb-0 flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e] flex items-center justify-center">
                <span className="text-white text-xs font-black">A</span>
              </div>
              <h1 className="font-black text-white text-lg tracking-tight">AMACOS Feed</h1>
            </div>
            {user && (
              <button onClick={() => setDmOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-white/5 text-gray-400 hover:text-white transition">
                <MessageCircle size={21} />
              </button>
            )}
          </div>
          <div className="px-4 flex gap-6 mt-1 max-w-2xl mx-auto">
            {[['all', 'For You'], ['amacos', 'AMACOS Only']].map(([val, label]) => (
              <button key={val} onClick={() => setTab(val)}
                className={`text-sm font-bold pb-2.5 border-b-2 transition-all ${
                  tab === val ? 'text-white border-white' : 'text-gray-600 border-transparent hover:text-gray-400'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Feed ── */}
      <div className="pb-28 max-w-2xl mx-auto">
        {loading && [...Array(3)].map((_, i) => (
          <div key={i} className="border-b border-white/5 animate-pulse">
            <div className="h-52 bg-white/5" />
            <div className="p-4 space-y-2">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10" />
                <div className="flex-1 space-y-1.5 pt-1">
                  <div className="h-3 bg-white/10 rounded-full w-32" />
                  <div className="h-2.5 bg-white/5 rounded-full w-20" />
                </div>
              </div>
              <div className="h-3 bg-white/5 rounded-full w-full" />
              <div className="h-3 bg-white/5 rounded-full w-3/4" />
            </div>
          </div>
        ))}

        {!loading && fetchError && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <p className="font-bold text-white">Couldn't load posts</p>
            <p className="text-sm text-gray-500 mt-1">The server may be waking up. Please try again.</p>
            <button onClick={loadPosts}
              className="mt-4 px-5 py-2 bg-white/10 text-white text-sm font-bold rounded-xl hover:bg-white/20 transition flex items-center gap-2 mx-auto">
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        )}

        {!loading && !fetchError && displayPosts.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <Camera size={28} className="text-gray-600" />
            </div>
            <p className="font-bold text-gray-400">Nothing here yet</p>
            <p className="text-sm text-gray-600 mt-1">
              {user ? (tab === 'amacos' ? 'No AMACOS-only posts yet.' : 'Be the first to post!') : 'Sign in to start posting.'}
            </p>
          </div>
        )}

        {!loading && !fetchError && displayPosts.map(post => (
          <PostCard key={post._id} post={post} currentUser={user}
            onDelete={handleDelete} onLike={handleLike}
            onOpenComments={setCommentPost}
            onShare={setSharePost} />
        ))}

        {!user && posts.length > 0 && (
          <div className="px-4">
            <SignInPrompt feature="posting, liking and full interaction" />
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 size={20} className="animate-spin text-gray-600" />
          </div>
        )}
        {!hasMore && !loading && !fetchError && posts.length > 3 && (
          <p className="text-center text-xs text-gray-700 py-4 pb-8">You're all caught up ✓</p>
        )}
      </div>

      {/* ── FAB ── */}
      {user && (
        <button onClick={() => setCameraOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-amber-400 hover:bg-amber-300 text-[#0d1f35] rounded-full shadow-2xl shadow-amber-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          title="Create post">
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {/* ── Overlays ── */}
      <CameraModal open={cameraOpen} onClose={() => setCameraOpen(false)} user={user} onPost={handlePost} />
      <CommentsDrawer open={!!commentPost} onClose={() => setCommentPost(null)} post={commentPost} currentUser={user} />
      {user && <DMPanel open={dmOpen} onClose={() => setDmOpen(false)} currentUser={user} />}
      {user && <ShareModal open={!!sharePost} onClose={() => setSharePost(null)} post={sharePost} currentUser={user} />}
    </div>
  )
}
