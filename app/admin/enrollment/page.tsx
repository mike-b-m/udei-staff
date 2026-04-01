'use client'
import { supabase } from "@/app/component/db"
import { useState, useEffect } from "react"
import { useFaculties } from "@/app/component/student-infos/useFaculties"

interface Enrollment {
  id: number
  student_id: number
  semester_id: number
  faculty: string
  year_study: number
  status: string
  enrolled_at: string
  approved_at: string | null
  notes: string | null
  student?: { first_name: string; last_name: string; student_code: string }
  semesters?: { name: string; academic_year: string }
}

interface Semester {
  id: number
  name: string
  academic_year: string
  start_date: string
  end_date: string
  is_active: boolean
}

export default function EnrollmentPage() {
  const { facultyNames } = useFaculties()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'enrollments' | 'semesters'>('enrollments')

  // Filters
  const [filterFaculty, setFilterFaculty] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSemester, setFilterSemester] = useState('')

  // Semester form
  const [showSemesterForm, setShowSemesterForm] = useState(false)
  const [semesterForm, setSemesterForm] = useState({
    name: '', academic_year: '', start_date: '', end_date: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [enrollRes, semRes] = await Promise.all([
      supabase.from('enrollments').select(`
        *,
        student:student_id(first_name, last_name, student_code),
        semesters:semester_id(name, academic_year)
      `).order('enrolled_at', { ascending: false }),
      supabase.from('semesters').select('*').order('start_date', { ascending: false })
    ])
    if (enrollRes.data) setEnrollments(enrollRes.data as unknown as Enrollment[])
    if (semRes.data) setSemesters(semRes.data)
    setLoading(false)
  }

  const handleApprove = async (id: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('enrollments').update({
      status: 'approved',
      approved_by: user?.id,
      approved_at: new Date().toISOString()
    }).eq('id', id)

    if (!error) {
      setEnrollments(prev => prev.map(e =>
        e.id === id ? { ...e, status: 'approved', approved_at: new Date().toISOString() } : e
      ))
    }
  }

  const handleReject = async (id: number) => {
    const { error } = await supabase.from('enrollments').update({
      status: 'rejected'
    }).eq('id', id)

    if (!error) {
      setEnrollments(prev => prev.map(e =>
        e.id === id ? { ...e, status: 'rejected' } : e
      ))
    }
  }

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('semesters').insert({
      name: semesterForm.name,
      academic_year: semesterForm.academic_year,
      start_date: semesterForm.start_date,
      end_date: semesterForm.end_date,
      is_active: false
    })
    if (!error) {
      setSemesterForm({ name: '', academic_year: '', start_date: '', end_date: '' })
      setShowSemesterForm(false)
      fetchData()
    }
  }

  const toggleSemesterActive = async (id: number, current: boolean) => {
    // Deactivate all first, then activate selected
    if (!current) {
      await supabase.from('semesters').update({ is_active: false }).neq('id', 0)
    }
    await supabase.from('semesters').update({ is_active: !current }).eq('id', id)
    fetchData()
  }

  const filteredEnrollments = enrollments.filter(e => {
    if (filterFaculty && e.faculty !== filterFaculty) return false
    if (filterStatus && e.status !== filterStatus) return false
    if (filterSemester && e.semester_id !== parseInt(filterSemester)) return false
    return true
  })

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800',
    }
    const labels: Record<string, string> = {
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      withdrawn: 'Retiré',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    )
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inscription Semestrielle</h1>
        <p className="text-gray-600">Gérez les inscriptions des étudiants par semestre</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('enrollments')}
          className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
            activeTab === 'enrollments'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Inscriptions ({enrollments.length})
        </button>
        <button
          onClick={() => setActiveTab('semesters')}
          className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
            activeTab === 'semesters'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Semestres ({semesters.length})
        </button>
      </div>

      {activeTab === 'enrollments' ? (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Filtres</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filterFaculty}
                onChange={e => setFilterFaculty(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Toutes les facultés</option>
                {facultyNames.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvé</option>
                <option value="rejected">Rejeté</option>
                <option value="withdrawn">Retiré</option>
              </select>
              <select
                value={filterSemester}
                onChange={e => setFilterSemester(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Tous les semestres</option>
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Enrollments Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Étudiant</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase hidden md:table-cell">Code</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase hidden sm:table-cell">Faculté</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase hidden lg:table-cell">Semestre</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Année</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        Aucune inscription trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredEnrollments.map(enrollment => (
                      <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {enrollment.student?.last_name} {enrollment.student?.first_name}
                        </td>
                        <td className="px-6 py-4 text-gray-600 hidden md:table-cell">
                          {enrollment.student?.student_code}
                        </td>
                        <td className="px-6 py-4 text-gray-600 hidden sm:table-cell">{enrollment.faculty}</td>
                        <td className="px-6 py-4 text-gray-600 hidden lg:table-cell">
                          {enrollment.semesters?.name}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{enrollment.year_study}</td>
                        <td className="px-6 py-4">{statusBadge(enrollment.status)}</td>
                        <td className="px-6 py-4">
                          {enrollment.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(enrollment.id)}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition"
                              >
                                Approuver
                              </button>
                              <button
                                onClick={() => handleReject(enrollment.id)}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
                              >
                                Rejeter
                              </button>
                            </div>
                          )}
                          {enrollment.status !== 'pending' && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add Semester Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowSemesterForm(!showSemesterForm)}
              className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-lg"
            >
              {showSemesterForm ? 'Annuler' : '+ Nouveau Semestre'}
            </button>
          </div>

          {/* Semester Form */}
          {showSemesterForm && (
            <form onSubmit={handleCreateSemester} className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Nouveau Semestre</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    value={semesterForm.name}
                    onChange={e => setSemesterForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="ex: Semestre 1 2025-2026"
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Année Académique</label>
                  <input
                    type="text"
                    value={semesterForm.academic_year}
                    onChange={e => setSemesterForm(p => ({ ...p, academic_year: e.target.value }))}
                    placeholder="ex: 2025-2026"
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date Début</label>
                  <input
                    type="date"
                    value={semesterForm.start_date}
                    onChange={e => setSemesterForm(p => ({ ...p, start_date: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date Fin</label>
                  <input
                    type="date"
                    value={semesterForm.end_date}
                    onChange={e => setSemesterForm(p => ({ ...p, end_date: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-8 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Créer le Semestre
              </button>
            </form>
          )}

          {/* Semesters List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {semesters.map(semester => (
              <div key={semester.id} className={`bg-white rounded-xl shadow-md p-6 border-2 ${
                semester.is_active ? 'border-green-400' : 'border-transparent'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-900">{semester.name}</h3>
                  {semester.is_active && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Actif</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">Année: {semester.academic_year}</p>
                <p className="text-sm text-gray-600 mb-1">Début: {semester.start_date}</p>
                <p className="text-sm text-gray-600 mb-4">Fin: {semester.end_date}</p>
                <button
                  onClick={() => toggleSemesterActive(semester.id, semester.is_active)}
                  className={`w-full py-2 rounded-lg font-semibold text-sm transition ${
                    semester.is_active
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {semester.is_active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            ))}
            {semesters.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                Aucun semestre créé. Cliquez sur &quot;+ Nouveau Semestre&quot; pour commencer.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
