'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/app/component/db'
import { useParams, useRouter } from 'next/navigation'
import VideoPlayer from '@/app/component/video-player/video-player'
import Link from 'next/link'

interface Lesson {
  id: number
  title: string
  description: string
  content: string
  faculty: string
  matiere: string
  year: number
  lesson_type: string
  youtube_url: string
  duration_minutes: number
  material_url: string
  created_at: string
  updated_at: string
}

interface Progress {
  id?: number
  progress_percent: number
  completed: boolean
  last_position_seconds: number
}

export default function LessonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = parseInt(params.lessonId as string)

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [progress, setProgress] = useState<Progress>({ progress_percent: 0, completed: false, last_position_seconds: 0 })
  const [studentId, setStudentId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [adjacentLessons, setAdjacentLessons] = useState<{ prev: Lesson | null; next: Lesson | null }>({ prev: null, next: null })

  useEffect(() => {
    loadData()
  }, [lessonId])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setLoading(false); return }

    // Get student
    const { data: student } = await supabase.from('student').select('id, faculty').eq('email', user.email).maybeSingle()
    if (student) setStudentId(student.id)

    // Get lesson
    const { data: lessonData } = await supabase.from('lesson').select('*').eq('id', lessonId).single()
    if (lessonData) {
      setLesson(lessonData)

      // Get adjacent lessons (same matiere)
      const { data: allLessons } = await supabase
        .from('lesson')
        .select('id, title, lesson_type, sort_order')
        .eq('faculty', lessonData.faculty)
        .eq('matiere', lessonData.matiere)
        .eq('is_published', true)
        .order('sort_order')
        .order('created_at')

      if (allLessons) {
        const idx = allLessons.findIndex(l => l.id === lessonId)
        setAdjacentLessons({
          prev: idx > 0 ? allLessons[idx - 1] as any : null,
          next: idx < allLessons.length - 1 ? allLessons[idx + 1] as any : null,
        })
      }
    }

    // Get progress
    if (student) {
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('student_id', student.id)
        .eq('lesson_id', lessonId)
        .maybeSingle()

      if (progressData) {
        setProgress({
          id: progressData.id,
          progress_percent: progressData.progress_percent,
          completed: progressData.completed,
          last_position_seconds: progressData.last_position_seconds || 0,
        })
      }
    }

    setLoading(false)
  }

  const saveProgress = useCallback(async (percent: number, position: number) => {
    if (!studentId || !lessonId) return
    const completed = percent >= 90
    const newProgress = {
      student_id: studentId,
      lesson_id: lessonId,
      progress_percent: Math.min(percent, 100),
      completed,
      last_position_seconds: Math.floor(position),
      ...(completed ? { completed_at: new Date().toISOString() } : {}),
    }

    if (progress.id) {
      await supabase.from('lesson_progress').update(newProgress).eq('id', progress.id)
    } else {
      const { data } = await supabase.from('lesson_progress').insert([newProgress]).select('id').single()
      if (data) setProgress(prev => ({ ...prev, id: data.id }))
    }

    setProgress(prev => ({ ...prev, progress_percent: percent, completed }))
  }, [studentId, lessonId, progress.id])

  const handleVideoProgress = useCallback((percent: number, currentTime: number) => {
    // Save every 10 seconds of video
    if (Math.floor(currentTime) % 10 === 0 && percent > progress.progress_percent) {
      saveProgress(percent, currentTime)
    }
  }, [progress.progress_percent, saveProgress])

  const markComplete = async () => {
    await saveProgress(100, 0)
  }

  const markIncomplete = async () => {
    if (!progress.id) return
    await supabase.from('lesson_progress').update({
      progress_percent: 0,
      completed: false,
      completed_at: null,
      last_position_seconds: 0,
    }).eq('id', progress.id)
    setProgress(prev => ({ ...prev, progress_percent: 0, completed: false }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <p className="text-gray-600 text-lg">Leçon introuvable</p>
          <Link href="/student/lessons" className="text-blue-600 hover:underline mt-4 inline-block">← Retour aux cours</Link>
        </div>
      </div>
    )
  }

  const TYPE_LABELS: Record<string, string> = {
    lesson: '📖 Leçon',
    lecture: '🎓 Cours Magistral',
    video: '🎬 Vidéo',
    quiz: '📝 Quiz',
    audio: '🎧 Audio',
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
        <Link href="/student/lessons" className="hover:text-blue-600 transition">Mes Cours</Link>
        <span>/</span>
        <span className="text-gray-400">{lesson.matiere}</span>
        <span>/</span>
        <span className="text-gray-700 font-medium">{lesson.title}</span>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progression</span>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold ${progress.completed ? 'text-green-600' : 'text-blue-600'}`}>
              {progress.progress_percent}%
            </span>
            {progress.completed ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Complété ✓</span>
            ) : null}
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progress.completed ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress.progress_percent}%` }}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-6">
        {/* Video Player */}
        {lesson.lesson_type === 'video' && lesson.youtube_url && (
          <div className="bg-black">
            <VideoPlayer
              youtubeUrl={lesson.youtube_url}
              title={lesson.title}
              onProgress={handleVideoProgress}
              initialPosition={progress.last_position_seconds}
            />
          </div>
        )}

        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm text-gray-500">{TYPE_LABELS[lesson.lesson_type]}</span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-500">{lesson.faculty}</span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-500">Année {lesson.year}</span>
                {lesson.duration_minutes > 0 && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-500">{lesson.duration_minutes} min</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-gray-600 mt-2">{lesson.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              {progress.completed ? (
                <button onClick={markIncomplete}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                  Marquer comme non lu
                </button>
              ) : (
                <button onClick={markComplete}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition shadow-md">
                  Marquer comme terminé
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        {lesson.content && (
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contenu de la leçon</h2>
            <div className="prose prose-gray max-w-none whitespace-pre-wrap leading-relaxed text-gray-700">
              {lesson.content}
            </div>
          </div>
        )}

        {/* Material download */}
        {lesson.material_url && (
          <div className="px-6 pb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Matériel pédagogique</p>
                  <p className="text-sm text-gray-600">Téléchargez les ressources pour cette leçon</p>
                </div>
              </div>
              <a href={lesson.material_url} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Télécharger
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Navigation between lessons */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {adjacentLessons.prev ? (
          <Link href={`/student/lessons/${adjacentLessons.prev.id}`}
            className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-md border border-gray-100 hover:border-blue-300 hover:shadow-lg transition group flex-1">
            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Précédent</p>
              <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">{adjacentLessons.prev.title}</p>
            </div>
          </Link>
        ) : <div className="flex-1" />}

        {adjacentLessons.next ? (
          <Link href={`/student/lessons/${adjacentLessons.next.id}`}
            className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-md border border-gray-100 hover:border-blue-300 hover:shadow-lg transition group flex-1 justify-end text-right">
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Suivant</p>
              <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">{adjacentLessons.next.title}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        ) : <div className="flex-1" />}
      </div>
    </div>
  )
}
