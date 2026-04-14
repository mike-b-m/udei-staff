'use client'
import { supabase } from "@/app/component/db"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import type { OnlineExam, ExamAttempt, ExamQuestion, ExamAttemptAnswer, ExamAnswerOption } from "@/app/component/exam/types"

export default function ExamResultPage() {
  const params = useParams()
  const examId = parseInt(params.examId as string)
  const attemptId = parseInt(params.attemptId as string)

  const [exam, setExam] = useState<OnlineExam | null>(null)
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [questions, setQuestions] = useState<(ExamQuestion & { userAnswer?: ExamAttemptAnswer })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResult()
  }, [])

  const fetchResult = async () => {
    setLoading(true)
    try {
      const [examRes, attemptRes] = await Promise.all([
        supabase.from('online_exam').select('*').eq('id', examId).single(),
        supabase.from('exam_attempt').select('*').eq('id', attemptId).single(),
      ])

      if (examRes.data) setExam(examRes.data as OnlineExam)
      if (attemptRes.data) setAttempt(attemptRes.data as ExamAttempt)

      // Get questions with options AND user's answers
      const { data: qData } = await supabase
        .from('exam_question')
        .select(`
          id, exam_id, question_text, question_order, marks,
          options:exam_answer_option(id, question_id, option_text, is_correct, option_order)
        `)
        .eq('exam_id', examId)
        .order('question_order')

      const { data: userAnswers } = await supabase
        .from('exam_attempt_answer')
        .select('*')
        .eq('attempt_id', attemptId)

      if (qData) {
        const answerMap = new Map<number, ExamAttemptAnswer>()
        userAnswers?.forEach(a => answerMap.set(a.question_id, a as ExamAttemptAnswer))

        setQuestions(
          (qData as unknown as ExamQuestion[]).map(q => ({
            ...q,
            userAnswer: answerMap.get(q.id),
          }))
        )
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 py-12">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (!exam || !attempt) {
    return <div className="text-center py-12 text-gray-500">Résultat non trouvé</div>
  }

  const passed = (attempt.final_score || 0) >= exam.pass_mark
  const correctCount = questions.filter(q => q.userAnswer?.is_correct).length
  const totalQuestions = questions.length

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/student/exam" className="text-sm text-gray-500 hover:text-blue-600 mb-2 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Retour aux examens
        </Link>
      </div>

      {/* Score Card */}
      <div className={`rounded-2xl shadow-lg p-8 mb-8 text-center ${
        passed ? 'bg-linear-to-br from-green-500 to-green-600' : 'bg-linear-to-br from-red-500 to-red-600'
      }`}>
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
          {passed ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          )}
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">{exam.title}</h1>
        <p className="text-white/80 text-sm mb-4">{exam.faculty} • {exam.matiere}</p>
        <div className="text-5xl font-extrabold text-white mb-2">
          {Math.round(attempt.final_score || 0)}%
        </div>
        <p className="text-white/90 text-lg font-medium">{passed ? 'Réussite' : 'Échec'}</p>
        <div className="flex items-center justify-center gap-6 mt-4 text-white/80 text-sm">
          <span>{correctCount}/{totalQuestions} correctes</span>
          <span>Note de passage: {exam.pass_mark}%</span>
        </div>
      </div>

      {/* Question Review */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Révision des réponses</h2>
        {questions.map((q, i) => {
          const userAnswer = q.userAnswer
          const isCorrect = userAnswer?.is_correct
          const selectedId = userAnswer?.selected_option_id
          const correctOption = (q.options || []).find((o: ExamAnswerOption) => o.is_correct)

          return (
            <div key={q.id} className={`bg-white rounded-xl shadow-md p-5 border-l-4 ${
              isCorrect ? 'border-l-green-500' : selectedId ? 'border-l-red-500' : 'border-l-gray-300'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Question {i + 1}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isCorrect ? 'bg-green-100 text-green-700' : selectedId ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isCorrect ? `+${q.marks}` : '0'} / {q.marks} pt{q.marks > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-gray-900 font-medium mb-3">{q.question_text}</p>
              <div className="space-y-2">
                {(q.options || []).map((opt: ExamAnswerOption) => {
                  const isUserSelection = opt.id === selectedId
                  const isRightAnswer = opt.is_correct

                  return (
                    <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                      isRightAnswer ? 'bg-green-50 border border-green-200' :
                      isUserSelection && !isRightAnswer ? 'bg-red-50 border border-red-200' :
                      'bg-gray-50 border border-gray-100'
                    }`}>
                      {isRightAnswer && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-600 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                      {isUserSelection && !isRightAnswer && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-600 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      )}
                      {!isRightAnswer && !isUserSelection && <span className="w-5 h-5 shrink-0" />}
                      <span className={`${isRightAnswer ? 'text-green-800 font-medium' : isUserSelection ? 'text-red-800' : 'text-gray-600'}`}>
                        {opt.option_text}
                      </span>
                      {isUserSelection && <span className="ml-auto text-xs text-gray-400">(Votre réponse)</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
