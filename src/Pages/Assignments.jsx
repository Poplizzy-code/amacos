import { useState, useEffect } from 'react'
import axios from 'axios'
import { ClipboardList, Download, Calendar, AlertCircle } from 'lucide-react'

const fmtDate = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function Assignments() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/assignments', { withCredentials: true })
      .then(res => setAssignments(res.data.assignments || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const upcoming = assignments.filter(a => new Date(a.dueDate) >= new Date())
  const overdue = assignments.filter(a => new Date(a.dueDate) < new Date())

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">Assignments</h1>
        <p className="text-gray-500 text-sm mt-1">Course assignments from your lecturers</p>
      </div>

      {loading && <div className="grid gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>}

      {!loading && assignments.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <ClipboardList size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">No assignments yet</p>
          <p className="text-gray-400 text-sm mt-1">Assignments from lecturers will appear here.</p>
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Active</h2>
          <div className="grid gap-3">
            {upcoming.map(a => <AssignmentCard key={a._id} a={a} />)}
          </div>
        </div>
      )}

      {!loading && overdue.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Past Due</h2>
          <div className="grid gap-3 opacity-60">
            {overdue.map(a => <AssignmentCard key={a._id} a={a} overdue />)}
          </div>
        </div>
      )}
    </div>
  )
}

function AssignmentCard({ a, overdue }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition flex gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-red-50' : 'bg-[#1a3c5e]/10'}`}>
        {overdue ? <AlertCircle size={20} className="text-red-400" /> : <ClipboardList size={20} className="text-[#1a3c5e]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-semibold text-[#1a3c5e] text-sm">{a.title}</h3>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{a.course}</span>
          {overdue && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">Past due</span>}
        </div>
        <p className="text-gray-500 text-sm mb-2 line-clamp-3">{a.description}</p>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Calendar size={11} /> Due: {fmtDate(a.dueDate)}</span>
          {a.createdBy?.fullName && <span>By {a.createdBy.fullName}</span>}
        </div>
      </div>
      {a.fileUrl && (
        <a href={a.fileUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 bg-[#1a3c5e] text-white text-xs rounded-xl hover:bg-[#162f4a] transition flex-shrink-0 h-fit mt-1">
          <Download size={12} /> File
        </a>
      )}
    </div>
  )
}
