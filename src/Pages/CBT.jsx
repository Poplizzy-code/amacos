import { useState, useEffect } from 'react'
import axios from 'axios'
import { Monitor, CheckCircle, XCircle, ChevronRight, RotateCcw } from 'lucide-react'

export default function CBT() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    axios.get('/api/cbt', { withCredentials: true })
      .then(res => setQuestions(res.data.questions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const courses = [...new Set(questions.map(q => q.course))].sort()
  const courseQuestions = selectedCourse ? questions.filter(q => q.course === selectedCourse) : []

  const handleAnswer = (qId, option) => {
    setAnswers(prev => ({ ...prev, [qId]: option }))
  }

  const handleSubmit = async () => {
    const unanswered = courseQuestions.filter(q => !answers[q._id])
    if (unanswered.length > 0) {
      const ok = window.confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)
      if (!ok) return
    }
    setSubmitting(true)
    try {
      const payload = {}
      courseQuestions.forEach(q => { if (answers[q._id]) payload[q._id] = answers[q._id] })
      const { data } = await axios.post('/api/cbt/submit', { answers: payload }, { withCredentials: true })
      setResult(data)
    } catch {
      alert('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setSelectedCourse(null)
    setAnswers({})
    setResult(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#1a3c5e] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Course selection screen
  if (!selectedCourse) return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">CBT Practice</h1>
        <p className="text-gray-500 text-sm mt-1">Select a course to start practising</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Monitor size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">No questions available yet</p>
          <p className="text-gray-400 text-sm mt-1">Staff will add CBT questions soon.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {courses.map(course => {
            const count = questions.filter(q => q.course === course).length
            return (
              <button key={course} onClick={() => setSelectedCourse(course)}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-[#1a3c5e]/20 transition text-left flex items-center justify-between group">
                <div>
                  <h3 className="font-semibold text-[#1a3c5e] mb-1">{course}</h3>
                  <p className="text-gray-400 text-sm">{count} question{count !== 1 ? 's' : ''}</p>
                </div>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-[#1a3c5e] transition" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  // Result screen
  if (result) {
    const pct = Math.round((result.score / result.total) * 100)
    const pass = pct >= 50
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">CBT Result — {selectedCourse}</h1>
        </div>
        <div className={`rounded-2xl p-8 text-center mb-6 ${pass ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-5xl font-bold mb-2 ${pass ? 'text-green-600' : 'text-red-500'}`}>{pct}%</p>
          <p className={`text-lg font-semibold ${pass ? 'text-green-700' : 'text-red-600'}`}>
            {pass ? '🎉 Passed!' : '📚 Keep Practising'}
          </p>
          <p className="text-gray-500 mt-2">{result.score} correct out of {result.total} questions</p>
        </div>

        <div className="space-y-4 mb-6">
          {result.results.map((r, i) => {
            const q = courseQuestions.find(q => q._id === r.id)
            return (
              <div key={r.id} className={`bg-white rounded-xl border p-4 ${r.isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                <div className="flex items-start gap-3">
                  {r.isCorrect ? <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 mb-1">Q{i + 1}. {q?.question}</p>
                    <p className="text-xs text-gray-500">Your answer: <span className={r.isCorrect ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{r.chosen || '(not answered)'}</span></p>
                    {!r.isCorrect && <p className="text-xs text-green-600 font-medium">Correct: {r.correctAnswer}</p>}
                    {r.explanation && <p className="text-xs text-gray-400 mt-1 italic">{r.explanation}</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <button onClick={reset}
          className="flex items-center gap-2 px-6 py-3 bg-[#1a3c5e] text-white rounded-xl text-sm font-medium hover:bg-[#162f4a] transition">
          <RotateCcw size={15} /> Choose another course
        </button>
      </div>
    )
  }

  // Quiz screen
  const answered = Object.keys(answers).filter(id => courseQuestions.find(q => q._id === id)).length
  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">{selectedCourse}</h1>
          <p className="text-gray-500 text-sm mt-1">{courseQuestions.length} questions • {answered} answered</p>
        </div>
        <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 shrink-0">
          <RotateCcw size={14} /> Change course
        </button>
      </div>

      <div className="space-y-6 mb-8">
        {courseQuestions.map((q, i) => (
          <div key={q._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="font-semibold text-[#1a3c5e] mb-4 text-sm leading-relaxed">
              <span className="text-amber-500 font-bold mr-1">Q{i + 1}.</span> {q.question}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {['A', 'B', 'C', 'D'].map(opt => {
                const text = q[`option${opt}`]
                const selected = answers[q._id] === opt
                return (
                  <button key={opt} onClick={() => handleAnswer(q._id, opt)}
                    className={`text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                      selected
                        ? 'bg-[#1a3c5e] text-white border-[#1a3c5e] font-medium'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#1a3c5e]/40 hover:bg-[#1a3c5e]/5'
                    }`}>
                    <span className="font-bold mr-2">{opt}.</span>{text}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={submitting}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-amber-400 hover:bg-amber-500 text-[#1a3c5e] font-bold rounded-xl transition disabled:opacity-60">
        {submitting ? 'Submitting...' : `Submit ${answered}/${courseQuestions.length} Answers`}
      </button>
    </div>
  )
}
