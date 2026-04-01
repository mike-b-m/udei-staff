'use client'
import { supabase } from "@/app/component/db"
import { useState, useEffect } from "react"
import { FACULTIES } from "@/app/component/student-infos/constants"

interface Homework {
    id: number
    title: string
    description: string
    faculty: string
    year_study: number
    matiere: string
    due_date: string
    created_at: string
    created_by: string
}

interface Submission {
    id: number
    homework_id: number
    student_id: number
    submitted_at: string
    grade: number | null
    file_url: string | null
    student?: { first_name: string; last_name: string; student_code: string }
}

export default function HomeworkPage() {
    const [homeworks, setHomeworks] = useState<Homework[]>([])
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'list' | 'create' | 'submissions'>('list')
    const [selectedHomework, setSelectedHomework] = useState<number | null>(null)

    // Form state
    const [form, setForm] = useState({
        title: '', description: '', faculty: '', year_study: '1', matiere: '', due_date: ''
    })
    const [courses, setCourses] = useState<any[]>([])
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    // Grading
    const [gradeValues, setGradeValues] = useState<Record<number, string>>({})

    useEffect(() => {
        fetchHomeworks()
    }, [])

    useEffect(() => {
        if (form.faculty && form.year_study) {
            loadCourses()
        }
    }, [form.faculty, form.year_study])

    const fetchHomeworks = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('homework')
            .select('*')
            .order('created_at', { ascending: false })
        setHomeworks(data || [])
        setLoading(false)
    }

    const loadCourses = async () => {
        const { data } = await supabase
            .from('course_program')
            .select('courses,faculty,year')
            .eq('faculty', form.faculty)
            .eq('year', parseInt(form.year_study))
        setCourses(data || [])
    }

    const fetchSubmissions = async (homeworkId: number) => {
        setSelectedHomework(homeworkId)
        setActiveTab('submissions')
        const { data } = await supabase
            .from('homework_submission')
            .select('*, student:student_id(first_name, last_name, student_code)')
            .eq('homework_id', homeworkId)
        setSubmissions((data as unknown as Submission[]) || [])
    }

    const handleCreate = async () => {
        if (!form.title || !form.faculty || !form.due_date) {
            setError('Veuillez remplir tous les champs obligatoires')
            return
        }
        setSaving(true)
        setError('')
        const { data: { user } } = await supabase.auth.getUser()

        const { error: insertError } = await supabase.from('homework').insert({
            title: form.title,
            description: form.description,
            faculty: form.faculty,
            year_study: parseInt(form.year_study),
            matiere: form.matiere,
            due_date: form.due_date,
            created_by: user?.id
        })

        if (insertError) {
            setError(insertError.message)
        } else {
            setMessage('Devoir créé avec succès')
            setForm({ title: '', description: '', faculty: '', year_study: '1', matiere: '', due_date: '' })
            fetchHomeworks()
            setActiveTab('list')
        }
        setSaving(false)
    }

    const handleGrade = async (submissionId: number) => {
        const grade = parseFloat(gradeValues[submissionId] || '0')
        if (grade < 0 || grade > 100) {
            setError('Note doit être entre 0 et 100')
            return
        }
        const { error } = await supabase
            .from('homework_submission')
            .update({ grade })
            .eq('id', submissionId)
        if (!error) {
            setMessage('Note enregistrée')
            fetchSubmissions(selectedHomework!)
        }
    }

    const handleDeleteHomework = async (id: number) => {
        if (!confirm('Supprimer ce devoir ?')) return
        await supabase.from('homework').delete().eq('id', id)
        fetchHomeworks()
    }

    const selectedHw = homeworks.find(h => h.id === selectedHomework)

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestion des Devoirs</h1>
                    <p className="text-gray-600">Créez, suivez et notez les devoirs des étudiants</p>
                </div>

                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex justify-between">
                        {message} <button onClick={() => setMessage('')} className="font-bold">✕</button>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex justify-between">
                        {error} <button onClick={() => setError('')} className="font-bold">✕</button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { key: 'list', label: 'Tous les Devoirs', icon: '📋' },
                        { key: 'create', label: 'Nouveau Devoir', icon: '➕' },
                        ...(selectedHomework ? [{ key: 'submissions', label: 'Soumissions', icon: '📥' }] : []),
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                            className={`px-5 py-2.5 rounded-lg font-semibold transition text-sm ${activeTab === tab.key ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Create Form */}
                {activeTab === 'create' && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Créer un Nouveau Devoir</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="Titre du devoir" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="Instructions détaillées..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Faculté *</label>
                                <select value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                    <option value="">-- Sélectionner --</option>
                                    {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Année d&apos;étude</label>
                                <select value={form.year_study} onChange={e => setForm({ ...form, year_study: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                    {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y}ème année</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
                                <select value={form.matiere} onChange={e => setForm({ ...form, matiere: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                    <option value="">-- Sélectionner --</option>
                                    {courses.map((c, i) => <option key={i} value={c.courses}>{c.courses}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date Limite *</label>
                                <input type="datetime-local" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                            </div>
                        </div>
                        <button onClick={handleCreate} disabled={saving}
                            className="mt-6 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                            {saving ? 'Création...' : 'Créer le Devoir'}
                        </button>
                    </div>
                )}

                {/* Homework List */}
                {activeTab === 'list' && (
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-16">
                                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            </div>
                        ) : homeworks.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                <p className="text-gray-500 text-lg">Aucun devoir créé pour le moment</p>
                            </div>
                        ) : (
                            homeworks.map(hw => {
                                const isExpired = new Date(hw.due_date) < new Date()
                                return (
                                    <div key={hw.id} className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 text-lg">{hw.title}</h4>
                                                <p className="text-sm text-gray-500 mt-1">{hw.description}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{hw.faculty}</span>
                                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">{hw.matiere}</span>
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">Année {hw.year_study}</span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                        {isExpired ? 'Expiré' : 'Actif'} — {new Date(hw.due_date).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => fetchSubmissions(hw.id)}
                                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium text-sm transition">
                                                    Soumissions
                                                </button>
                                                <button onClick={() => handleDeleteHomework(hw.id)}
                                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm transition">
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}

                {/* Submissions View */}
                {activeTab === 'submissions' && selectedHw && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Soumissions — {selectedHw.title}</h3>
                        <p className="text-sm text-gray-500 mb-4">{selectedHw.faculty} • {selectedHw.matiere} • Année {selectedHw.year_study}</p>

                        {submissions.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-lg">Aucune soumission pour ce devoir</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-blue-50 text-blue-800">
                                            <th className="py-3 px-4 text-left font-semibold">Étudiant</th>
                                            <th className="py-3 px-4 text-left font-semibold">Code</th>
                                            <th className="py-3 px-4 text-left font-semibold">Date Soumise</th>
                                            <th className="py-3 px-4 text-left font-semibold">Note</th>
                                            <th className="py-3 px-4 text-left font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map((sub, i) => (
                                            <tr key={sub.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="py-3 px-4 font-medium">{sub.student?.last_name} {sub.student?.first_name}</td>
                                                <td className="py-3 px-4 text-blue-600 font-mono">{sub.student?.student_code}</td>
                                                <td className="py-3 px-4 text-gray-500">{new Date(sub.submitted_at).toLocaleDateString('fr-FR')}</td>
                                                <td className="py-3 px-4">
                                                    {sub.grade !== null ? (
                                                        <span className="font-bold text-green-600">{sub.grade}/100</span>
                                                    ) : (
                                                        <span className="text-gray-400">Non noté</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <input type="number" min={0} max={100}
                                                            value={gradeValues[sub.id] || ''}
                                                            onChange={e => setGradeValues({ ...gradeValues, [sub.id]: e.target.value })}
                                                            placeholder="Note"
                                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                                                        <button onClick={() => handleGrade(sub.id)}
                                                            className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition">
                                                            Noter
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
