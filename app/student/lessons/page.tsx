'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/app/component/db'
import Link from 'next/link'

interface Lesson {
  id: number
  title: string
  description: string
  faculty: string
  matiere: string
  year: number
  lesson_type: string
  youtube_url: string
  duration_minutes: number
  sort_order: number
  created_at: string
}

interface LessonProgress {
  lesson_id: number
  progress_percent: number
  completed: boolean
}

const TYPE_INFO: Record<string, { icon: string; color: string; label: string }> = {
  lesson: { icon: '📖', color: 'bg-blue-100 text-blue-700', label: 'Leçon' },
  lecture: { icon: '🎓', color: 'bg-purple-100 text-purple-700', label: 'Cours' },
  video: { icon: '🎬', color: 'bg-red-100 text-red-700', label: 'Vidéo' },
  quiz: { icon: '📝', color: 'bg-green-100 text-green-700', label: 'Quiz' },
  audio: { icon: '🎧', color: 'bg-orange-100 text-orange-700', label: 'Audio' },
}

export default function StudentLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<Map<number, LessonProgress>>(new Map())
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<number | null>(null)
  const [studentFaculty, setStudentFaculty] = useState('')

  // Filters
  const [filterMatiere, setFilterMatiere] = useState('')
  const [filterType, setFilterType] = useState('')
  const [matieres, setMatieres] = useState<string[]>([])

  useEffect(() => {
    loadStudentAndLessons()
  }, [])

  useEffect(() => {
    if (studentFaculty) loadLessons()
  }, [filterMatiere, filterType, studentFaculty])

  const loadStudentAndLessons = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setLoading(false); return }

    const { data: student } = await supabase
      .from('student')
      .select('id, faculty')
      .eq('email', user.email)
      .maybeSingle()

    if (student) {
      setStudentId(student.id)
      setStudentFaculty(student.faculty)
    }
    setLoading(false)
  }

  const loadLessons = async () => {
    if (!studentFaculty) return
    setLoading(true)

    let query = supabase
      .from('lesson')
      .select('*')
      .eq('faculty', studentFaculty)
      .eq('is_published', true)
      .order('sort_order')
      .order('created_at', { ascending: false })

    if (filterMatiere) query = query.eq('matiere', filterMatiere)
    if (filterType) query = query.eq('lesson_type', filterType)

    const { data } = await query
    if (data) {
      setLessons(data)
      const uniqueMatieres = [...new Set(data.map(l => l.matiere))]
      setMatieres(uniqueMatieres)
    }

    // Load progress
    if (studentId) {
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('lesson_id, progress_percent, completed')
        .eq('student_id', studentId)

      if (progressData) {
        const map = new Map<number, LessonProgress>()
        progressData.forEach(p => map.set(p.lesson_id, p))
        setProgress(map)
      }
    }
    setLoading(false)
  }

  // Overall progress
  const totalLessons = lessons.length
  const completedLessons = Array.from(progress.values()).filter(p => p.completed).length
  const overallPercent = totalLessons > 0
    ? Math.round(Array.from(progress.values()).reduce((sum, p) => sum + p.progress_percent, 0) / totalLessons)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mes Cours</h1>
        <p className="text-gray-600 mt-1">Accédez à vos leçons, vidéos et matériels pédagogiques</p>
      </div>

      {/* Overall Progress Card */}
      {totalLessons > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold opacity-90">Progression Globale</h2>
              <p className="text-4xl font-bold mt-1">{overallPercent}%</p>
              <p className="opacity-80 text-sm mt-1">{completedLessons}/{totalLessons} leçons complétées</p>
            </div>
            <div className="w-full md:w-64">
              <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterMatiere} onChange={e => setFilterMatiere(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition text-sm bg-white">
          <option value="">Toutes les matières</option>
          {matieres.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition text-sm bg-white">
          <option value="">Tous les types</option>
          {Object.entries(TYPE_INFO).map(([value, info]) => (
            <option key={value} value={value}>{info.icon} {info.label}</option>
          ))}
        </select>
        {(filterMatiere || filterType) && (
          <button onClick={() => { setFilterMatiere(''); setFilterType('') }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Lessons List */}
      {lessons.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-md">
          <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-gray-500 text-lg font-medium">Aucune leçon disponible</p>
          <p className="text-gray-400 mt-1">Les cours seront disponibles bientôt</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Group by matiere */}
          {(() => {
            const grouped = new Map<string, Lesson[]>()
            lessons.forEach(l => {
              const arr = grouped.get(l.matiere) || []
              arr.push(l)
              grouped.set(l.matiere, arr)
            })
            return Array.from(grouped.entries()).map(([matiere, lessonGroup]) => (
              <div key={matiere} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">{matiere}</h3>
                  <p className="text-gray-300 text-sm">{lessonGroup.length} leçon(s)</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {lessonGroup.map((lesson, idx) => {
                    const prog = progress.get(lesson.id)
                    const ti = TYPE_INFO[lesson.lesson_type] || TYPE_INFO.lesson
                    return (
                      <Link href={`/student/lessons/${lesson.id}`} key={lesson.id}
                        className="flex items-center gap-4 p-4 hover:bg-blue-50/50 transition group">
                        {/* Index/Status */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                          prog?.completed ? 'bg-green-500 text-white' : prog ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {prog?.completed ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : idx + 1}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">{lesson.title}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ti.color}`}>{ti.icon} {ti.label}</span>
                          </div>
                          {lesson.description && (
                            <p className="text-gray-500 text-sm mt-0.5 truncate">{lesson.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            {lesson.duration_minutes > 0 && <span>{lesson.duration_minutes} min</span>}
                            <span>Année {lesson.year}</span>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="shrink-0 w-24 hidden sm:block">
                          {prog ? (
                            <div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${prog.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                                  style={{ width: `${prog.progress_percent}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1 text-center">{prog.progress_percent}%</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Non commencé</span>
                          )}
                        </div>

                        {/* Arrow */}
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))
          })()}
        </div>
      )}
    </div>
  )
}
