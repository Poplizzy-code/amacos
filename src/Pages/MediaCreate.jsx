import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  Tv2, Radio, Newspaper, BookOpen, Upload, X, Loader2,
  Image as ImageIcon, FileVideo, Mic, ArrowLeft, Send, Save
} from 'lucide-react'

const PLATFORMS = [
  { id: 'tv',        label: 'TV',        icon: Tv2,       accept: 'video/*',                          color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30' },
  { id: 'radio',     label: 'Radio',     icon: Radio,     accept: 'audio/*,.mp3,.wav,.aac,.ogg,.m4a', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
  { id: 'newspaper', label: 'Newspaper', icon: Newspaper, accept: null,                               color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/30' },
  { id: 'magazine',  label: 'Magazine',  icon: BookOpen,  accept: null,                               color: 'text-emerald-400',bg: 'bg-emerald-400/10',border: 'border-emerald-400/30' },
]

const CATEGORIES = {
  tv:        ['News Bulletin', 'Documentary', 'Talk Show', 'Campus Life', 'Sports', 'Entertainment'],
  radio:     ['Podcast', 'Live Show', 'News', 'Music Programme', 'Talk Show', 'Sports'],
  newspaper: ['Breaking News', 'Opinion', 'Campus Life', 'Sports', 'Arts & Culture', 'Investigation'],
  magazine:  ['Cover Story', 'Feature', 'Profile', 'Opinion', 'Arts & Culture', 'Lifestyle'],
}

export default function MediaCreate({ isApp = false }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const base = isApp ? '/app' : ''

  const params   = new URLSearchParams(location.search)
  const initPlatform = params.get('platform') || 'newspaper'
  const initChannel  = params.get('channel')  || ''

  const [platform, setPlatform] = useState(initPlatform)
  const [channels, setChannels] = useState([])
  const [form, setForm] = useState({
    title: '', description: '', body: '', category: '', tags: '',
    channel: initChannel, liveUrl: '', liveScheduledAt: '',
  })
  const [mediaFile, setMediaFile]       = useState(null)
  const [thumbnail, setThumbnail]       = useState(null)
  const [thumbPreview, setThumbPreview] = useState('')
  const [saving, setSaving]             = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [contentId, setContentId]       = useState(null)
  const [step, setStep]                 = useState('form') // 'form' | 'upload' | 'done'
  const mediaRef = useRef(); const thumbRef = useRef()

  const plt = PLATFORMS.find(p => p.id === platform)
  const needsMedia = platform === 'tv' || platform === 'radio'

  useEffect(() => {
    if (!user || !['publisher', 'editor', 'chief-editor'].includes(user.mediaRole)) {
      navigate(`${base}/media`)
    }
  }, [user])

  useEffect(() => {
    if (platform === 'tv' || platform === 'radio') {
      axios.get(`/api/media/channels?platform=${platform}&limit=50`)
        .then(res => setChannels(res.data.channels || []))
        .catch(() => {})
    } else { setChannels([]) }
  }, [platform])

  const setThumb = (file) => {
    setThumbnail(file)
    if (file) setThumbPreview(URL.createObjectURL(file))
    else { URL.revokeObjectURL(thumbPreview); setThumbPreview('') }
  }

  const saveDraft = async () => {
    if (!form.title.trim()) return toast.error('Title is required.')
    setSaving(true)
    try {
      const payload = { ...form, platform, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] }
      const { data } = await axios.post('/api/media/content', payload, { withCredentials: true })
      setContentId(data.item._id)
      if (needsMedia || thumbnail) { setStep('upload') } else { setStep('done') }
      toast.success('Draft saved!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save.') }
    finally { setSaving(false) }
  }

  const uploadFiles = async () => {
    if (!contentId) return
    setSaving(true)
    try {
      if (mediaFile) {
        const fd = new FormData(); fd.append('media', mediaFile)
        await axios.post(`/api/media/content/${contentId}/upload-media`, fd, { withCredentials: true, timeout: 600000 })
        toast.success('Media uploaded!')
      }
      if (thumbnail) {
        const fd = new FormData(); fd.append('thumbnail', thumbnail)
        await axios.post(`/api/media/content/${contentId}/upload-thumbnail`, fd, { withCredentials: true })
      }
      setStep('done')
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed. Try again.') }
    finally { setSaving(false) }
  }

  const submit = async () => {
    const id = contentId
    if (!id) return toast.error('Save draft first.')
    setSubmitting(true)
    try {
      await axios.post(`/api/media/content/${id}/submit`, {}, { withCredentials: true })
      toast.success(user.mediaRole === 'chief-editor' ? 'Published!' : 'Submitted for review!')
      navigate(`${base}/media/content/${id}`)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit.') }
    finally { setSubmitting(false) }
  }

  return (
    <div className={`${isApp ? '-m-4 lg:-m-6' : ''} min-h-screen bg-[#060d1a]`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="text-white font-black text-xl">Create Content</h1>
            <p className="text-gray-500 text-xs capitalize">{user?.mediaRole} · {plt?.label}</p>
          </div>
        </div>

        {/* Platform selector */}
        {step === 'form' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => { setPlatform(p.id); setForm(f => ({ ...f, category: '', channel: '' })) }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition ${platform === p.id ? `${p.bg} ${p.border}` : 'border-white/10 hover:border-white/20'}`}>
                <div className={`w-10 h-10 ${p.bg} rounded-xl flex items-center justify-center`}><p.icon size={20} className={p.color} /></div>
                <span className={`text-xs font-bold ${platform === p.id ? p.color : 'text-gray-400'}`}>{p.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        {step === 'form' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Enter title…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/40 text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-[#0d1f35] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400/40">
                  <option value="">— Select category —</option>
                  {(CATEGORIES[platform] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {channels.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Channel (optional)</label>
                  <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                    className="w-full bg-[#0d1f35] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400/40">
                    <option value="">— No channel —</option>
                    {channels.map(ch => <option key={ch._id} value={ch._id}>{ch.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                placeholder="Brief summary…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/40 text-sm resize-none" />
            </div>
            {(platform === 'newspaper' || platform === 'magazine') && (
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Article Body</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={14}
                  placeholder="Write your article here…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/40 text-sm resize-y font-mono leading-relaxed" />
              </div>
            )}
            {(platform === 'tv' || platform === 'radio') && (
              <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Live Broadcast (optional)</p>
                <input value={form.liveUrl} onChange={e => setForm(f => ({ ...f, liveUrl: e.target.value }))}
                  placeholder="YouTube Live URL (e.g. https://youtube.com/watch?v=...)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/40 text-sm" />
                <input type="datetime-local" value={form.liveScheduledAt} onChange={e => setForm(f => ({ ...f, liveScheduledAt: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400/40 text-sm" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Tags (comma-separated)</label>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="journalism, media, campus"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/40 text-sm" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveDraft} disabled={saving || !form.title.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-bold rounded-xl transition disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
            </div>
          </div>
        )}

        {/* Upload step */}
        {step === 'upload' && (
          <div className="space-y-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-white font-bold mb-1">{form.title}</p>
              <p className="text-gray-400 text-sm">{plt?.label} · {form.category}</p>
            </div>

            {/* Media upload */}
            {needsMedia && (
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
                  {platform === 'tv' ? 'Video File *' : 'Audio File *'}
                </label>
                <div onClick={() => mediaRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${mediaFile ? `${plt?.border} ${plt?.bg}` : 'border-white/10 hover:border-white/20'}`}>
                  {mediaFile
                    ? <div className="flex items-center justify-center gap-3 min-w-0">
                        {platform === 'tv' ? <FileVideo size={22} className="text-red-400 flex-shrink-0" /> : <Mic size={22} className="text-purple-400 flex-shrink-0" />}
                        <span className="text-white text-sm font-medium truncate">{mediaFile.name}</span>
                        <button type="button" onClick={e => { e.stopPropagation(); setMediaFile(null); mediaRef.current.value = '' }}><X size={16} className="text-gray-400" /></button>
                      </div>
                    : <>
                        {platform === 'tv' ? <FileVideo size={32} className="mx-auto mb-3 text-gray-500" /> : <Mic size={32} className="mx-auto mb-3 text-gray-500" />}
                        <p className="text-gray-400 text-sm">Click to select {platform === 'tv' ? 'video' : 'audio'} file</p>
                        <p className="text-gray-600 text-xs mt-1">{platform === 'tv' ? 'MP4, MOV, AVI — max 500MB' : 'MP3, WAV, AAC — max 100MB'}</p>
                      </>
                  }
                </div>
                <input ref={mediaRef} type="file" accept={plt?.accept} className="hidden" onChange={e => setMediaFile(e.target.files[0] || null)} />
              </div>
            )}

            {/* Thumbnail */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
                {platform === 'newspaper' || platform === 'magazine' ? 'Cover Image' : 'Thumbnail / Cover Art'} (optional)
              </label>
              <div onClick={() => thumbRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-2xl overflow-hidden cursor-pointer transition relative"
                style={{ minHeight: thumbPreview ? undefined : '120px' }}>
                {thumbPreview
                  ? <div className="relative">
                      <img src={thumbPreview} alt="thumbnail" className="w-full h-48 object-cover" />
                      <button type="button" onClick={e => { e.stopPropagation(); setThumb(null) }}
                        className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-lg hover:bg-black/80"><X size={14} /></button>
                    </div>
                  : <div className="flex flex-col items-center justify-center py-8">
                      <ImageIcon size={28} className="mb-2 text-gray-500" />
                      <p className="text-gray-400 text-sm">Click to add cover image</p>
                    </div>
                }
              </div>
              <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={e => setThumb(e.target.files[0] || null)} />
            </div>

            <div className="flex gap-2">
              <button onClick={uploadFiles} disabled={saving || (needsMedia && !mediaFile)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-bold rounded-xl transition disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {saving ? 'Uploading…' : 'Upload Files'}
              </button>
              {!needsMedia && (
                <button onClick={() => setStep('done')} className="px-4 py-2.5 text-gray-400 hover:text-white text-sm rounded-xl transition">Skip</button>
              )}
            </div>
          </div>
        )}

        {/* Done step — ready to submit */}
        {step === 'done' && (
          <div className="space-y-5">
            <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-2xl p-5">
              <p className="text-emerald-400 font-bold mb-1">Content ready!</p>
              <p className="text-gray-400 text-sm">{form.title}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-gray-400 leading-relaxed">
              {user?.mediaRole === 'chief-editor'
                ? 'As chief editor, submitting will publish this content immediately.'
                : 'Submitting will send this for editorial review. You\'ll be notified when it\'s approved or if changes are needed.'}
            </div>
            <div className="flex gap-2">
              <button onClick={submit} disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] font-bold rounded-xl transition disabled:opacity-60">
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {submitting ? 'Submitting…' : user?.mediaRole === 'chief-editor' ? 'Publish Now' : 'Submit for Review'}
              </button>
              <button onClick={() => navigate(`${base}/media/content/${contentId}`)}
                className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition">
                Preview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
