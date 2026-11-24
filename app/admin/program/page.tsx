'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { supabase } from '@/app/component/db'
import Input from '@/app/component/input/input-comp'
import TheTable from '@/app/component/table/table'
import { useSearchParams } from 'next/navigation'

import { useFaculties } from '@/app/component/student-infos/useFaculties'

interface Program {
  id: number
  course_program_id: number
  created_at: string
  courses: string
  credit: number
  session_subjet: number
  hour_session: number
  total_hour: number
  faculty: string
  pass_grade: number
  year: number
  session: number
}

interface CourseCatalogRow {
  id: number
  course_program_id: number
  courses: string
  credit: number | null
  faculty: string | null
  year: number | null
  session: number | null
  pass_grade: number | null
}

interface CourseMasterRow {
  id: number
  courses: string
  credit: number | null
  session_subjet: number | null
  hour_session: number | null
  total_hour: number | null
}

interface SavedCourse {
  id: number
  name: string
  credit: number | null
  sessionSubject: number | null
  hoursPerSession: number | null
  totalHours: number | null
  associations: {
    id: number
    faculty: string
    year: number | null
    session: number | null
    passGrade: number | null
  }[]
}

interface CourseDetailsForm {
  id: number | null
  courses: string
  credit: string
  session_subjet: string
  hour_session: string
  total_hour: string
}

interface AssociationForm {
  courseId: number
  courseName: string
  assignmentId: number | null
  faculty: string
  year: string
  session: string
  passGrade: string
}

interface FormRow {
  courses: string
  credit: string
  session_subjet: string
  hour_session: string
  total_hour: string
  pass_grade: string
}


const YEARS = [1, 2, 3, 4, 5]
const SESSIONS = [1, 2]

interface FormErrors {
  [key: string]: string
}

interface thedate{
  tittle: string
  date: string
}
function UplaodimportantDates() {
  const [dat,setDat] = useState<any[]>([])
  const [dates,setDates] = useState<thedate>({ tittle: '', date: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [open, setOpen] = useState<'read' | 'add'>('read')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    const Load = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('imp_date').select('*').order('created_at', { ascending: false })
      if (error) {
        setError(error.message)
      } else {
        setDat(data || [])
      }
      setLoading(false)
    }
    Load()
  }, [])

  const handlesave = async () => {
    if (!dates.tittle.trim() || !dates.date.trim()) {
      setError('Veuillez remplir le titre et la date')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    const { data, error: insertErr } = await supabase
      .from('imp_date')
      .insert({ tittle: dates.tittle, date: dates.date })
      .select('*')
    if (insertErr) {
      setError(insertErr.message)
    } else {
      setDat(prev => [...(data || []), ...prev])
      setDates({ tittle: '', date: '' })
      setSuccess('Date ajoutée avec succès')
      setTimeout(() => setSuccess(''), 3000)
    }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    const { error: delErr } = await supabase.from('imp_date').delete().eq('id', id)
    if (delErr) {
      setError(delErr.message)
    } else {
      setDat(prev => prev.filter(d => d.id !== id))
    }
    setDeletingId(null)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-orange-500 to-amber-500 p-5 text-white">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Dates Importantes
        </h3>
      </div>

      {/* Tab Buttons */}
      <div className="flex border-b border-gray-200">
        <button onClick={() => setOpen('read')}
          className={`flex-1 py-3 text-sm font-semibold transition-all ${open === 'read' ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
          Liste ({dat.length})
        </button>
        <button onClick={() => setOpen('add')}
          className={`flex-1 py-3 text-sm font-semibold transition-all ${open === 'add' ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
          + Ajouter
        </button>
      </div>

      <div className="p-5">
        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm flex justify-between items-center">
            {error}
            <button onClick={() => setError('')} className="font-bold text-red-500 hover:text-red-700">✕</button>
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm">
            {success}
          </div>
        )}

        {open === 'add' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input type="text" value={dates.tittle} placeholder="Ex: Début des cours"
                onChange={e => setDates({ ...dates, tittle: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="text" value={dates.date} placeholder="Ex: Octobre 2025 ou 21 Décembre 2025"
                onChange={e => setDates({ ...dates, date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
            </div>
            <button onClick={handlesave} disabled={saving}
              className="w-full py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Enregistrement...
                </>
              ) : 'Enregistrer'}
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-3"></div>
            <p className="text-gray-500 text-sm">Chargement...</p>
          </div>
        ) : dat.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="font-medium">Aucune date enregistrée</p>
            <p className="text-sm mt-1">Ajoutez des dates importantes pour les étudiants</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dat.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg p-3 hover:bg-orange-50 transition group">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{d.tittle}</p>
                    <p className="text-xs text-gray-500">{d.date}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(d.id)} disabled={deletingId === d.id}
                  className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-all disabled:opacity-50">
                  {deletingId === d.id ? (
                    <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
function Program() {
  const { facultyNames } = useFaculties()
  const [programs, setPrograms] = useState<Program[]>([])
  const [courseMasters, setCourseMasters] = useState<CourseMasterRow[]>([])
  const [catalogRows, setCatalogRows] = useState<CourseCatalogRow[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [associationForm, setAssociationForm] = useState<AssociationForm | null>(null)
  const [associationSaving, setAssociationSaving] = useState(false)
  const [associationError, setAssociationError] = useState('')
  const [courseDetailsForm, setCourseDetailsForm] = useState<CourseDetailsForm | null>(null)
  const [courseDetailsSaving, setCourseDetailsSaving] = useState(false)
  const [courseDetailsError, setCourseDetailsError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [formRows, setFormRows] = useState<FormRow[]>([
    { courses: '', credit: '', session_subjet: '', hour_session: '', total_hour: '', pass_grade: '' }
  ])
  const [faculty, setFaculty] = useState('')
  const [year, setYear] = useState('')
  const [session, setSession] = useState('')

  const searchParams = useSearchParams()
  const search = searchParams.get('faculty')

  const savedCourses = useMemo(() => {
    const grouped = new Map<number, SavedCourse>()
    for (const course of courseMasters) {
      grouped.set(course.id, {
        id: course.id,
        name: course.courses,
        credit: course.credit,
        sessionSubject: course.session_subjet,
        hoursPerSession: course.hour_session,
        totalHours: course.total_hour,
        associations: [],
      })
    }

    for (const row of catalogRows) {
      let course = grouped.get(row.course_program_id)
      if (!course) {
        course = {
          id: row.course_program_id,
          name: row.courses,
          credit: row.credit,
          sessionSubject: null,
          hoursPerSession: null,
          totalHours: null,
          associations: [],
        }
        grouped.set(row.course_program_id, course)
      }

      if (row.faculty && !course.associations.some(
        association => association.id === row.id
      )) {
        course.associations.push({
          id: row.id,
          faculty: row.faculty,
          year: row.year,
          session: row.session,
          passGrade: row.pass_grade,
        })
      }
    }

    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [catalogRows, courseMasters])

  const filteredSavedCourses = useMemo(() => {
    const query = catalogSearch.trim().toLocaleLowerCase()
    if (!query) return savedCourses
    return savedCourses.filter(course =>
      course.name.toLocaleLowerCase().includes(query) ||
      course.associations.some(association => association.faculty.toLocaleLowerCase().includes(query))
    )
  }, [catalogSearch, savedCourses])

  const refreshCourseCatalog = async () => {
    setCatalogLoading(true)
    const [coursesResult, assignmentsResult] = await Promise.all([
      supabase
        .from('course_program')
        .select('id, courses, credit, session_subjet, hour_session, total_hour')
        .order('courses'),
      supabase
        .from('course_program_catalog')
        .select('id, course_program_id, courses, credit, faculty, year, session, pass_grade')
        .order('courses'),
    ])

    if (coursesResult.error || assignmentsResult.error) {
      setCatalogError(coursesResult.error?.message ?? assignmentsResult.error?.message ?? 'Erreur inconnue')
    } else {
      setCourseMasters(coursesResult.data ?? [])
      setCatalogRows(assignmentsResult.data ?? [])
      setCatalogError('')
    }
    setCatalogLoading(false)
  }

  useEffect(() => {
    void refreshCourseCatalog()
  }, [])

  const openNewCourseForm = () => {
    setCourseDetailsError('')
    setCourseDetailsForm({
      id: null,
      courses: '',
      credit: '',
      session_subjet: '',
      hour_session: '',
      total_hour: '',
    })
  }

  const openEditCourseForm = (course: SavedCourse) => {
    setCourseDetailsError('')
    setCourseDetailsForm({
      id: course.id,
      courses: course.name,
      credit: course.credit?.toString() ?? '',
      session_subjet: course.sessionSubject?.toString() ?? '',
      hour_session: course.hoursPerSession?.toString() ?? '',
      total_hour: course.totalHours?.toString() ?? '',
    })
  }

  const saveCourseDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!courseDetailsForm) return
    const courseName = courseDetailsForm.courses.trim()
    const numericValues = [
      courseDetailsForm.credit,
      courseDetailsForm.session_subjet,
      courseDetailsForm.hour_session,
      courseDetailsForm.total_hour,
    ].map(Number)

    if (!courseName || numericValues.some(value => !Number.isFinite(value) || value <= 0)) {
      setCourseDetailsError('Indiquez le nom du cours et des valeurs numériques supérieures à zéro pour chaque champ.')
      return
    }

    setCourseDetailsSaving(true)
    setCourseDetailsError('')
    const courseValues = {
      courses: courseName,
      credit: numericValues[0],
      session_subjet: numericValues[1],
      hour_session: numericValues[2],
      total_hour: numericValues[3],
    }
    const result = courseDetailsForm.id
      ? await supabase.from('course_program').update(courseValues).eq('id', courseDetailsForm.id)
      : await supabase.from('course_program').insert(courseValues)

    if (result.error) {
      setCourseDetailsError(result.error.message)
      setCourseDetailsSaving(false)
      return
    }

    setCourseDetailsForm(null)
    setCourseDetailsSaving(false)
    await refreshCourseCatalog()
    if (search) await fetchPrograms(search)
  }

  const openAddAssociation = (course: SavedCourse) => {
    setAssociationError('')
    setAssociationForm({
      courseId: course.id,
      courseName: course.name,
      assignmentId: null,
      faculty: '',
      year: '1',
      session: '1',
      passGrade: '50',
    })
  }

  const openEditAssociation = (course: SavedCourse, association: SavedCourse['associations'][number]) => {
    setAssociationError('')
    setAssociationForm({
      courseId: course.id,
      courseName: course.name,
      assignmentId: association.id,
      faculty: association.faculty,
      year: association.year?.toString() ?? '',
      session: association.session?.toString() ?? '',
      passGrade: association.passGrade?.toString() ?? '',
    })
  }

  const saveAssociation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!associationForm) return
    if (!associationForm.faculty || !associationForm.year || !associationForm.session || associationForm.passGrade === '') {
      setAssociationError('Choisissez une faculté, une année, une session et une note de passage.')
      return
    }

    setAssociationSaving(true)
    setAssociationError('')
    const values = {
      faculty: associationForm.faculty,
      year: Number(associationForm.year),
      session: Number(associationForm.session),
      pass_grade: Number(associationForm.passGrade),
    }

    const result = associationForm.assignmentId
      ? await supabase.from('course_program_assignment').update(values).eq('id', associationForm.assignmentId)
      : await supabase.from('course_program_assignment').insert({
          course_program_id: associationForm.courseId,
          ...values,
        })

    if (result.error) {
      setAssociationError(result.error.message)
      setAssociationSaving(false)
      return
    }

    setAssociationForm(null)
    setAssociationSaving(false)
    await refreshCourseCatalog()
    if (search) await fetchPrograms(search)
  }

  // Fetch programs on mount and when search changes
  useEffect(() => {
    if (search && search.trim()) {
      fetchPrograms(search)
    }
  }, [search])

  const fetchPrograms = async (facultyName: string) => {
    try {
      const { data, error } = await supabase
        .from('course_program_catalog')
        .select('*')
        .eq('faculty', facultyName)

      if (error) throw error
      setPrograms(data || [])
    } catch (error) {
      console.error('Error fetching programs:', error)
      setErrors({ fetch: 'Erreur lors du chargement des programmes' })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    formRows.forEach((row, index) => {
      if (!row.courses.trim()) newErrors[`courses-${index}`] = 'Le cours est requis'
      if (!row.credit || parseFloat(row.credit) <= 0) newErrors[`credit-${index}`] = 'Le crédit doit être positif'
      if (!row.session_subjet || parseFloat(row.session_subjet) <= 0) newErrors[`session_subjet-${index}`] = 'Requis'
      if (!row.hour_session || parseFloat(row.hour_session) <= 0) newErrors[`hour_session-${index}`] = 'Requis'
      if (!row.total_hour || parseFloat(row.total_hour) <= 0) newErrors[`total_hour-${index}`] = 'Requis'
      if (!row.pass_grade || parseFloat(row.pass_grade) < 0) newErrors[`pass_grade-${index}`] = 'La note de passage doit être >= 0'
    })

    if (!faculty) newErrors.faculty = 'Sélectionnez une faculté'
    if (!year) newErrors.year = 'Sélectionnez une année'
    if (!session) newErrors.session = 'Sélectionnez une session'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...formRows]
    newRows[index] = { ...newRows[index], [field]: value }
    setFormRows(newRows)

    if (errors[`${field}-${index}`]) {
      const newErrors = { ...errors }
      delete newErrors[`${field}-${index}`]
      setErrors(newErrors)
    }
  }

  const addRow = () => {
    setFormRows([...formRows, { courses: '', credit: '', session_subjet: '', hour_session: '', total_hour: '', pass_grade: '' }])
  }

  const removeRow = (index: number) => {
    if (formRows.length > 1) {
      setFormRows(formRows.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setSuccess(false)

    try {
      const { data: existingCourses, error: existingCoursesError } = await supabase
        .from('course_program')
        .select('id, courses')
      if (existingCoursesError) throw existingCoursesError

      for (const row of formRows) {
        const courseName = row.courses.trim()
        const normalizedCourseName = courseName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim()
        const existingCourse = (existingCourses ?? []).find((course) =>
          course.courses?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim() === normalizedCourseName
        )
        const courseValues = {
          courses: courseName,
          credit: parseFloat(row.credit),
          session_subjet: parseFloat(row.session_subjet),
          hour_session: parseFloat(row.hour_session),
          total_hour: parseFloat(row.total_hour),
        }

        let courseId = existingCourse?.id
        if (courseId) {
          const { error: updateCourseError } = await supabase
            .from('course_program')
            .update(courseValues)
            .eq('id', courseId)
          if (updateCourseError) throw updateCourseError
        } else {
          const { data: insertedCourse, error: insertCourseError } = await supabase
            .from('course_program')
            .insert(courseValues)
            .select('id')
            .single()
          if (insertCourseError) throw insertCourseError
          courseId = insertedCourse.id
          existingCourses?.push({ id: courseId, courses: courseName })
        }

        const { error: assignmentError } = await supabase
          .from('course_program_assignment')
          .upsert({
            course_program_id: courseId,
            faculty,
            year: parseInt(year),
            session: parseInt(session),
            pass_grade: parseFloat(row.pass_grade),
          }, { onConflict: 'course_program_id,year,session,faculty' })
        if (assignmentError) throw assignmentError
      }

      setSuccessMessage(`${formRows.length} cours ajouté(s) ou assigné(s) avec succès!`)
      setSuccess(true)
      setFormRows([{ courses: '', credit: '', session_subjet: '', hour_session: '', total_hour: '', pass_grade: '' }])
      setFaculty('')
      setYear('')
      setSession('')
      setShowForm(false)

      // Refresh data
      if (search) {
        fetchPrograms(search)
      }
      void refreshCourseCatalog()

      setTimeout(() => setSuccess(false), 5000)
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const facultyValue = formData.get('faculty') as string
    if (facultyValue) {
      window.location.href = `/admin/program?faculty=${encodeURIComponent(facultyValue)}`
    }
  }

  return (
    <div className="w-full space-y-6 p-6">
      {/* Success Notification */}
      {success && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-800 font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errors.submit && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800 font-medium">{errors.submit}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <form onSubmit={handleSearchSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sélectionner une Faculté
            </label>
            <select
              name="faculty"
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-300 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 font-medium transition-all"
            >
              <option value="">Choisir une faculté...</option>
              {facultyNames.map(fac => (
                <option key={fac} value={fac}>{fac}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            Rechercher
          </button>
        </form>
      </div>

      {/* Add Program Button / Form Modal */}
      {showForm ? (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter Programmes
              </h2>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Faculty, Year, Session Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  Paramètres Généraux
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Faculté <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={faculty}
                      onChange={(e) => {
                        setFaculty(e.target.value)
                        if (errors.faculty) setErrors({ ...errors, faculty: '' })
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium transition-all ${
                        errors.faculty ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
                      }`}
                    >
                      <option value="">Sélectionner...</option>
                      {facultyNames.map(fac => (
                        <option key={fac} value={fac}>{fac}</option>
                      ))}
                    </select>
                    {errors.faculty && <p className="text-red-600 text-sm mt-1">{errors.faculty}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Année <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={year}
                      onChange={(e) => {
                        setYear(e.target.value)
                        if (errors.year) setErrors({ ...errors, year: '' })
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium transition-all ${
                        errors.year ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
                      }`}
                    >
                      <option value="">Sélectionner...</option>
                      {YEARS.map(y => (
                        <option key={y} value={y.toString()}>{y}</option>
                      ))}
                    </select>
                    {errors.year && <p className="text-red-600 text-sm mt-1">{errors.year}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Session <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={session}
                      onChange={(e) => {
                        setSession(e.target.value)
                        if (errors.session) setErrors({ ...errors, session: '' })
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium transition-all ${
                        errors.session ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
                      }`}
                    >
                      <option value="">Sélectionner...</option>
                      {SESSIONS.map(s => (
                        <option key={s} value={s.toString()}>{s}</option>
                      ))}
                    </select>
                    {errors.session && <p className="text-red-600 text-sm mt-1">{errors.session}</p>}
                  </div>
                </div>
              </div>

              {/* Courses Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    Cours ({formRows.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addRow}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-all flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Ajouter Ligne
                  </button>
                </div>

                <div className="space-y-3">
                  {formRows.map((row, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-gray-300 text-gray-700 text-xs font-bold rounded">Ligne {index + 1}</span>
                        {formRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="ml-auto px-2 py-1 text-red-600 hover:bg-red-100 rounded transition-all"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-700">Cours</label>
                          <input
                            type="text"
                            value={row.courses}
                            onChange={(e) => handleRowChange(index, 'courses', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                              errors[`courses-${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
                            }`}
                            placeholder="Nom du cours"
                          />
                          {errors[`courses-${index}`] && <p className="text-red-600 text-xs mt-1">{errors[`courses-${index}`]}</p>}
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-700">Crédit</label>
                          <input
                            type="number"
                            value={row.credit}
                            onChange={(e) => handleRowChange(index, 'credit', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                              errors[`credit-${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
                            }`}
                            placeholder="0"
                          />
                          {errors[`credit-${index}`] && <p className="text-red-600 text-xs mt-1">{errors[`credit-${index}`]}</p>}
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-700">Séances/Mois</label>
                          <input
                            type="number"
                            value={row.session_subjet}
                            onChange={(e) => handleRowChange(index, 'session_subjet', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                              errors[`session_subjet-${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
                            }`}
                            placeholder="0"
                          />
                          {errors[`session_subjet-${index}`] && <p className="text-red-600 text-xs mt-1">{errors[`session_subjet-${index}`]}</p>}
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-700">H/Séances</label>
                          <input
                            type="number"
                            value={row.hour_session}
                            onChange={(e) => handleRowChange(index, 'hour_session', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                              errors[`hour_session-${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
                            }`}
                            placeholder="0"
                          />
                          {errors[`hour_session-${index}`] && <p className="text-red-600 text-xs mt-1">{errors[`hour_session-${index}`]}</p>}
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-700">Total Heures</label>
                          <input
                            type="number"
                            value={row.total_hour}
                            onChange={(e) => handleRowChange(index, 'total_hour', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                              errors[`total_hour-${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
                            }`}
                            placeholder="0"
                          />
                          {errors[`total_hour-${index}`] && <p className="text-red-600 text-xs mt-1">{errors[`total_hour-${index}`]}</p>}
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-700">Note de Passage</label>
                          <input
                            type="number"
                            value={row.pass_grade}
                            onChange={(e) => handleRowChange(index, 'pass_grade', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                              errors[`pass_grade-${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
                            }`}
                            placeholder="0"
                          />
                          {errors[`pass_grade-${index}`] && <p className="text-red-600 text-xs mt-1">{errors[`pass_grade-${index}`]}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || success}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    loading || success
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 w-fit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter un Programme
        </button>
      )}
      {/* add important dates */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg sm:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Cours enregistrés et facultés associées</h2>
            <p className="mt-1 text-sm text-gray-500">
              {savedCourses.length} cours enregistrés dans {catalogRows.length} affectation(s).
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="w-full sm:w-72">
              <span className="sr-only">Rechercher un cours ou une faculté</span>
              <input
                type="search"
                value={catalogSearch}
                onChange={event => setCatalogSearch(event.target.value)}
                placeholder="Rechercher un cours ou une faculté..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <button
              type="button"
              onClick={openNewCourseForm}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              <span aria-hidden="true">+</span> Ajouter un cours
            </button>
          </div>
        </div>

        {catalogLoading ? (
          <p className="py-8 text-center text-sm text-gray-500">Chargement des cours enregistrés...</p>
        ) : catalogError ? (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            Impossible de charger les cours enregistrés : {catalogError}
          </p>
        ) : filteredSavedCourses.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            {catalogSearch ? 'Aucun cours ou faculté ne correspond à la recherche.' : 'Aucun cours enregistré pour le moment.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-3 font-semibold">Cours</th>
                  <th className="px-3 py-3 font-semibold">Crédit</th>
                  <th className="px-3 py-3 font-semibold">Séances/Mois</th>
                  <th className="px-3 py-3 font-semibold">Heures/Séance</th>
                  <th className="px-3 py-3 font-semibold">Total heures</th>
                  <th className="px-3 py-3 font-semibold">Facultés associées</th>
                  <th className="px-3 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSavedCourses.map(course => (
                  <tr key={course.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-3 py-4 font-semibold text-gray-900">{course.name}</td>
                    <td className="px-3 py-4 text-gray-600">{course.credit ?? '—'}</td>
                    <td className="px-3 py-4 text-gray-600">{course.sessionSubject ?? '—'}</td>
                    <td className="px-3 py-4 text-gray-600">{course.hoursPerSession ?? '—'}</td>
                    <td className="px-3 py-4 text-gray-600">{course.totalHours ?? '—'}</td>
                    <td className="px-3 py-4">
                      {course.associations.length ? (
                        <div className="flex flex-wrap gap-2">
                          {course.associations.map(association => (
                            <span
                              key={`${association.faculty}-${association.year}-${association.session}`}
                              className="inline-flex flex-wrap items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                            >
                              {association.faculty}
                              {association.year != null && ` · Année ${association.year}`}
                              {association.session != null && ` · Session ${association.session}`}
                              <button
                                type="button"
                                onClick={() => openEditAssociation(course, association)}
                                className="rounded-full px-1.5 py-0.5 text-indigo-800 underline decoration-indigo-300 underline-offset-2 hover:bg-indigo-100"
                                aria-label={`Modifier l’association ${association.faculty} pour ${course.name}`}
                              >
                                Modifier
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">Aucune faculté associée</span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditCourseForm(course)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Modifier le cours
                        </button>
                        <button
                          type="button"
                          onClick={() => openAddAssociation(course)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                        >
                          <span aria-hidden="true">+</span> Ajouter une faculté
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {associationForm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !associationSaving) setAssociationForm(null)
          }}
        >
          <form
            onSubmit={saveAssociation}
            className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="association-dialog-title"
          >
            <div>
              <h2 id="association-dialog-title" className="text-xl font-bold text-gray-900">
                {associationForm.assignmentId ? 'Modifier l’association' : 'Ajouter une faculté'}
              </h2>
              <p className="mt-1 text-sm text-gray-600">{associationForm.courseName}</p>
            </div>

            {associationError && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {associationError}
              </p>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Faculté</span>
              <select
                required
                value={associationForm.faculty}
                onChange={event => setAssociationForm({ ...associationForm, faculty: event.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Sélectionner une faculté</option>
                {facultyNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Année</span>
                <select
                  required
                  value={associationForm.year}
                  onChange={event => setAssociationForm({ ...associationForm, year: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {YEARS.map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Session</span>
                <select
                  required
                  value={associationForm.session}
                  onChange={event => setAssociationForm({ ...associationForm, session: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {SESSIONS.map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Note de passage</span>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={associationForm.passGrade}
                  onChange={event => setAssociationForm({ ...associationForm, passGrade: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={associationSaving}
                onClick={() => setAssociationForm(null)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={associationSaving}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {associationSaving ? 'Enregistrement...' : associationForm.assignmentId ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {courseDetailsForm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !courseDetailsSaving) setCourseDetailsForm(null)
          }}
        >
          <form
            onSubmit={saveCourseDetails}
            className="w-full max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-details-dialog-title"
          >
            <div>
              <h2 id="course-details-dialog-title" className="text-xl font-bold text-gray-900">
                {courseDetailsForm.id ? 'Modifier le cours' : 'Ajouter un cours'}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Les informations du cours sont indépendantes de ses facultés associées.
              </p>
            </div>

            {courseDetailsError && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {courseDetailsError}
              </p>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Cours</span>
              <input
                required
                type="text"
                value={courseDetailsForm.courses}
                onChange={event => setCourseDetailsForm({ ...courseDetailsForm, courses: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Nom du cours"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Crédit</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={courseDetailsForm.credit}
                  onChange={event => setCourseDetailsForm({ ...courseDetailsForm, credit: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Séances/Mois</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={courseDetailsForm.session_subjet}
                  onChange={event => setCourseDetailsForm({ ...courseDetailsForm, session_subjet: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Heures/Séance</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={courseDetailsForm.hour_session}
                  onChange={event => setCourseDetailsForm({ ...courseDetailsForm, hour_session: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Total heures</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={courseDetailsForm.total_hour}
                  onChange={event => setCourseDetailsForm({ ...courseDetailsForm, total_hour: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={courseDetailsSaving}
                onClick={() => setCourseDetailsForm(null)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={courseDetailsSaving}
                className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {courseDetailsSaving ? 'Enregistrement...' : courseDetailsForm.id ? 'Enregistrer' : 'Ajouter le cours'}
              </button>
            </div>
          </form>
        </div>
      )}

      <UplaodimportantDates />

      {/* Programs Display */}
      {search ? (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17.25S6.5 28 12 28s10-4.745 10-10.75S17.5 6.253 12 6.253z" />
              </svg>
              Programmes : {search}
            </h2>
            <p className="text-gray-500">Année et Session</p>
          </div>

          {/* Passing Notes Management Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Gestion des Notes de Passage
            </h3>
            <p className="text-gray-600 mb-4">Définir ou modifier les notes de passage pour les cours existants</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {YEARS.map(year =>
                SESSIONS.map(session => {
                  const yearSessionPrograms = programs.filter(p => p.year === year && p.session === session)
                  if (yearSessionPrograms.length === 0) return null

                  return (
                    <div key={`${year}-${session}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Année {year} - Session {session}
                      </h4>
                      <div className="space-y-2">
                        {yearSessionPrograms.map(program => (
                          <div key={program.id} className="flex items-center justify-between bg-white rounded p-2">
                            <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-2">
                              {program.courses}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Note:</span>
                              <input
                                type="number"
                                defaultValue={program.pass_grade || 0}
                                onBlur={async (e) => {
                                  const newValue = parseFloat(e.target.value) || 0
                                  if (newValue !== program.pass_grade) {
                                    try {
                                      const { error } = await supabase
                                        .from('course_program_assignment')
                                        .update({ pass_grade: newValue })
                                        .eq('id', program.id)
                                      if (error) throw error
                                      // Update local state
                                      setPrograms(prev => prev.map(p =>
                                        p.id === program.id ? { ...p, pass_grade: newValue } : p
                                      ))
                                    } catch (error) {
                                      console.error('Error updating pass grade:', error)
                                    }
                                  }
                                }}
                                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-green-500"
                                min="0"
                                max="100"
                                step="0.1"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {YEARS.map(y =>
            SESSIONS.map(s => (
              <div key={`${y}-${s}`}>
                <TheTable
                  int={programs}
                  session={s}
                  year={y}
                  faculty={search}
                  onUpdateData={() => {
                    if (search) void fetchPrograms(search)
                    void refreshCourseCatalog()
                  }}
                />
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p className="text-gray-600 font-medium text-lg">Sélectionnez une faculté pour voir les programmes</p>
          <p className="text-gray-500 text-sm mt-2">Utilisez la section de recherche ci-dessus</p>
        </div>
      )}
    </div>
  )
}

export default function ProgramPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    }>
      <Program />
    </Suspense>
  )
}