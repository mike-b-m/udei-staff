'use client'
import { supabase } from "@/app/component/db"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import type { ExamQuestion, ExamAnswerOption, OnlineExam } from "@/app/component/exam/types"

// ============ Shuffle utility (seeded for consistency) ============
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// ============ Timer Component ============
function ExamTimer({ startTime, durationMinutes, onTimeUp }: {
  startTime: string
  durationMinutes: number
  onTimeUp: () => void
}) {
  const [remaining, setRemaining] = useState<number>(durationMinutes * 60)
  const timedOut = useRef(false)

  useEffect(() => {
    const start = new Date(startTime).getTime()
    const totalMs = durationMinutes * 60 * 1000

    const tick = () => {
      const elapsed = Date.now() - start
      const left = Math.max(0, Math.floor((totalMs - elapsed) / 1000))
      setRemaining(left)
      if (left <= 0 && !timedOut.current) {
        timedOut.current = true
        onTimeUp()
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startTime, durationMinutes, onTimeUp])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const isLow = remaining < 300 // 5 minutes

  return (
    <div className={`font-mono text-lg font-bold px-4 py-2 rounded-lg ${
      isLow ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'
    }`}>
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  )
}

// ============ Main Exam Page ============
export default function ExamAttemptPage() {
  const router = useRouter()
  const params = useParams()
  const examId = parseInt(params.examId as string)
  const attemptId = parseInt(params.attemptId as string)

  const [exam, setExam] = useState<OnlineExam | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number | null>>({}) // question_id -> option_id
  const [startTime, setStartTime] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFullscreen = useRef(false)

  // ---- Fetch exam data ----
  useEffect(() => {
    fetchExamData()
  }, [])

  const fetchExamData = async () => {
    setLoading(true)
    try {
      // Get attempt info
      const { data: attempt } = await supabase
        .from('exam_attempt')
        .select('*')
        .eq('id', attemptId)
        .single()

      if (!attempt || attempt.status !== 'in_progress') {
        router.push('/student/exam')
        return
      }
      setStartTime(attempt.start_time)
      setTabSwitches(attempt.tab_switch_count || 0)

      // Get exam info
      const { data: examData } = await supabase
        .from('online_exam')
        .select('*')
        .eq('id', examId)
        .single()

      if (!examData) { router.push('/student/exam'); return }
      setExam(examData as OnlineExam)

      // Get questions with options (EXCLUDE is_correct for security)
      const { data: qData } = await supabase
        .from('exam_question')
        .select(`
          id, exam_id, question_text, question_order, marks,
          options:exam_answer_option(id, question_id, option_text, option_order)
        `)
        .eq('exam_id', examId)
        .order('question_order')

      if (qData) {
        let processedQuestions = qData as unknown as ExamQuestion[]

        // Randomize if enabled
        if (examData.randomize_questions) {
          processedQuestions = shuffleArray(processedQuestions)
        }
        // Shuffle options if enabled
        if (examData.shuffle_answers) {
          processedQuestions = processedQuestions.map(q => ({
            ...q,
            options: shuffleArray(q.options || []),
          }))
        }
        setQuestions(processedQuestions)
      }

      // Load existing saved answers
      const { data: savedAnswers } = await supabase
        .from('exam_attempt_answer')
        .select('question_id, selected_option_id')
        .eq('attempt_id', attemptId)

      if (savedAnswers) {
        const answerMap: Record<number, number | null> = {}
        savedAnswers.forEach(a => {
          answerMap[a.question_id] = a.selected_option_id
        })
        setAnswers(answerMap)
      }
    } catch (err) {
      console.error('Error loading exam:', err)
    } finally {
      setLoading(false)
    }
  }

  // ---- Auto-save answer (debounced) ----
  const saveAnswer = useCallback(async (questionId: number, optionId: number | null) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      await supabase
        .from('exam_attempt_answer')
        .upsert(
          {
            attempt_id: attemptId,
            question_id: questionId,
            selected_option_id: optionId,
            answered_at: new Date().toISOString(),
          },
          { onConflict: 'attempt_id,question_id' }
        )
    }, 500)
  }, [attemptId])

  const selectAnswer = (questionId: number, optionId: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
    saveAnswer(questionId, optionId)
  }

  // ---- Submit exam ----
  const handleSubmit = useCallback(async (forced = false) => {
    if (submitting || submitted) return
    if (!forced && !confirm('Êtes-vous sûr de vouloir soumettre ? Cette action est irréversible.')) return

    setSubmitting(true)
    try {
      // Calculate score server-side by fetching correct answers
      const { data: qWithOptions } = await supabase
        .from('exam_question')
        .select(`
          id, marks,
          options:exam_answer_option(id, is_correct)
        `)
        .eq('exam_id', examId)

      if (!qWithOptions) throw new Error('Failed to fetch questions')

      let totalScore = 0
      let totalMarks = 0

      for (const q of qWithOptions) {
        const qMarks = q.marks || 1
        totalMarks += qMarks
        const selectedOptionId = answers[q.id]
        const correctOption = (q.options as ExamAnswerOption[])?.find(o => o.is_correct)
        const isCorrect = selectedOptionId != null && correctOption?.id === selectedOptionId

        // Update the answer record with correctness
        if (selectedOptionId != null) {
          await supabase
            .from('exam_attempt_answer')
            .upsert(
              {
                attempt_id: attemptId,
                question_id: q.id,
                selected_option_id: selectedOptionId,
                is_correct: isCorrect,
                awarded_marks: isCorrect ? qMarks : 0,
                answered_at: new Date().toISOString(),
              },
              { onConflict: 'attempt_id,question_id' }
            )
        }

        if (isCorrect) totalScore += qMarks
      }

      const scorePercent = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100 * 100) / 100 : 0

      // Calculate suspicion score
      const suspicion = (tabSwitches / (exam?.max_tab_switches || 3)) * 0.5

      // Update attempt
      await supabase
        .from('exam_attempt')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          end_time: new Date().toISOString(),
          final_score: scorePercent,
          suspicion_score: Math.round(suspicion * 100) / 100,
          flagged_for_review: suspicion > 1,
        })
        .eq('id', attemptId)

      if (forced) {
        await logEvent('force_submit', 'critical', 'Auto-soumission forcée')
      }

      setSubmitted(true)
      router.push(`/student/exam/${examId}/result/${attemptId}`)
    } catch (err) {
      console.error('Submit error:', err)
      alert('Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }, [submitting, submitted, answers, examId, attemptId, exam, tabSwitches, router])

  // ---- Anti-cheat: Log events ----
  const logEvent = async (type: string, severity: string, details?: string) => {
    await supabase.from('exam_event_log').insert({
      attempt_id: attemptId,
      event_type: type,
      severity,
      details: details || null,
    })
  }

  // ---- Anti-cheat: Tab switch detection ----
  useEffect(() => {
    if (!exam || submitted) return

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const newCount = tabSwitches + 1
        setTabSwitches(newCount)

        await supabase
          .from('exam_attempt')
          .update({ tab_switch_count: newCount })
          .eq('id', attemptId)

        await logEvent('tab_switch', newCount >= (exam.max_tab_switches - 1) ? 'critical' : 'warning',
          `Changement d'onglet #${newCount}`)

        if (newCount >= exam.max_tab_switches) {
          setWarningMessage('Nombre maximum de changements d\'onglet atteint. Votre examen sera soumis automatiquement.')
          setShowWarning(true)
          handleSubmit(true)
        } else if (newCount >= exam.max_tab_switches - 1) {
          setWarningMessage(`Attention ! Dernier avertissement. Encore un changement d'onglet et votre examen sera soumis automatiquement.`)
          setShowWarning(true)
        } else {
          setWarningMessage(`Changement d'onglet détecté (${newCount}/${exam.max_tab_switches}). Restez sur cette page.`)
          setShowWarning(true)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [exam, tabSwitches, submitted, attemptId, handleSubmit])

  // ---- Anti-cheat: Fullscreen ----
  useEffect(() => {
    if (!exam || submitted) return

    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement && isFullscreen.current) {
        await logEvent('fullscreen_exit', 'warning', 'Sortie du mode plein écran')
        await supabase
          .from('exam_attempt')
          .update({ fullscreen_exit_count: (tabSwitches + 1) })
          .eq('id', attemptId)
      }
      isFullscreen.current = !!document.fullscreenElement
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [exam, submitted, attemptId, tabSwitches])

  // ---- Anti-cheat: Copy/paste prevention ----
  useEffect(() => {
    if (!exam || submitted) return

    const prevent = async (e: Event) => {
      e.preventDefault()
      await logEvent('copy_paste', 'warning', `${e.type} attempt blocked`)
    }

    const preventContext = async (e: Event) => {
      e.preventDefault()
      await logEvent('right_click', 'info', 'Right-click blocked')
    }

    document.addEventListener('copy', prevent)
    document.addEventListener('cut', prevent)
    document.addEventListener('paste', prevent)
    document.addEventListener('contextmenu', preventContext)

    return () => {
      document.removeEventListener('copy', prevent)
      document.removeEventListener('cut', prevent)
      document.removeEventListener('paste', prevent)
      document.removeEventListener('contextmenu', preventContext)
    }
  }, [exam, submitted, attemptId])

  // ---- Prevent back navigation ----
  useEffect(() => {
    if (submitted) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [submitted])

  // ---- Enter fullscreen ----
  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.().then(() => {
      isFullscreen.current = true
    }).catch(() => {})
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Chargement de l&apos;examen...</p>
        </div>
      </div>
    )
  }

  if (!exam || questions.length === 0) {
    return <div className="text-center py-12 text-gray-500">Examen non disponible</div>
  }

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).filter(k => answers[parseInt(k)] != null).length

  return (
    <div className="min-h-screen bg-gray-50 select-none">
      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-red-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Avertissement</h3>
            <p className="text-gray-600 mb-6">{warningMessage}</p>
            <button
              onClick={() => { setShowWarning(false); enterFullscreen() }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              J&apos;ai compris
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{exam.title}</h2>
            <p className="text-xs text-gray-500">
              Question {currentIndex + 1}/{questions.length} • {answeredCount} répondue{answeredCount > 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {tabSwitches > 0 && (
              <span className="text-xs text-red-500 font-medium hidden sm:block">
                Onglet: {tabSwitches}/{exam.max_tab_switches}
              </span>
            )}
            <ExamTimer
              startTime={startTime}
              durationMinutes={exam.duration_minutes}
              onTimeUp={() => handleSubmit(true)}
            />
          </div>
        </div>
      </div>

      {/* Instructions bar (first time) */}
      {exam.instructions && currentIndex === 0 && (
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <strong>Instructions:</strong> {exam.instructions}
          </div>
        </div>
      )}

      {/* Question Area */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Question Header */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Question {currentIndex + 1}
            </span>
            <span className="text-sm text-gray-500">{currentQuestion.marks} point{currentQuestion.marks > 1 ? 's' : ''}</span>
          </div>

          {/* Question Text */}
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
            {currentQuestion.question_text}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {(currentQuestion.options || []).map((option: ExamAnswerOption, idx: number) => {
              const isSelected = answers[currentQuestion.id] === option.id
              const letters = ['A', 'B', 'C', 'D', 'E', 'F']

              return (
                <button
                  key={option.id}
                  onClick={() => selectAnswer(currentQuestion.id, option.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {letters[idx] || (idx + 1)}
                  </span>
                  <span className={`text-sm sm:text-base ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                    {option.option_text}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0 || !exam.allow_back_nav}
            className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 disabled:opacity-40 disabled:hover:bg-gray-200 transition-colors text-sm"
          >
            ← Précédent
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
            >
              {submitting ? 'Soumission...' : 'Soumettre'}
            </button>
          )}
        </div>

        {/* Question Navigator */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-4">
          <p className="text-sm font-medium text-gray-600 mb-3">Navigateur de questions</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => {
              const isAnswered = answers[q.id] != null
              const isCurrent = i === currentIndex

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    if (exam.allow_back_nav || i > currentIndex) setCurrentIndex(i)
                  }}
                  disabled={!exam.allow_back_nav && i < currentIndex}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-md'
                      : isAnswered
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  } ${!exam.allow_back_nav && i < currentIndex ? 'opacity-40' : ''}`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-600"></span> Actuelle
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-300"></span> Répondue
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-100"></span> Non répondue
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
