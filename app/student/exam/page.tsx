'use client'
import { supabase } from "@/app/component/db"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { OnlineExam, ExamAttempt } from "@/app/component/exam/types"

export default function StudentExamListPage() {
  const router = useRouter()
  const [exams, setExams] = useState<(OnlineExam & { question_count: number })[]>([])
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [studentId, setStudentId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get student record
      const { data: student } = await supabase
        .from('student')
        .select('id, faculty')
        .eq('email', user.email)
        .single()

      if (!student) { setError('Profil étudiant non trouvé'); setLoading(false); return }
      setStudentId(student.id)

      // Get student status for year_study
      const { data: status } = await supabase
        .from('student_status')
        .select('year_study')
        .eq('student_id', student.id)
        .single()

      const yearStudy = status?.year_study || 1

      // Get published exams for this student's faculty/year
      const { data: examData } = await supabase
        .from('online_exam')
        .select('*')
        .eq('is_published', true)
        .eq('faculty', student.faculty)
        .eq('year_study', yearStudy)
        .order('created_at', { ascending: false })

      // Get question counts for each exam
      const examsWithCounts: (OnlineExam & { question_count: number })[] = []
      if (examData) {
        for (const exam of examData) {
          const { count } = await supabase
            .from('exam_question')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id)
          examsWithCounts.push({ ...exam as OnlineExam, question_count: count || 0 })
        }
      }
      setExams(examsWithCounts)

      // Get student's attempts
      const { data: att } = await supabase
        .from('exam_attempt')
        .select('*')
        .eq('student_id', student.id)

      if (att) setAttempts(att as ExamAttempt[])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const startExam = async (exam: OnlineExam) => {
    if (!studentId) return

    // Check if within date window
    const now = new Date()
    if (exam.start_date && new Date(exam.start_date) > now) {
      alert('Cet examen n\'a pas encore commencé')
      return
    }
    if (exam.end_date && new Date(exam.end_date) < now) {
      alert('Cet examen est terminé')
      return
    }

    // Check existing attempt
    const existing = attempts.find(a => a.exam_id === exam.id)
    if (existing) {
      if (existing.status === 'submitted' || existing.status === 'graded') {
        alert('Vous avez déjà soumis cet examen')
        return
      }
      // Resume in-progress attempt
      router.push(`/student/exam/${exam.id}/attempt/${existing.id}`)
      return
    }

    // Confirm start
    if (!confirm(`Commencer "${exam.title}" ?\n\nDurée: ${exam.duration_minutes} minutes\nQuestions: ${(exam as any).question_count || '?'}\n\nUne fois commencé, le chronomètre ne s'arrête pas.`)) return

    // Create attempt
    const { data: attempt, error } = await supabase
      .from('exam_attempt')
      .insert({
        exam_id: exam.id,
        student_id: studentId,
        status: 'in_progress',
      })
      .select('id')
      .single()

    if (error) {
      alert('Erreur: ' + error.message)
      return
    }

    router.push(`/student/exam/${exam.id}/attempt/${attempt.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 py-12">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes Examens</h1>
        <p className="text-gray-600 mt-1">Examens en ligne disponibles pour votre filière</p>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 opacity-50">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.251 2.251 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
          </svg>
          <p className="text-lg font-medium">Aucun examen disponible</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map(exam => {
            const attempt = attempts.find(a => a.exam_id === exam.id)
            const isCompleted = attempt?.status === 'submitted' || attempt?.status === 'graded'
            const isInProgress = attempt?.status === 'in_progress'
            const now = new Date()
            const notStarted = exam.start_date ? new Date(exam.start_date) > now : false
            const expired = exam.end_date ? new Date(exam.end_date) < now : false

            return (
              <div key={exam.id} className={`bg-white rounded-xl shadow-md p-5 border transition-all ${
                isCompleted ? 'border-green-200 bg-green-50/30' :
                isInProgress ? 'border-yellow-200 bg-yellow-50/30' :
                'border-gray-100 hover:shadow-lg'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          Terminé {attempt?.final_score !== null ? `— ${Math.round(attempt!.final_score!)}%` : ''}
                        </span>
                      )}
                      {isInProgress && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">En cours</span>
                      )}
                      {notStarted && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">Pas encore</span>
                      )}
                      {expired && !isCompleted && !isInProgress && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">Expiré</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{exam.matiere} • {exam.duration_minutes} min • {exam.question_count} questions</p>
                    {exam.description && <p className="text-sm text-gray-400 mt-1">{exam.description}</p>}
                    {exam.start_date && (
                      <p className="text-xs text-gray-400 mt-1">
                        Du {new Date(exam.start_date).toLocaleDateString('fr-FR')}
                        {exam.end_date && ` au ${new Date(exam.end_date).toLocaleDateString('fr-FR')}`}
                      </p>
                    )}
                  </div>
                  <div>
                    {isCompleted ? (
                      <button
                        onClick={() => router.push(`/student/exam/${exam.id}/result/${attempt!.id}`)}
                        className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                      >
                        Voir résultat
                      </button>
                    ) : isInProgress ? (
                      <button
                        onClick={() => startExam(exam)}
                        className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm"
                      >
                        Reprendre
                      </button>
                    ) : (!notStarted && !expired) ? (
                      <button
                        onClick={() => startExam(exam)}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        Commencer
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
