import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { Monitor, CheckCircle, XCircle, ChevronRight, RotateCcw, AlertTriangle, ShieldAlert, Eye } from 'lucide-react'

const MAX_VIOLATIONS = 3

export default function CBT() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Anti-cheat
  const [violations, setViolations] = useState(0)
  const [warning, setWarning] = useState(null) // null | 'tab' | 'blur' | 'final'
  const [locked, setLocked] = useState(false)
  const violationCount = useRef(0)
  const quizActive = useRef(false)
  const answersRef = useRef({})
  const courseRef = useRef(null)

  useEffect(() => {
    axios.get('/api/cbt', { withCredentials: true })
      .then(res => setQuestions(res.data.questions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Keep refs in sync so the submit callback always has fresh values
  useEffect(() => { answersRef.current = answers }, [answers])
  useEffect(() => { courseRef.current = selectedCourse }, [selectedCourse])

  const courses = [...new Set(questions.map(q => q.course))].sort()
  const courseQuestions = selectedCourse ? questions.filter(q => q.course === selectedCourse) : []

  const handleAnswer = (qId, option) => {
    if (locked) return
    setAnswers(prev => ({ ...prev, [qId]: option }))
  }

  const doSubmit = useCallback(async (forced) => {
    quizActive.current = false
    setSubmitting(true)
    try {
      const cq = questions.filter(q => q.course === courseRef.current)
      const payload = {}
      cq.forEach(q => { if (answersRef.current[q._id]) payload[q._id] = answersRef.current[q._id] })
      const { data } = await axios.post('/api/cbt/submit',
        { answers: payload, violations: violationCount.current, forced },
        { withCredentials: true }
      )
      setResult(data)
      setWarning(null)
    } catch {
      alert('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [questions])

  // Anti-cheat listeners — only active while a quiz is in progress
  useEffect(() => {
    if (!selectedCourse || result) {
      quizActive.current = false
      return
    }
    quizActive.current = true
    violationCount.current = 0
    setViolations(0)
    setLocked(false)
    setWarning(null)

    const addViolation = (type) => {
      if (!quizActive.current) return
      violationCount.current += 1
      setViolations(violationCount.current)

      if (violationCount.current >= MAX_VIOLATIONS) {
        setWarning('final')
        setLocked(true)
        quizActive.current = false
        setTimeout(() => doSubmit(true), 3000)
      } else {
        setWarning(type)
      }
    }

    const onVisibilityChange = () => { if (document.hidden) addViolation('tab') }
    const onBlur = () => addViolation('blur')

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      quizActive.current = false
    }
  }, [selectedCourse, result, doSubmit])

  const handleSubmit = async () => {
    const unanswered = courseQuestions.filter(q => !answers[q._id])
    if (unanswered.length > 0) {
      const ok = window.confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)
      if (!ok) return
    }
    await doSubmit(false)
  }

  const reset = () => {
    setSelectedCourse(null)
    setAnswers({})
    setResult(null)
    setViolations(0)
    setWarning(null)
    setLocked(false)
    violationCount.current = 0
    quizActive.current = false
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#1a3c5e] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ── Course selection ────────────────────────────────────────────────────────
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
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-1">
            <Eye size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 text-sm font-semibold">Integrity Monitor Active</p>
              <p className="text-amber-700 text-xs mt-0.5">
                Switching tabs or leaving the window during a session is flagged as a violation.
                After {MAX_VIOLATIONS} violations your answers are auto-submitted.
              </p>
            </div>
          </div>

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

  // ── Result screen ───────────────────────────────────────────────────────────
  if (result) {
    const pct = Math.round((result.score / result.total) * 100)
    const pass = pct >= 50
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">CBT Result — {selectedCourse}</h1>
        </div>

        {result.forced && (
          <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <ShieldAlert size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">
              <strong>Auto-submitted.</strong> {MAX_VIOLATIONS} integrity violations were detected in this session.
            </p>
          </div>
        )}

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
                  {r.isCorrect
                    ? <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                    : <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />}
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

  // ── Quiz screen ─────────────────────────────────────────────────────────────
  const answered = Object.keys(answers).filter(id => courseQuestions.find(q => q._id === id)).length
  const remaining = MAX_VIOLATIONS - violations

  return (
    <div className="relative">

      {/* Violation warning overlay */}
      {warning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl border-2 ${warning === 'final' ? 'border-red-500' : 'border-amber-400'}`}>
            {warning === 'final' ? (
              <>
                <ShieldAlert size={36} className="text-red-500 mx-auto mb-3" />
                <h2 className="text-red-600 font-bold text-lg text-center mb-2">Session Terminated</h2>
                <p className="text-gray-600 text-sm text-center mb-1">
                  You left the exam window <strong>{MAX_VIOLATIONS} times</strong>. Your answers are being submitted automatically.
                </p>
                <p className="text-gray-400 text-xs text-center">Submitting in 3 seconds…</p>
              </>
            ) : (
              <>
                <AlertTriangle size={36} className="text-amber-500 mx-auto mb-3" />
                <h2 className="text-amber-600 font-bold text-lg text-center mb-2">
                  {warning === 'tab' ? 'Tab Switch Detected' : 'Window Focus Lost'}
                </h2>
                <p className="text-gray-600 text-sm text-center mb-4">
                  Oga! Stay on the exam page jare. You have{' '}
                  <strong className="text-red-500">{remaining} warning{remaining !== 1 ? 's' : ''}</strong> left before your session is auto-submitted.
                </p>
                <button onClick={() => setWarning(null)}
                  className="w-full bg-[#1a3c5e] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#162f4a] transition">
                  I understand, continue exam
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quiz header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">{selectedCourse}</h1>
          <p className="text-gray-500 text-sm mt-1">{courseQuestions.length} questions • {answered} answered</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={reset} disabled={locked}
            className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 shrink-0 disabled:opacity-40">
            <RotateCcw size={14} /> Change course
          </button>
          {violations > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <ShieldAlert size={12} className="text-amber-500" />
              <span className="text-amber-700 text-xs font-semibold">{violations}/{MAX_VIOLATIONS} violations</span>
            </div>
          )}
        </div>
      </div>

      {/* Integrity notice bar */}
      <div className="flex items-center gap-2 mb-5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
        <Eye size={14} className="text-blue-400 flex-shrink-0" />
        <p className="text-blue-600 text-xs">Integrity monitor is active — do not switch tabs or leave this window</p>
      </div>

      <div className={`space-y-6 mb-8 ${locked ? 'pointer-events-none opacity-50' : ''}`}>
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

      <button onClick={handleSubmit} disabled={submitting || locked}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-amber-400 hover:bg-amber-500 text-[#1a3c5e] font-bold rounded-xl transition disabled:opacity-60">
        {submitting ? 'Submitting...' : `Submit ${answered}/${courseQuestions.length} Answers`}
      </button>
    </div>
  )
}
