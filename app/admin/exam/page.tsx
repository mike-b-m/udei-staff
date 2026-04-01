'use client'
import { supabase } from "@/app/component/db";
import { useState, useEffect } from "react";
import { FACULTIES } from "@/app/component/student-infos/constants";
import { getGradeInfo } from "@/app/lib/gpa";

interface ExamRecord {
  id: number
  student_id: number
  matière: string
  intra: number | null
  final: number | null
  reprise: number | null
  session: number
  year: number
  student?: { first_name: string; last_name: string; student_code: string; faculty: string }
}

interface Course {
  id: number
  course_name: string
  faculty: string
  credits: number
  semester: number
}

export default function Exam() {
  const [exams, setExams] = useState<ExamRecord[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterFaculty, setFilterFaculty] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterSession, setFilterSession] = useState('')
  const [filterYear, setFilterYear] = useState('')

  // Edit mode
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState({ intra: '', final: '', reprise: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [examRes, courseRes] = await Promise.all([
      supabase.from('exam').select(`
        *,
        student:student_id(first_name, last_name, student_code, faculty)
      `).order('id', { ascending: false }),
      supabase.from('course_program').select('*').order('faculty')
    ])

    if (examRes.data) setExams(examRes.data as unknown as ExamRecord[])
    if (courseRes.data) setCourses(courseRes.data as unknown as Course[])
    setLoading(false)
  }

  const handleEdit = (exam: ExamRecord) => {
    setEditId(exam.id)
    setEditData({
      intra: exam.intra?.toString() || '',
      final: exam.final?.toString() || '',
      reprise: exam.reprise?.toString() || ''
    })
  }

  const handleSave = async () => {
    if (!editId) return
    const { error } = await supabase.from('exam').update({
      intra: editData.intra ? parseFloat(editData.intra) : null,
      final: editData.final ? parseFloat(editData.final) : null,
      reprise: editData.reprise ? parseFloat(editData.reprise) : null,
    }).eq('id', editId)

    if (!error) {
      setExams(prev => prev.map(e =>
        e.id === editId ? {
          ...e,
          intra: editData.intra ? parseFloat(editData.intra) : null,
          final: editData.final ? parseFloat(editData.final) : null,
          reprise: editData.reprise ? parseFloat(editData.reprise) : null,
        } : e
      ))
      setEditId(null)
    }
  }

  const filteredExams = exams.filter(e => {
    if (filterFaculty && e.student?.faculty !== filterFaculty) return false
    if (filterCourse && e.matière !== filterCourse) return false
    if (filterSession && e.session !== parseInt(filterSession)) return false
    if (filterYear && e.year !== parseInt(filterYear)) return false
    return true
  })

  // Stats
  const totalExams = filteredExams.length
  const passCount = filteredExams.filter(e => {
    const score = e.reprise ?? e.final ?? 0
    return (score as number) >= 50
  }).length
  const failCount = totalExams - passCount
  const passRate = totalExams > 0 ? Math.round((passCount / totalExams) * 100) : 0

  const filteredCourses = filterFaculty
    ? courses.filter(c => c.faculty === filterFaculty)
    : courses

  const uniqueYears = [...new Set(exams.map(e => e.year).filter(Boolean))].sort((a, b) => b - a)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 py-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Examens</h1>
        <p className="text-gray-600">Consultez et gérez les notes des étudiants</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-sm text-gray-500 font-semibold">Total Examens</p>
          <p className="text-2xl font-bold text-gray-900">{totalExams}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-sm text-gray-500 font-semibold">Réussite</p>
          <p className="text-2xl font-bold text-green-600">{passCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-sm text-gray-500 font-semibold">Échec</p>
          <p className="text-2xl font-bold text-red-600">{failCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-sm text-gray-500 font-semibold">Taux de Réussite</p>
          <p className="text-2xl font-bold text-blue-600">{passRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filterFaculty}
            onChange={e => { setFilterFaculty(e.target.value); setFilterCourse('') }}
            className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">Toutes les facultés</option>
            {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
            className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">Tous les cours</option>
            {filteredCourses.map(c => (
              <option key={c.id} value={c.course_name}>{c.course_name}</option>
            ))}
          </select>
          <select
            value={filterSession}
            onChange={e => setFilterSession(e.target.value)}
            className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">Toutes les sessions</option>
            <option value="1">Session 1</option>
            <option value="2">Session 2</option>
          </select>
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">Toutes les années</option>
            {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Exams Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">Étudiant</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase hidden md:table-cell">Matière</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">Intra</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">Final</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase hidden sm:table-cell">Reprise</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">Note</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase hidden lg:table-cell">Session</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Aucun examen trouvé
                  </td>
                </tr>
              ) : (
                filteredExams.map(exam => {
                  const finalScore = exam.reprise ?? exam.final ?? 0
                  const gradeInfo = getGradeInfo(finalScore as number)
                  const isEditing = editId === exam.id

                  return (
                    <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">
                          {exam.student?.last_name} {exam.student?.first_name}
                        </div>
                        <div className="text-xs text-gray-500">{exam.student?.student_code}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 hidden md:table-cell">{exam.matière}</td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input type="number" value={editData.intra}
                            onChange={e => setEditData(p => ({ ...p, intra: e.target.value }))}
                            className="w-16 px-2 py-1 border rounded text-center text-sm"
                            min="0" max="100" />
                        ) : (
                          <span className="text-sm">{exam.intra ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input type="number" value={editData.final}
                            onChange={e => setEditData(p => ({ ...p, final: e.target.value }))}
                            className="w-16 px-2 py-1 border rounded text-center text-sm"
                            min="0" max="100" />
                        ) : (
                          <span className="text-sm">{exam.final ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {isEditing ? (
                          <input type="number" value={editData.reprise}
                            onChange={e => setEditData(p => ({ ...p, reprise: e.target.value }))}
                            className="w-16 px-2 py-1 border rounded text-center text-sm"
                            min="0" max="100" />
                        ) : (
                          <span className="text-sm">{exam.reprise ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          gradeInfo.status === 'Réussite' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {gradeInfo.letter}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 hidden lg:table-cell">
                        S{exam.session}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex gap-1 justify-center">
                            <button onClick={handleSave}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                              ✓
                            </button>
                            <button onClick={() => setEditId(null)}
                              className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500">
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => handleEdit(exam)}
                            className="px-3 py-1 text-blue-600 hover:bg-blue-50 text-xs font-semibold rounded transition">
                            Modifier
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}