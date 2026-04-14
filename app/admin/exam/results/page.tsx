'use client'
import { supabase } from "@/app/component/db"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import type { OnlineExam, ExamAttempt, ExamEventLog } from "@/app/component/exam/types"

export default function ExamResultsPage() {
  const searchParams = useSearchParams()
  const examId = searchParams.get('exam_id')

  const [exam, setExam] = useState<OnlineExam | null>(null)
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAttempt, setSelectedAttempt] = useState<number | null>(null)
  const [eventLogs, setEventLogs] = useState<ExamEventLog[]>([])
  const [showLogs, setShowLogs] = useState(false)

  useEffect(() => {
    if (examId) fetchData()
  }, [examId])

  const fetchData = async () => {
    setLoading(true)
    const [examRes, attRes] = await Promise.all([
      supabase.from('online_exam').select('*').eq('id', examId).single(),
      supabase
        .from('exam_attempt')
        .select('*, student:student_id(first_name, last_name, student_code, faculty)')
        .eq('exam_id', examId!)
        .order('created_at', { ascending: false }),
    ])

    if (examRes.data) setExam(examRes.data as OnlineExam)
    if (attRes.data) setAttempts(attRes.data as ExamAttempt[])
    setLoading(false)
  }

  const viewLogs = async (attemptId: number) => {
    setSelectedAttempt(attemptId)
    setShowLogs(true)
    const { data } = await supabase
      .from('exam_event_log')
      .select('*')
      .eq('attempt_id', attemptId)
      .order('created_at', { ascending: true })
    if (data) setEventLogs(data as ExamEventLog[])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 py-12">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (!exam) {
    return <div className="text-center py-12 text-gray-500">Examen non trouvé</div>
  }

  const submitted = attempts.filter(a => a.status === 'submitted' || a.status === 'graded')
  const avgScore = submitted.length > 0
    ? Math.round(submitted.reduce((s, a) => s + (a.final_score || 0), 0) / submitted.length * 100) / 100
    : 0
  const passCount = submitted.filter(a => (a.final_score || 0) >= exam.pass_mark).length
  const flaggedCount = attempts.filter(a => a.flagged_for_review).length

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <a href="/admin/exam" className="text-sm text-gray-500 hover:text-blue-600 mb-2 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Retour aux examens
        </a>
        <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
        <p className="text-gray-600 mt-1">{exam.faculty} • {exam.matiere} • Année {exam.year_study} • {exam.duration_minutes} min</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-sm text-gray-500 font-semibold">Tentatives</p>
          <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-sm text-gray-500 font-semibold">Soumis</p>
          <p className="text-2xl font-bold text-blue-600">{submitted.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-sm text-gray-500 font-semibold">Moyenne</p>
          <p className="text-2xl font-bold text-gray-900">{avgScore}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-sm text-gray-500 font-semibold">Réussite</p>
          <p className="text-2xl font-bold text-green-600">{passCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-sm text-gray-500 font-semibold">Signalés</p>
          <p className={`text-2xl font-bold ${flaggedCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{flaggedCount}</p>
        </div>
      </div>

      {/* Attempts Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">Étudiant</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">Statut</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">Score</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase hidden md:table-cell">Début</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase hidden sm:table-cell">Tab Sw.</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase hidden sm:table-cell">Suspicion</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Aucune tentative</td>
                </tr>
              ) : (
                attempts.map(attempt => (
                  <tr key={attempt.id} className={`hover:bg-gray-50 transition-colors ${attempt.flagged_for_review ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">
                        {attempt.student?.first_name} {attempt.student?.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{attempt.student?.student_code}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        attempt.status === 'submitted' || attempt.status === 'graded'
                          ? 'bg-green-100 text-green-700'
                          : attempt.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {attempt.status === 'in_progress' ? 'En cours' :
                         attempt.status === 'submitted' ? 'Soumis' :
                         attempt.status === 'graded' ? 'Noté' : 'Abandonné'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {attempt.final_score !== null ? (
                        <span className={`font-bold text-sm ${
                          attempt.final_score >= exam.pass_mark ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.round(attempt.final_score)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600 hidden md:table-cell">
                      {new Date(attempt.start_time).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`text-sm font-medium ${attempt.tab_switch_count > 2 ? 'text-red-600' : 'text-gray-600'}`}>
                        {attempt.tab_switch_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`text-sm font-medium ${attempt.suspicion_score > 1 ? 'text-red-600' : 'text-gray-600'}`}>
                        {attempt.suspicion_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => viewLogs(attempt.id)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                      >
                        Voir logs
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowLogs(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Journal Anti-Triche</h3>
              <button onClick={() => setShowLogs(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {eventLogs.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucun événement enregistré</p>
              ) : (
                <div className="space-y-2">
                  {eventLogs.map(log => (
                    <div key={log.id} className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                      log.severity === 'critical' ? 'bg-red-50 border border-red-200' :
                      log.severity === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-gray-50 border border-gray-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        log.severity === 'critical' ? 'bg-red-500' :
                        log.severity === 'warning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <span className="font-medium text-gray-700 capitalize">{log.event_type.replace('_', ' ')}</span>
                      {log.details && <span className="text-gray-500">— {log.details}</span>}
                      <span className="ml-auto text-gray-400 text-xs shrink-0">
                        {new Date(log.created_at).toLocaleTimeString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
