'use client'
import { supabase } from "@/app/component/db";
import { useState, useEffect } from "react";
import { useFaculties } from "@/app/component/student-infos/useFaculties";
import { getGradeInfo } from "@/app/lib/gpa";
import Link from "next/link";
import type { OnlineExam, ExamAttempt } from "@/app/component/exam/types";
import { exportToCSV, printHTML } from "@/app/component/export/exportUtils";

interface ExamRecord {
  id: number
  student_id: number
  matiere: string
  note: number | null
  repri_note: number | null
  session: number
  year: number
  faculty: string
  academic_year: string
  student_code: string
  credit: number
  pass_grade: number
  student?: { first_name: string; last_name: string; student_code: string; faculty: string }
}

interface Course {
  id: number
  course_name: string
  faculty: string
  credits: number
  semester: number
}

function Fullname({ id }: { id: number | undefined }) {
  const [fullname, setFullname] = useState<any[]>([])
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [examRes,] = await Promise.all([
      supabase.from('student').select(`
        last_name, first_name
      `).eq('id', id)
    ])

    if (examRes.data) setFullname(examRes.data as unknown as any[])
  }

  return(
    <span>{fullname.map((name, index) => (
      <span key={index}>{name.first_name} {name.last_name}</span>
    ))}</span>
  )
}

// ============ Online Exams Tab ============
function OnlineExamsTab() {
  const { facultyNames } = useFaculties()
  const [onlineExams, setOnlineExams] = useState<OnlineExam[]>([])
  const [attempts, setAttempts] = useState<Record<number, ExamAttempt[]>>({})
  const [loading, setLoading] = useState(true)
  const [filterFaculty, setFilterFaculty] = useState('')

  useEffect(() => { fetchOnlineExams() }, [])

  const fetchOnlineExams = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('online_exam')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setOnlineExams(data as OnlineExam[])
      // Fetch attempt counts per exam
      const attemptMap: Record<number, ExamAttempt[]> = {}
      for (const exam of data) {
        const { data: att } = await supabase
          .from('exam_attempt')
          .select('*, student:student_id(first_name, last_name, student_code, faculty)')
          .eq('exam_id', exam.id)
          .order('created_at', { ascending: false })
        if (att) attemptMap[exam.id] = att as ExamAttempt[]
      }
      setAttempts(attemptMap)
    }
    setLoading(false)
  }

  const togglePublish = async (exam: OnlineExam) => {
    const { error } = await supabase
      .from('online_exam')
      .update({ is_published: !exam.is_published })
      .eq('id', exam.id)
    if (!error) {
      setOnlineExams(prev => prev.map(e => e.id === exam.id ? { ...e, is_published: !e.is_published } : e))
    }
  }

  const deleteExam = async (id: number) => {
    if (!confirm('Supprimer cet examen et toutes ses données ?')) return
    const { error } = await supabase.from('online_exam').delete().eq('id', id)
    if (!error) setOnlineExams(prev => prev.filter(e => e.id !== id))
  }

  const filtered = filterFaculty ? onlineExams.filter(e => e.faculty === filterFaculty) : onlineExams

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <select value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">
          <option value="">Toutes les facultés</option>
          {facultyNames.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <Link href="/admin/exam/create"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
          + Créer un examen en ligne
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">Aucun examen en ligne créé</p>
          <p className="text-sm mt-1">Créez votre premier examen interactif</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(exam => {
            const examAttempts = attempts[exam.id] || []
            const submitted = examAttempts.filter(a => a.status === 'submitted' || a.status === 'graded')
            const avgScore = submitted.length > 0
              ? Math.round(submitted.reduce((s, a) => s + (a.final_score || 0), 0) / submitted.length)
              : null
            const flagged = examAttempts.filter(a => a.flagged_for_review).length

            return (
              <div key={exam.id} className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        exam.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {exam.is_published ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {exam.faculty} • {exam.matiere} • Année {exam.year_study} • S{exam.session} • {exam.duration_minutes} min
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Tentatives: <strong className="text-gray-700">{examAttempts.length}</strong></span>
                      <span>Soumis: <strong className="text-gray-700">{submitted.length}</strong></span>
                      {avgScore !== null && <span>Moy: <strong className="text-blue-600">{avgScore}%</strong></span>}
                      {flagged > 0 && <span className="text-red-600">Signalés: <strong>{flagged}</strong></span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/exam/results?exam_id=${exam.id}`}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                      Résultats
                    </Link>
                    <button onClick={() => togglePublish(exam)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
                        exam.is_published ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'
                      }`}>
                      {exam.is_published ? 'Dépublier' : 'Publier'}
                    </button>
                    <button onClick={() => deleteExam(exam.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                      Supprimer
                    </button>
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

interface AcademicRosterRow {
  student_id: number
  first_name: string
  last_name: string
  student_code: string
  faculty: string
  year_study: number | string | null
  academic_year: string
  id?: number
}

function escapeHTML(value: string | number | null | undefined) {
  return String(value ?? '').replace(/[&<>\"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character)
}

function AcademicYearRosterTab() {
  const [rows, setRows] = useState<AcademicRosterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAcademicYear, setFilterAcademicYear] = useState('')
  const [filterFaculty, setFilterFaculty] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchRoster() {
      setLoading(true)
      const { data: statuses, error: statusError } = await supabase
        .from('exam_1')
        .select('student_id, year, academic_year, faculty')

      if (cancelled) return
      if (statusError) {
        console.error('Error fetching academic-year roster:', statusError.message)
        setRows([])
        setLoading(false)
        return
      }

      const studentIds = [...new Set((statuses || []).map(status => status.student_id))]
      if (studentIds.length === 0) {
        setRows([])
        setLoading(false)
        return
      }

      const { data: students, error: studentError } = await supabase
        .from('student')
        .select('id, first_name, last_name, student_code, faculty')
        .in('id', studentIds)

      if (cancelled) return
      if (studentError) {
        console.error('Error fetching roster student details:', studentError.message)
        setRows([])
        setLoading(false)
        return
      }

      const studentById = new Map((students || []).map(student => [student.id, student]))
      const roster = (statuses || []).flatMap(status => {
        const student = studentById.get(status.student_id)
        if (!student || !status.academic_year) return []
        return [{
          student_id: student.id,
          first_name: student.first_name || '',
          last_name: student.last_name || '',
          student_code: student.student_code || '',
          faculty: status.faculty || student.faculty || '',
          year_study: status.year,
          academic_year: status.academic_year,
        }]
      }).sort((a, b) => a.last_name.localeCompare(b.last_name))

      setRows(roster)
      setLoading(false)
    }

    fetchRoster()
    return () => { cancelled = true }
  }, [])

  const displayRows =  [...new Set(rows.map(row => row.last_name))].sort((a, b) => b.localeCompare(a))
  const academicYears = [...new Set(rows.map(row => row.academic_year))].sort((a, b) => b.localeCompare(a))
  const faculties = [...new Set(rows.map(row => row.faculty).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const filteredRows = rows.filter(row =>
    (!filterAcademicYear || row.academic_year === filterAcademicYear) &&
    (!filterFaculty || row.faculty === filterFaculty)
  )
  const seenRosterEntries = new Set<string>()
  const uniqueFilteredRows = filteredRows.filter(row => {
    const key = `${row.last_name.trim().toLocaleLowerCase()}\u0000${row.first_name.trim().toLocaleLowerCase()}\u0000${row.academic_year}`
    if (seenRosterEntries.has(key)) return false
    seenRosterEntries.add(key)
    return true
  })

  const exportRows = uniqueFilteredRows.map(row => [
    row.student_code,
    row.last_name,
    row.first_name,
    row.faculty,
    String(row.year_study ?? ''),
    row.academic_year,
  ])
  const rosterTitle = `Étudiants - ${filterAcademicYear || 'Toutes les années académiques'}`
  const tableHTML = `<table><thead><tr><th>Code</th><th>Nom</th><th>Prénom</th><th>Faculté</th><th>Année d'étude</th><th>Année académique</th></tr></thead><tbody>${uniqueFilteredRows.map(row => `<tr>${[
    row.student_code, row.last_name, row.first_name, row.faculty, row.year_study, row.academic_year,
  ].map(value => `<td>${escapeHTML(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>`

  return (
    <section className="bg-white rounded-xl shadow-md p-4 md:p-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:max-w-2xl">
          <label className="text-sm font-medium text-gray-700">
            Année académique
            <select value={filterAcademicYear} onChange={e => setFilterAcademicYear(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
              <option value="">Toutes les années</option>
              {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Faculté
            <select value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
              <option value="">Toutes les facultés</option>
              {faculties.map(faculty => <option key={faculty} value={faculty}>{faculty}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={!uniqueFilteredRows.length} onClick={() => exportToCSV(
            ['Code', 'Nom', 'Prénom', 'Faculté', "Année d'étude", 'Année académique'],
            exportRows,
            `etudiants_${(filterAcademicYear || 'toutes_annees').replace(/[^a-zA-Z0-9_-]/g, '_')}`
          )} className="px-3 py-2 rounded-lg bg-green-700 text-white text-sm font-medium disabled:opacity-50">
            Excel / CSV
          </button>
          <button disabled={!uniqueFilteredRows.length} onClick={() => printHTML(`${rosterTitle} - PDF`, `<h1>${escapeHTML(rosterTitle)}</h1><p>${uniqueFilteredRows.length} étudiant(s)</p>${tableHTML}`)}
            className="px-3 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
            PDF
          </button>
          <button disabled={!uniqueFilteredRows.length} onClick={() => printHTML(rosterTitle, `<h1>${escapeHTML(rosterTitle)}</h1><p>${uniqueFilteredRows.length} étudiant(s)</p>${tableHTML}`)}
            className="px-3 py-2 rounded-lg bg-gray-700 text-white text-sm font-medium disabled:opacity-50">
            Imprimer
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-3">{loading ? 'Chargement...' : `${uniqueFilteredRows.length} étudiant(s)`}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-3 text-left">Code</th>
              <th className="px-3 py-3 text-left">Nom</th>
              <th className="px-3 py-3 text-left">Prénom</th>
              <th className="px-3 py-3 text-left">Faculté</th>
              <th className="px-3 py-3 text-center">Année d&apos;étude</th>
              <th className="px-3 py-3 text-left">Année académique</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && filteredRows.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-10 text-center text-gray-500">Aucun étudiant trouvé</td></tr>
            ) : uniqueFilteredRows.map(row => (
              <tr key={`${row.last_name}-${row.first_name}-${row.academic_year}`}>
                <td className="px-3 py-3">{row.student_code || '—'}</td>
                <td className="px-3 py-3 font-medium">{row.last_name}</td>
                <td className="px-3 py-3">{row.first_name}</td>
                <td className="px-3 py-3">{row.faculty || '—'}</td>
                <td className="px-3 py-3 text-center">{row.year_study ?? '—'}</td>
                <td className="px-3 py-3">{row.academic_year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const DEFAULT_PASS_GRADE = 65
const RETAKE_THRESHOLD = 40

type ResultKey = 'success' | 'fail' | 'retake' | 'none'

// Réussi: score >= pass_grade | À refaire: 40 <= score < pass_grade | Échec: score < 40
function getExamResult(exam: ExamRecord): { key: ResultKey; label: string } {
  const raw = exam.repri_note ?? exam.note
  if (raw === null || raw === undefined) return { key: 'none', label: '—' }
  const score = Number(raw)
  const passGrade = exam.pass_grade || DEFAULT_PASS_GRADE
  if (score >= passGrade) return { key: 'success', label: 'Réussi' }
  if (score < RETAKE_THRESHOLD) return { key: 'fail', label: 'Échec' }
  return { key: 'retake', label: 'À refaire' }
}

const RESULT_STYLES: Record<ResultKey, string> = {
  success: 'bg-green-100 text-green-700',
  fail: 'bg-red-100 text-red-700',
  retake: 'bg-orange-100 text-orange-700',
  none: 'bg-gray-100 text-gray-500',
}
// "1", 1, "1ère année", "Année 1" -> 1 ; anything without a digit -> null
const toStudyYear = (value: unknown): number | null => {
  const match = String(value ?? '').match(/\d+/)
  return match ? Number(match[0]) : null
}
// Supabase returns max 1000 rows per request, so read page by page until everything is loaded.
async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const pageSize = 1000
  const all: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    all.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }
  return all
}
// Letterhead for printed/PDF documents (inline styles so printHTML's own CSS can't override them)
const printHeaderHTML = () => `
  <div style="width:100%;">
    <img src="${window.location.origin}/image/h.png" alt="UDEI Logo" style="width:100%;height:auto;display:block;margin:0;">
  </div>
  <div style="display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:10px;font-size:55%;margin-bottom:15px;padding-bottom:6px;border-bottom:1px solid #ddd;">
    <div>#5 Village Zao, Maïs Gâté 13 (Bloc Gérald bataille) Port-au-Prince HAITI</div>
    <div style="text-align:center;">+(509) 40 03 4090 / +(509) 48809772</div>
  </div>
`
export default function Exam() {
  const { facultyNames } = useFaculties()
  const [exams, setExams] = useState<ExamRecord[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'grades' | 'online' | 'roster'>('online')

  // Filters
  const [filterFaculty, setFilterFaculty] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterSession, setFilterSession] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterAcademicYear, setFilterAcademicYear] = useState('')
  const [filterResult, setFilterResult] = useState<'' | 'success' | 'fail' | 'retake'>('')

  // Edit mode
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState({ note: '', repri_note: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
  setLoading(true)
  try {

    const examData = await fetchAllRows<any>((from, to) =>
      supabase
        .from('exam_1')
        .select('id, created_at, session, year, matiere, note, repri_note, faculty, student_id, academic_year, student_code, credit, pass_grade')
        .order('id', { ascending: true }) // stable order is required for paging
        .range(from, to)
    )

    const studentData = await fetchAllRows<any>((from, to) =>
      supabase
        .from('student')
        .select('id, first_name, last_name, student_code, faculty')
        .order('id', { ascending: true })
        .range(from, to)
    )

    const studentById = new Map(studentData.map(s => [s.id, s]))
    const mergedExams = examData.map(exam => ({
      ...exam,
      student: studentById.get(exam.student_id),
    })) as ExamRecord[]

    mergedExams.sort((a, b) =>
      (a.student?.last_name || '').localeCompare(b.student?.last_name || '')
    )
    setExams(mergedExams)

    const { data: courseData } = await supabase
      .from('course_program')
      .select('*')
      .order('faculty')
    if (courseData) setCourses(courseData as unknown as Course[])
  } catch (err) {
    console.error('Error fetching exams:', err)
  } finally {
    setLoading(false)
  }
}

  const handleEdit = (exam: ExamRecord) => {
    setEditId(exam.id)
    setEditData({
      note: exam.note?.toString() || '',
      repri_note: exam.repri_note?.toString() || ''
    })
  }

  const handleSave = async () => {
    if (!editId) return
    const { error } = await supabase.from('exam_1').update({
      note: editData.note ? parseFloat(editData.note) : null,
      repri_note: editData.repri_note ? parseFloat(editData.repri_note) : null,
    }).eq('id', editId)

    if (error) console.error('Error updating exam:', error.message)
    if (!error) {
      setExams(prev => prev.map(e =>
        e.id === editId ? {
          ...e,
          note: editData.note ? parseFloat(editData.note) : null,
          repri_note: editData.repri_note ? parseFloat(editData.repri_note) : null,
        } : e
      ))
      setEditId(null)
    }
  }

 const filteredExams = exams.filter(e => {
  if (filterFaculty && e.faculty !== filterFaculty) return false
  if (filterCourse && e.matiere !== filterCourse) return false
  if (filterSession && Number(e.session) !== Number(filterSession)) return false
if (filterYear && toStudyYear(e.year) !== Number(filterYear)) return false
  if (filterAcademicYear && e.academic_year !== filterAcademicYear) return false
  if (filterResult && getExamResult(e).key !== filterResult) return false
  return true
})

// Stats
const results = filteredExams.map(getExamResult)
const totalExams = filteredExams.length
const passCount = results.filter(r => r.key === 'success').length
const failCount = results.filter(r => r.key === 'fail').length
const retakeCount = results.filter(r => r.key === 'retake').length
const gradedCount = passCount + failCount + retakeCount
const passRate = gradedCount > 0 ? Math.round((passCount / gradedCount) * 100) : 0

// Matière options follow the selected faculty
const courseOptions = [...new Set(
  exams
    .filter(e => !filterFaculty || e.faculty === filterFaculty)
    .map(e => e.matiere)
    .filter(Boolean)
)].sort((a, b) => a.localeCompare(b))

const uniqueYears = [...new Set(
  exams.map(e => toStudyYear(e.year)).filter((y): y is number => y !== null)
)].sort((a, b) => a - b)
const uniqueAcademicYears = [...new Set(exams.map(e => e.academic_year).filter(Boolean))].sort((a, b) => b.localeCompare(a))

const resetFilters = () => {
  setFilterFaculty(''); setFilterCourse(''); setFilterSession('')
  setFilterYear(''); setFilterAcademicYear(''); setFilterResult('')
}

// ---------- Export (uses the filtered list) ----------
const exportHeaders = ['Étudiant', 'Matière', 'Note', 'Reprise', 'Résultat']
const studentLabel = (e: ExamRecord) =>
  `${e.student?.last_name ?? ''} ${e.student?.first_name ?? ''}`.trim() || e.student_code || '—'

const buildExportRows = () =>
  filteredExams.map(e => {
    const r = getExamResult(e)
    return [
      studentLabel(e),
      e.matiere || '',
      e.note?.toString() ?? '',
      e.repri_note?.toString() ?? '',
      r.key === 'none' ? '' : r.label,
    ]
  })

const exportFileSuffix = [filterFaculty, filterCourse, filterAcademicYear, filterResult]
  .filter(Boolean).join('_').replace(/[^a-zA-Z0-9_-]/g, '_') || 'toutes'

const handleExportExcel = () => {
  if (filteredExams.length === 0) return
  exportToCSV(exportHeaders, buildExportRows(), `notes_${exportFileSuffix}`)
}

const handlePrintPDF = () => {
  if (filteredExams.length === 0) return
  const resultColors: Record<ResultKey, string> = {
    success: '#15803d', fail: '#b91c1c', retake: '#c2410c', none: '#6b7280',
  }
  const filtersText = [
    filterFaculty && `Faculté: ${filterFaculty}`,
    filterCourse && `Matière: ${filterCourse}`,
    filterSession && `Session: ${filterSession}`,
    filterYear && `Année: ${filterYear}`,
    filterAcademicYear && `Année académique: ${filterAcademicYear}`,
    filterResult && `Résultat: ${{ success: 'Réussi', fail: 'Échec', retake: 'À refaire' }[filterResult]}`,
  ].filter(Boolean).join(' | ')

  const rowsHtml = filteredExams.map(e => {
    const r = getExamResult(e)
    return `<tr>
      <td>${escapeHTML(studentLabel(e))}</td>
      <td>${escapeHTML(e.matiere)}</td>
      <td style="text-align:center">${escapeHTML(e.note)}</td>
      <td style="text-align:center">${escapeHTML(e.repri_note)}</td>
      <td style="text-align:center;font-weight:bold;color:${resultColors[r.key]}">${r.key === 'none' ? '' : escapeHTML(r.label)}</td>
    </tr>`
  }).join('')

  const body = `
  ${printHeaderHTML()}
  <h2 style="text-align:center">Notes des étudiants</h2>
  <p style="text-align:center;font-size:12px;color:#666">${escapeHTML(filtersText || 'Tous les résultats')} — ${filteredExams.length} ligne(s)</p>
  <table>
    <thead><tr>${exportHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>`
  printHTML('Notes des étudiants', body)
}
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
        <p className="text-gray-600">Consultez et gérez les notes et examens en ligne</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('online')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'online' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}>
          Examens en Ligne
        </button>
        <button onClick={() => setActiveTab('grades')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'grades' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}>
          Notes Manuelles
        </button>
        <button onClick={() => setActiveTab('roster')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'roster' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}>
          Étudiants par année
        </button>
      </div>

      {activeTab === 'online' ? (
        <OnlineExamsTab />
      ) : activeTab === 'roster' ? (
        <AcademicYearRosterTab />
      ) : (
      <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
  <div className="bg-white rounded-xl shadow-md p-5">
    <p className="text-sm text-gray-500 font-semibold">Total Examens</p>
    <p className="text-2xl font-bold text-gray-900">{totalExams}</p>
  </div>
  <div className="bg-white rounded-xl shadow-md p-5">
    <p className="text-sm text-gray-500 font-semibold">Réussi</p>
    <p className="text-2xl font-bold text-green-600">{passCount}</p>
  </div>
  <div className="bg-white rounded-xl shadow-md p-5">
    <p className="text-sm text-gray-500 font-semibold">Échec</p>
    <p className="text-2xl font-bold text-red-600">{failCount}</p>
  </div>
  <div className="bg-white rounded-xl shadow-md p-5">
    <p className="text-sm text-gray-500 font-semibold">À refaire</p>
    <p className="text-2xl font-bold text-orange-600">{retakeCount}</p>
  </div>
  <div className="bg-white rounded-xl shadow-md p-5">
    <p className="text-sm text-gray-500 font-semibold">Taux de Réussite</p>
    <p className="text-2xl font-bold text-blue-600">{passRate}%</p>
  </div>
</div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
    <h3 className="font-semibold text-gray-900">Filtres</h3>
    <div className="flex flex-wrap gap-2">
      <button onClick={resetFilters}
        className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium">
        Réinitialiser
      </button>
      <button onClick={handleExportExcel} disabled={filteredExams.length === 0}
        className="px-3 py-2 rounded-lg bg-green-700 text-white text-sm font-medium disabled:opacity-50">
        Excel / CSV
      </button>
      <button onClick={handlePrintPDF} disabled={filteredExams.length === 0}
        className="px-3 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
        PDF / Imprimer
      </button>
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
    <div>
      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Faculté</label>
      <select value={filterFaculty}
        onChange={e => { setFilterFaculty(e.target.value); setFilterCourse('') }}
        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm">
        <option value="">Toutes les facultés</option>
        {facultyNames.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
    </div>

    <div>
      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Matière</label>
      <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm">
        <option value="">Toutes les matières</option>
        {courseOptions.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>

    <div>
      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Session</label>
      <select value={filterSession} onChange={e => setFilterSession(e.target.value)}
        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm">
        <option value="">Toutes les sessions</option>
        <option value="1">Session 1</option>
        <option value="2">Session 2</option>
      </select>
    </div>

    <div>
      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Année d&apos;étude</label>
      <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm">
        <option value="">Toutes les années</option>
        {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>

    <div>
      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Année académique</label>
      <select value={filterAcademicYear} onChange={e => setFilterAcademicYear(e.target.value)}
        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm">
        <option value="">Toutes les années académiques</option>
        {uniqueAcademicYears.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>

    <div>
      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Résultat</label>
      <select value={filterResult}
        onChange={e => setFilterResult(e.target.value as '' | 'success' | 'fail' | 'retake')}
        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm">
        <option value="">Tous les résultats</option>
        <option value="success">Réussi</option>
        <option value="fail">Échec</option>
        <option value="retake">À refaire</option>
      </select>
    </div>
  </div>
</div>

      {/* Exams Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm md:text-base">
            <thead className="bg-linear-to-r from-blue-600 to-blue-500 text-white sticky top-0 z-10">
              <tr>
                <th className="px-3 md:px-6 py-4 text-left font-semibold">Étudiant</th>
                <th className="px-3 md:px-6 py-4 text-left font-semibold hidden sm:table-cell">Matière</th>
                <th className="px-3 md:px-6 py-4 text-center font-semibold">Note</th>
                <th className="px-3 md:px-6 py-4 text-center font-semibold">Reprise</th>
                <th className="px-3 md:px-6 py-4 text-center font-semibold hidden md:table-cell">Résultat</th>
                <th className="px-3 md:px-6 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Aucun examen trouvé
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam: any) => {
                  const result = getExamResult(exam)
                  const isEditing = editId === exam.id

                  return (
                    <tr key={exam.id} className={`transition-colors ${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      {/* Student Name */}
                      <td className="px-3 md:px-6 py-4">
                        <div className="font-medium text-gray-900 text-xs md:text-sm">
                          {exam.student?.last_name} {exam.student?.first_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {exam.student_code}
                        </div>
                      </td>

                      {/* Matière */}
                      <td className="px-3 md:px-6 py-4 text-gray-700 text-xs md:text-sm hidden sm:table-cell">
                        {exam.matiere}
                      </td>

                      {/* Note */}
                      <td className="px-3 md:px-6 py-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editData.note}
                            onChange={e => setEditData(p => ({ ...p, note: e.target.value }))}
                            className="w-16 md:w-20 px-2 py-1 border-2 border-blue-500 rounded text-center text-xs md:text-sm font-medium"
                            min="0"
                            max="100"
                            placeholder="0"
                          />
                        ) : (
                          <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg font-bold text-white ${
                            exam.note === null ? 'bg-gray-200 text-gray-600' : 'bg-blue-500'
                          }`}>
                            {exam.note ?? '—'}
                          </span>
                        )}
                      </td>

                      {/* Reprise */}
                      <td className="px-3 md:px-6 py-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editData.repri_note}
                            onChange={e => setEditData(p => ({ ...p, repri_note: e.target.value }))}
                            className="w-16 md:w-20 px-2 py-1 border-2 border-blue-500 rounded text-center text-xs md:text-sm font-medium"
                            min="0"
                            max="100"
                            placeholder="0"
                          />
                        ) : (
                          <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg font-bold text-white ${
                            exam.repri_note === null ? 'bg-gray-200 text-gray-600' : 'bg-orange-500'
                          }`}>
                            {exam.repri_note ?? '—'}
                          </span>
                        )}
                      </td>

                      {/* Result/Status */}
                      <td className="px-3 md:px-6 py-4 text-center hidden md:table-cell">
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${RESULT_STYLES[result.key]}`}>
    {result.label}
  </span>
</td>

                      {/* Actions */}
                      <td className="px-3 md:px-6 py-4 text-center">
                        {isEditing ? (
                          <div className="flex gap-1 md:gap-2 justify-center flex-wrap">
                            <button
                              onClick={handleSave}
                              className="px-2 md:px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition font-semibold"
                              title="Enregistrer"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="px-2 md:px-3 py-1 bg-gray-400 text-white text-xs rounded-lg hover:bg-gray-500 transition font-semibold"
                              title="Annuler"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(exam)}
                            className="px-3 md:px-4 py-1.5 text-xs md:text-sm text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition"
                          >
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
      </>
      )}
    </div>
  )
}