'use client'
import { Suspense, useState, useEffect } from 'react'
import { supabase } from '@/app/component/db'
import Input from '@/app/component/input/input-comp'
import TheTable from '@/app/component/table/table'
import { useSearchParams } from 'next/navigation'

interface Program {
  id: number
  created_at: string
  courses: string
  credit: number
  session_subjet: number
  hour_session: number
  total_hour: number
  faculty: string
  year: number
  session: number
}

interface FormRow {
  courses: string
  credit: string
  session_subjet: string
  hour_session: string
  total_hour: string
}


const FACULTIES = [
  'Génie Civil',
  'Médecine Générale',
  'Odontologie',
  'Sciences Infirmières',
  'Sciences Administratives',
  'Sciences Comptables',
  'Science Informatique',
  'Gestion Des Affaires',
  'Sciences Agronomiques',
  'Sciences Economiques',
  'Sciences De L\'Education',
  'Sciences Juridiques',
  'Pharmacologies',
  'Médecine Vétérinaire',
  'Laboratoire Médicale',
  'Physiothérapie',
  'Jardinières D\'enfants'
]

const YEARS = [1, 2, 3, 4, 5]
const SESSIONS = [1, 2]

interface FormErrors {
  [key: string]: string
}

function Program() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [formRows, setFormRows] = useState<FormRow[]>([
    { courses: '', credit: '', session_subjet: '', hour_session: '', total_hour: '' }
  ])
  const [faculty, setFaculty] = useState('')
  const [year, setYear] = useState('')
  const [session, setSession] = useState('')

  const searchParams = useSearchParams()
  const search = searchParams.get('faculty')

  // Fetch programs on mount and when search changes
  useEffect(() => {
    if (search && search.trim()) {
      fetchPrograms(search)
    }
  }, [search])

  const fetchPrograms = async (facultyName: string) => {
    try {
      const { data, error } = await supabase
        .from('course_program')
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
    setFormRows([...formRows, { courses: '', credit: '', session_subjet: '', hour_session: '', total_hour: '' }])
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
      const dataToInsert = formRows.map(row => ({
        courses: row.courses,
        credit: parseFloat(row.credit),
        session_subjet: parseFloat(row.session_subjet),
        hour_session: parseFloat(row.hour_session),
        total_hour: parseFloat(row.total_hour),
        faculty,
        year: parseInt(year),
        session: parseInt(session)
      }))

      const { error } = await supabase
        .from('course_program')
        .insert(dataToInsert)
        .select()

      if (error) throw error

      setSuccessMessage(`${formRows.length} programme(s) ajouté(s) avec succès!`)
      setSuccess(true)
      setFormRows([{ courses: '', credit: '', session_subjet: '', hour_session: '', total_hour: '' }])
      setFaculty('')
      setYear('')
      setSession('')
      setShowForm(false)

      // Refresh data
      if (search) {
        fetchPrograms(search)
      }

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
              {FACULTIES.map(fac => (
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
                      {FACULTIES.map(fac => (
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

          {YEARS.map(y =>
            SESSIONS.map(s => (
              <div key={`${y}-${s}`}>
                <TheTable int={programs} session={s} year={y} faculty={search} />
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