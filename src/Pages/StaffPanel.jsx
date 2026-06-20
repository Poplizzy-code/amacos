import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  BookOpen, Monitor, ClipboardList, Upload, FileText,
  Trash2, Plus, X, Loader2, Eye, Image as ImageIcon,
  Film, File as FileIcon, CalendarClock, Users, Search,
  RefreshCw, ChevronDown, ChevronUp, Tv2,
} from 'lucide-react'

const TABS = [
  { id: 'resources',    label: 'Upload Resources', icon: BookOpen },
  { id: 'cbt',          label: 'CBT Questions',    icon: Monitor },
  { id: 'assignments',  label: 'Assignments',      icon: ClipboardList },
  { id: 'session',      label: 'Session',          icon: CalendarClock, adminOnly: true },
  { id: 'students',     label: 'Students',         icon: Users,         adminOnly: true },
  { id: 'media',        label: 'Media Roles',      icon: Tv2,           adminOnly: true },
]

const UPLOAD_TYPES = [
  { value: 'document', label: 'Document', icon: FileIcon, accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt' },
  { value: 'image',    label: 'Image',    icon: ImageIcon, accept: 'image/*' },
  { value: 'video',    label: 'Video',    icon: Film,      accept: 'video/*' },
]

const RESOURCE_CATEGORIES = [
  { value: 'lecture-note', label: 'Lecture Note' },
  { value: 'textbook',     label: 'Textbook' },
  { value: 'assignment',   label: 'Assignment File' },
  { value: 'other',        label: 'Other' },
]

function CenteredSpinner() {
  return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[#1a3c5e]" /></div>
}

function ConfirmButton({ label, icon: Icon, onClick, className = '' }) {
  const [confirming, setConfirming] = useState(false)
  return confirming ? (
    <div className="flex items-center gap-1">
      <button onClick={() => { onClick(); setConfirming(false) }} className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg font-medium">Confirm</button>
      <button onClick={() => setConfirming(false)} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">Cancel</button>
    </div>
  ) : (
    <button onClick={() => setConfirming(true)} className={className} title={label}><Icon size={15} /></button>
  )
}

// ── Resources Tab ──────────────────────────────────────────────────────────────
function ResourcesTab() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [uploadType, setUploadType] = useState('document')
  const [form, setForm] = useState({ title: '', description: '', category: 'lecture-note' })
  const [file, setFile] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    axios.get('/api/admin/resources', { withCredentials: true })
      .then(res => setResources((res.data.resources || []).filter(r => r.category !== 'past-question')))
      .catch(() => toast.error('Failed to load resources.'))
      .finally(() => setLoading(false))
  }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file.')
    if (!form.title.trim()) return toast.error('Title is required.')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('category', form.category)
      fd.append('file', file)
      const { data } = await axios.post('/api/admin/resources', fd, { withCredentials: true })
      setResources(prev => [data.resource, ...prev])
      setForm({ title: '', description: '', category: 'lecture-note' })
      setFile(null); if (fileRef.current) fileRef.current.value = ''
      setShowForm(false)
      toast.success('Resource uploaded!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const deleteResource = async (id) => {
    try {
      await axios.delete(`/api/admin/resources/${id}`, { withCredentials: true })
      setResources(prev => prev.filter(r => r._id !== id))
      toast.success('Deleted.')
    } catch { toast.error('Failed to delete.') }
  }

  if (loading) return <CenteredSpinner />

  const currentAccept = UPLOAD_TYPES.find(t => t.value === uploadType)?.accept ?? ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{resources.length} resource{resources.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] font-medium">
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Upload Resource</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-[#1a3c5e]">Upload Resource</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">File Type</label>
            <div className="flex flex-wrap gap-2">
              {UPLOAD_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => { setUploadType(t.value); setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition ${uploadType === t.value ? 'bg-[#1a3c5e] text-white border-[#1a3c5e]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#1a3c5e]/40'}`}>
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. COM 301 Week 3 Notes"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] bg-white">
                {RESOURCE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description (optional)" rows={2}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">File *</label>
            <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#1a3c5e]/40 hover:bg-gray-50 transition">
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-[#1a3c5e] font-medium min-w-0">
                  <FileText size={18} className="flex-shrink-0" /><span className="truncate min-w-0 max-w-[180px] sm:max-w-xs">{file.name}</span>
                  <button type="button" onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = '' }} className="text-gray-400 hover:text-red-400 flex-shrink-0"><X size={15} /></button>
                </div>
              ) : (
                <><Upload size={22} className="mx-auto mb-2 text-gray-300" /><p className="text-sm text-gray-400">Click to select {uploadType}</p></>
              )}
            </div>
            <input ref={fileRef} type="file" accept={currentAccept} className="hidden" onChange={e => setFile(e.target.files[0] || null)} />
          </div>
          <button type="submit" disabled={uploading} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] font-medium disabled:opacity-60">
            {uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading...</> : <><Upload size={15} /> Upload</>}
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {resources.length === 0 ? (
          <div className="p-10 text-center"><BookOpen size={32} className="mx-auto mb-3 text-gray-200" /><p className="text-gray-400 text-sm">No resources uploaded yet.</p></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {resources.map(r => (
              <div key={r._id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0"><FileText size={16} className="text-amber-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{r.title}</p>
                  <p className="text-xs text-gray-400 truncate">{r.category} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg"><Eye size={15} /></a>
                  <ConfirmButton label="Delete" icon={Trash2} onClick={() => deleteResource(r._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── CBT Questions Tab ──────────────────────────────────────────────────────────
function CBTTab() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ course: '', question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', explanation: '' })

  useEffect(() => {
    axios.get('/api/admin/cbt', { withCredentials: true })
      .then(res => setQuestions(res.data.questions || []))
      .catch(() => toast.error('Failed to load questions.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    const { course, question, optionA, optionB, optionC, optionD } = form
    if (!course || !question || !optionA || !optionB || !optionC || !optionD) return toast.error('Please fill all fields.')
    setSaving(true)
    try {
      const { data } = await axios.post('/api/admin/cbt', form, { withCredentials: true })
      setQuestions(prev => [...prev, data.question])
      setForm({ course: '', question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', explanation: '' })
      setShowForm(false)
      toast.success('Question saved!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const deleteQ = async (id) => {
    try {
      await axios.delete(`/api/admin/cbt/${id}`, { withCredentials: true })
      setQuestions(prev => prev.filter(q => q._id !== id))
      toast.success('Deleted.')
    } catch { toast.error('Failed.') }
  }

  if (loading) return <CenteredSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] font-medium">
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Question</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-[#1a3c5e]">New CBT Question</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Course *</label>
              <input value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))} placeholder="e.g. COM 301 — Media Ethics"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Correct Answer *</label>
              <select value={form.correctAnswer} onChange={e => setForm(p => ({ ...p, correctAnswer: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] bg-white">
                {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>Option {o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Question *</label>
            <textarea value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} placeholder="Type the question here..." rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['A', 'B', 'C', 'D'].map(opt => (
              <div key={opt}>
                <label className={`block text-xs font-medium mb-1.5 ${form.correctAnswer === opt ? 'text-green-600' : 'text-gray-600'}`}>
                  Option {opt} {form.correctAnswer === opt && '✓ (correct)'}
                </label>
                <input value={form[`option${opt}`]} onChange={e => setForm(p => ({ ...p, [`option${opt}`]: e.target.value }))} placeholder={`Option ${opt}...`}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-[#1a3c5e] ${form.correctAnswer === opt ? 'border-green-300 focus:ring-green-200' : 'border-gray-200 focus:ring-[#1a3c5e]/20'}`} />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Explanation (optional)</label>
            <input value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))} placeholder="Brief explanation of the correct answer..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] font-medium disabled:opacity-60">
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Save Question'}
          </button>
        </form>
      )}

      {questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm"><Monitor size={32} className="mx-auto mb-3 text-gray-200" /><p className="text-gray-400 text-sm">No questions yet. Add the first one!</p></div>
      ) : (
        <div className="space-y-2">
          {Object.entries(questions.reduce((acc, q) => { (acc[q.course] = acc[q.course] || []).push(q); return acc }, {})).map(([course, qs]) => (
            <div key={course} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h4 className="font-semibold text-[#1a3c5e] text-sm">{course}</h4>
                <span className="text-xs text-gray-400">{qs.length} question{qs.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {qs.map((q, i) => (
                  <div key={q._id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/50">
                    <span className="text-xs text-amber-500 font-bold mt-0.5 flex-shrink-0">Q{i + 1}</span>
                    <p className="text-sm text-gray-700 flex-1 line-clamp-2">{q.question}</p>
                    <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold flex-shrink-0">{q.correctAnswer}</span>
                    <ConfirmButton label="Delete" icon={Trash2} onClick={() => deleteQ(q._id)} className="p-1 text-red-400 hover:bg-red-50 rounded flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Assignments Tab ────────────────────────────────────────────────────────────
function AssignmentsTab() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', course: '', description: '', dueDate: '' })
  const [file, setFile] = useState(null)
  const fileRef = useRef()
  const [uploadType, setUploadType] = useState('document')

  useEffect(() => {
    axios.get('/api/admin/assignments', { withCredentials: true })
      .then(res => setAssignments(res.data.assignments || []))
      .catch(() => toast.error('Failed to load assignments.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    const { title, course, description, dueDate } = form
    if (!title || !course || !description || !dueDate) return toast.error('All fields are required.')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (file) fd.append('file', file)
      const { data } = await axios.post('/api/admin/assignments', fd, { withCredentials: true })
      setAssignments(prev => [...prev, data.assignment])
      setForm({ title: '', course: '', description: '', dueDate: '' })
      setFile(null); if (fileRef.current) fileRef.current.value = ''
      setShowForm(false)
      toast.success('Assignment posted!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setSaving(false)
    }
  }

  const deleteA = async (id) => {
    try {
      await axios.delete(`/api/admin/assignments/${id}`, { withCredentials: true })
      setAssignments(prev => prev.filter(a => a._id !== id))
      toast.success('Deleted.')
    } catch { toast.error('Failed.') }
  }

  if (loading) return <CenteredSpinner />

  const currentAccept = UPLOAD_TYPES.find(t => t.value === uploadType)?.accept ?? ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] font-medium">
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> New Assignment</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-[#1a3c5e]">Post Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Assignment title"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Course *</label>
              <input value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))} placeholder="e.g. COM 301"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description / Instructions *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe the assignment..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e] resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Due Date *</label>
            <input type="datetime-local" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20 focus:border-[#1a3c5e]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Attachment (optional)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {UPLOAD_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => { setUploadType(t.value); setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${uploadType === t.value ? 'bg-[#1a3c5e] text-white border-[#1a3c5e]' : 'bg-white text-gray-500 border-gray-200'}`}>
                  <t.icon size={12} /> {t.label}
                </button>
              ))}
            </div>
            <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-[#1a3c5e]/40 hover:bg-gray-50 transition">
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-[#1a3c5e]">
                  <FileText size={16} />{file.name}
                  <button type="button" onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = '' }}><X size={13} className="text-gray-400" /></button>
                </div>
              ) : <p className="text-sm text-gray-400">Click to attach file (optional)</p>}
            </div>
            <input ref={fileRef} type="file" accept={currentAccept} className="hidden" onChange={e => setFile(e.target.files[0] || null)} />
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3c5e] text-white text-sm rounded-xl hover:bg-[#162f4a] font-medium disabled:opacity-60">
            {saving ? <><Loader2 size={15} className="animate-spin" /> Posting...</> : 'Post Assignment'}
          </button>
        </form>
      )}

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm"><ClipboardList size={32} className="mx-auto mb-3 text-gray-200" /><p className="text-gray-400 text-sm">No assignments posted yet.</p></div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const overdue = new Date(a.dueDate) < new Date()
            return (
              <div key={a._id} className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-sm flex gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-[#1a3c5e] text-sm">{a.title}</h3>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{a.course}</span>
                    {overdue && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Overdue</span>}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-1">{a.description}</p>
                  <p className="text-xs text-gray-400">Due: {new Date(a.dueDate).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {a.fileUrl && <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg"><Eye size={15} /></a>}
                  <ConfirmButton label="Delete" icon={Trash2} onClick={() => deleteA(a._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Session Tab (staff admin only) ─────────────────────────────────────────────
function SessionTab() {
  const [currentSession, setCurrentSession] = useState('')
  const [loading, setLoading] = useState(true)
  const [editSession, setEditSession] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [promoting, setPromoting] = useState(false)
  const [confirmPromote, setConfirmPromote] = useState(false)

  useEffect(() => {
    axios.get('/api/settings/session', { withCredentials: true })
      .then(res => { setCurrentSession(res.data.currentSession || ''); setEditSession(res.data.currentSession || '') })
      .catch(() => toast.error('Failed to load session.'))
      .finally(() => setLoading(false))
  }, [])

  const getNext = (s) => {
    if (!s) return ''
    const [y1, y2] = s.split('/').map(Number)
    if (!y1 || !y2) return ''
    return `${y1 + 1}/${y2 + 1}`
  }

  const saveSession = async () => {
    const val = editSession.trim()
    if (!val) return toast.error('Session cannot be empty.')
    if (!/^\d{4}\/\d{4}$/.test(val)) return toast.error('Format must be YYYY/YYYY, e.g. 2026/2027')
    setSaving(true)
    try {
      const { data } = await axios.put('/api/settings/session', { currentSession: val }, { withCredentials: true })
      setCurrentSession(data.currentSession)
      setEditing(false)
      toast.success(`Session updated to ${data.currentSession}.`)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update session.') }
    finally { setSaving(false) }
  }

  const promoteAll = async () => {
    setPromoting(true)
    try {
      const { data } = await axios.put('/api/settings/session/promote', {}, { withCredentials: true })
      setConfirmPromote(false)
      toast.success(`${data.totalPromoted} students promoted to next level.`)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to promote students.') }
    finally { setPromoting(false) }
  }

  if (loading) return <CenteredSpinner />

  const next = getNext(currentSession)

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="font-bold text-[#1a3c5e] text-lg">Academic Session Management</h2>

      {/* Current session card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <CalendarClock size={24} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Current Session</p>
            {editing ? (
              <div className="flex items-center gap-2">
                <input value={editSession} onChange={e => setEditSession(e.target.value)} placeholder="e.g. 2026/2027"
                  className="w-36 px-2 py-1.5 text-lg font-bold border border-[#1a3c5e] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/20" />
                <button onClick={saveSession} disabled={saving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#1a3c5e] text-white text-xs font-bold rounded-lg disabled:opacity-60">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setEditSession(currentSession) }}
                  className="px-2 py-1.5 text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-[#1a3c5e]">{currentSession || 'Not set'}</p>
                <button onClick={() => setEditing(true)} className="text-xs text-[#1a3c5e] underline">Edit</button>
              </div>
            )}
          </div>
        </div>

        {/* Promote students section */}
        <div className="border-t border-gray-100 pt-5 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Promote All Students</p>
          <div className="bg-blue-50 rounded-xl p-4 text-sm">
            <p className="font-semibold text-blue-800 mb-2">This will promote students as follows:</p>
            <ul className="text-blue-700 space-y-1 text-xs">
              <li>→ 100L → 200L</li>
              <li>→ 200L → 300L</li>
              <li>→ 300L → 400L</li>
              <li>→ 400L stays at 400L</li>
            </ul>
          </div>
          {!confirmPromote ? (
            <button onClick={() => setConfirmPromote(true)}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#1a3c5e] font-bold text-sm px-5 py-2.5 rounded-xl transition">
              <RefreshCw size={15} /> Promote All Students
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-bold text-red-700 mb-1">Are you sure?</p>
              <p className="text-xs text-red-600 mb-3">All eligible students will be moved up one level. This cannot be undone automatically.</p>
              <div className="flex gap-2">
                <button onClick={promoteAll} disabled={promoting}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition disabled:opacity-60">
                  {promoting && <Loader2 size={13} className="animate-spin" />}
                  {promoting ? 'Promoting…' : 'Yes, Promote All'}
                </button>
                <button onClick={() => setConfirmPromote(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200 transition">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Students Tab (staff admin only) ───────────────────────────────────────────
function StudentsTab() {
  const { user: currentUser } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)

  const load = () => {
    setLoading(true)
    axios.get('/api/admin/users', { withCredentials: true })
      .then(res => {
        const all = res.data.users || []
        setStudents(all.filter(u => u.accountType === 'student'))
      })
      .catch(() => toast.error('Failed to load students.'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const changeLevel = async (student, newLevel) => {
    setActionLoading(student._id + '_level')
    try {
      await axios.put(`/api/settings/students/${student._id}/level`, { level: newLevel }, { withCredentials: true })
      setStudents(prev => prev.map(s => s._id === student._id ? { ...s, level: newLevel } : s))
      toast.success(`${student.fullName} moved to ${newLevel}L.`)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update level.') }
    finally { setActionLoading(null) }
  }

  const filtered = students.filter(s => {
    const matchSearch = s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.matricNumber?.toLowerCase().includes(search.toLowerCase())
    const matchLevel = levelFilter === 'all' || s.level === levelFilter
    return matchSearch && matchLevel
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-[#1a3c5e] text-lg">Student Level Management</h2>
        <button onClick={load} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500" title="Refresh"><RefreshCw size={15} /></button>
      </div>
      <p className="text-sm text-gray-500">Adjust individual student levels for suspended or repeating students.</p>

      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm flex-1 min-w-48">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or matric…"
            className="flex-1 text-sm focus:outline-none text-gray-700 bg-transparent" />
        </div>
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 focus:outline-none shadow-sm">
          <option value="all">All Levels</option>
          {['100', '200', '300', '400'].map(l => <option key={l} value={l}>{l}L</option>)}
        </select>
      </div>

      {loading ? <CenteredSpinner /> : (
        <>
          <p className="text-xs text-gray-400">{filtered.length} student{filtered.length !== 1 ? 's' : ''} shown</p>
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <Users size={28} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">No students found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(student => (
                <div key={student._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
                  {student.avatar
                    ? <img src={student.avatar} alt={student.fullName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{student.fullName?.charAt(0).toUpperCase()}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1a3c5e] text-sm truncate">{student.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{student.email}{student.matricNumber ? ` · ${student.matricNumber}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={student.level}
                      onChange={e => changeLevel(student, e.target.value)}
                      disabled={actionLoading === student._id + '_level'}
                      className="text-xs font-semibold text-[#1a3c5e] border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#1a3c5e] disabled:opacity-50 cursor-pointer"
                    >
                      {['100', '200', '300', '400'].map(l => (
                        <option key={l} value={l}>{l}L</option>
                      ))}
                    </select>
                    {actionLoading === student._id + '_level' && <Loader2 size={14} className="animate-spin text-[#1a3c5e]" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Media Roles Tab (Staff — can assign chief-editor) ──────────────────────────
const STAFF_MEDIA_ROLES = [
  { value: '',             label: 'No Role' },
  { value: 'publisher',    label: 'Publisher' },
  { value: 'editor',       label: 'Editor' },
  { value: 'chief-editor', label: 'Chief Editor' },
]

function StaffMediaRolesTab() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const load = () => {
    setLoading(true)
    axios.get('/api/media/roles/all', { withCredentials: true, params: { search, limit: 60 } })
      .then(res => setUsers(res.data.users || []))
      .catch(() => toast.error('Failed to load users.'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [search])

  const setRole = async (userId, role) => {
    setActionLoading(userId)
    try {
      await axios.put(`/api/media/roles/${userId}`, { role }, { withCredentials: true })
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, mediaRole: role } : u))
      toast.success(`Role ${role ? `set to ${role}` : 'removed'}.`)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setActionLoading(null) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-[#1a3c5e] mb-3">Media Roles</h2>
        <p className="text-xs text-gray-500 mb-3">As staff admin you can assign any role including Chief Editor.</p>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
            className="flex-1 bg-transparent text-sm text-[#1a3c5e] placeholder-gray-400 focus:outline-none" />
        </div>
      </div>
      {loading
        ? <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[#1a3c5e]" /></div>
        : users.length === 0
          ? <div className="text-center py-10 text-gray-400 text-sm">No users found.</div>
          : <div className="divide-y divide-gray-50">
              {users.map(u => (
                <div key={u._id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                  {u.avatar
                    ? <img src={u.avatar} alt={u.fullName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#2563a8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.fullName?.charAt(0)}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a3c5e] truncate">{u.fullName}</p>
                    <p className="text-xs text-gray-400 truncate capitalize">{u.accountType} {u.level ? `· ${u.level}L` : ''}</p>
                  </div>
                  <select value={u.mediaRole || ''} onChange={e => setRole(u._id, e.target.value)}
                    disabled={actionLoading === u._id}
                    className={`text-xs font-semibold border rounded-xl px-2.5 py-1.5 focus:outline-none transition flex-shrink-0 disabled:opacity-50 ${
                      u.mediaRole === 'chief-editor' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                      u.mediaRole === 'editor'       ? 'bg-purple-50 border-purple-200 text-purple-600' :
                      u.mediaRole === 'publisher'    ? 'bg-blue-50 border-blue-200 text-blue-600' :
                      'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                    {STAFF_MEDIA_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
      }
    </div>
  )
}

// ── Main Staff Panel ───────────────────────────────────────────────────────────
export default function StaffPanel() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('resources')
  const [mobileTabOpen, setMobileTabOpen] = useState(false)

  const visibleTabs = TABS.filter(t => !t.adminOnly || user?.isStaffAdmin)
  const currentTab = visibleTabs.find(t => t.id === activeTab) || visibleTabs[0]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1a3c5e]">Staff Panel</h1>
        <p className="text-gray-500 text-sm mt-1">Upload resources, set CBT questions and post assignments{user?.isStaffAdmin ? ', manage sessions and students' : ''}</p>
      </div>

      {/* Tab bar — desktop */}
      <div className="hidden sm:flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm w-fit flex-wrap">
        {visibleTabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-[#1a3c5e] text-white shadow-sm' : 'text-gray-500 hover:text-[#1a3c5e] hover:bg-gray-50'}`}>
            <tab.icon size={15} /><span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Mobile tab dropdown */}
      <div className="sm:hidden relative">
        <button onClick={() => setMobileTabOpen(v => !v)}
          className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            {currentTab && <currentTab.icon size={16} className="text-[#1a3c5e]" />}
            <span className="font-semibold text-[#1a3c5e] text-sm">{currentTab?.label}</span>
          </div>
          {mobileTabOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        {mobileTabOpen && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            {visibleTabs.map(t => (
              <button key={t.id} onClick={() => { setActiveTab(t.id); setMobileTabOpen(false) }}
                className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition hover:bg-gray-50 ${activeTab === t.id ? 'text-amber-600 font-semibold bg-amber-50' : 'text-gray-700'}`}>
                <t.icon size={15} className={activeTab === t.id ? 'text-amber-500' : 'text-gray-400'} />
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'resources'   && <ResourcesTab />}
      {activeTab === 'cbt'         && <CBTTab />}
      {activeTab === 'assignments' && <AssignmentsTab />}
      {activeTab === 'session'     && user?.isStaffAdmin && <SessionTab />}
      {activeTab === 'students'    && user?.isStaffAdmin && <StudentsTab />}
      {activeTab === 'media'       && user?.isStaffAdmin && <StaffMediaRolesTab />}
    </div>
  )
}
