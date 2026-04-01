'use client'
import { supabase } from "@/app/component/db"
import { useState, useEffect } from "react"
import { useFaculties } from "@/app/component/student-infos/useFaculties"

interface Professor {
    id: string
    full_name: string
    role: string
    email: string
}

interface ProfAssignment {
    id: number
    prof_id: string
    faculty: string
    matiere: string
    year_study: number
    session: number
    professor?: { full_name: string; email: string }
}

interface LectureUpload {
    id: number
    title: string
    file_url: string
    faculty: string
    matiere: string
    type: 'lecture' | 'quiz' | 'exam'
    created_at: string
    uploaded_by: string
}

export default function ManageProfPage() {
    const { facultyNames } = useFaculties()
    const [professors, setProfessors] = useState<Professor[]>([])
    const [assignments, setAssignments] = useState<ProfAssignment[]>([])
    const [lectures, setLectures] = useState<LectureUpload[]>([])
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'profs' | 'assign' | 'lectures'>('profs')

    // Assignment form
    const [assignForm, setAssignForm] = useState({ prof_id: '', faculty: '', matiere: '', year_study: '1', session: '1' })
    // Lecture form
    const [lectureForm, setLectureForm] = useState({ title: '', faculty: '', matiere: '', type: 'lecture' as const })
    const [lectureFile, setLectureFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (assignForm.faculty) {
            loadCourses(assignForm.faculty, parseInt(assignForm.year_study))
        }
    }, [assignForm.faculty, assignForm.year_study])

    const fetchData = async () => {
        setLoading(true)
        const [profRes, assignRes, lectRes] = await Promise.all([
            supabase.from('profiles').select('id, full_name, role, email').eq('role', 'prof'),
            supabase.from('prof_assignment').select('*, professor:prof_id(full_name, email)'),
            supabase.from('lecture_upload').select('*').order('created_at', { ascending: false })
        ])
        setProfessors((profRes.data as unknown as Professor[]) || [])
        setAssignments((assignRes.data as unknown as ProfAssignment[]) || [])
        setLectures((lectRes.data as unknown as LectureUpload[]) || [])
        setLoading(false)
    }

    const loadCourses = async (faculty: string, year: number) => {
        const { data } = await supabase.from('course_program').select('courses').eq('faculty', faculty).eq('year', year)
        setCourses(data || [])
    }

    const handleAssign = async () => {
        if (!assignForm.prof_id || !assignForm.faculty || !assignForm.matiere) {
            setError('Veuillez remplir tous les champs')
            return
        }
        setSaving(true)
        setError('')
        const { error: insertError } = await supabase.from('prof_assignment').insert({
            prof_id: assignForm.prof_id,
            faculty: assignForm.faculty,
            matiere: assignForm.matiere,
            year_study: parseInt(assignForm.year_study),
            session: parseInt(assignForm.session)
        })
        if (insertError) setError(insertError.message)
        else {
            setMessage('Assignation créée')
            setAssignForm({ prof_id: '', faculty: '', matiere: '', year_study: '1', session: '1' })
            fetchData()
        }
        setSaving(false)
    }

    const handleDeleteAssignment = async (id: number) => {
        if (!confirm('Supprimer cette assignation ?')) return
        await supabase.from('prof_assignment').delete().eq('id', id)
        fetchData()
    }

    const handleUploadLecture = async () => {
        if (!lectureForm.title || !lectureForm.faculty || !lectureFile) {
            setError('Veuillez remplir tous les champs et sélectionner un fichier')
            return
        }
        // Validate file size (max 50MB)
        if (lectureFile.size > 50 * 1024 * 1024) {
            setError('Fichier trop grand (max 50MB)')
            return
        }
        setSaving(true)
        setError('')

        const fileExt = lectureFile.name.split('.').pop()
        const fileName = `${lectureForm.type}_${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('lectures')
            .upload(fileName, lectureFile)

        if (uploadError) {
            setError('Erreur upload: ' + uploadError.message)
            setSaving(false)
            return
        }

        const { data: urlData } = supabase.storage.from('lectures').getPublicUrl(fileName)
        const { data: { user } } = await supabase.auth.getUser()

        const { error: insertError } = await supabase.from('lecture_upload').insert({
            title: lectureForm.title,
            file_url: urlData.publicUrl,
            faculty: lectureForm.faculty,
            matiere: lectureForm.matiere,
            type: lectureForm.type,
            uploaded_by: user?.id
        })

        if (insertError) setError(insertError.message)
        else {
            setMessage(`${lectureForm.type === 'lecture' ? 'Cours' : lectureForm.type === 'quiz' ? 'Quiz' : 'Examen'} téléchargé avec succès`)
            setLectureForm({ title: '', faculty: '', matiere: '', type: 'lecture' })
            setLectureFile(null)
            fetchData()
        }
        setSaving(false)
    }

    const handleDeleteLecture = async (id: number) => {
        if (!confirm('Supprimer ce fichier ?')) return
        await supabase.from('lecture_upload').delete().eq('id', id)
        fetchData()
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestion Académique</h1>
                    <p className="text-gray-600">Gérez les professeurs, matières et contenus pédagogiques</p>
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
                <div className="flex gap-2 mb-6 flex-wrap">
                    {[
                        { key: 'profs', label: 'Professeurs & Matières', count: assignments.length },
                        { key: 'assign', label: 'Nouvelle Assignation' },
                        { key: 'lectures', label: 'Cours & Quiz', count: lectures.length },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                            className={`px-5 py-2.5 rounded-lg font-semibold transition text-sm ${activeTab === tab.key ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}>
                            {tab.label}
                            {'count' in tab && tab.count !== undefined && <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Professors & Assignments List */}
                        {activeTab === 'profs' && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Professeurs inscrits ({professors.length})</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {professors.map(prof => (
                                            <div key={prof.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                                <h4 className="font-bold text-gray-900">{prof.full_name}</h4>
                                                <p className="text-sm text-gray-500">{prof.email}</p>
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {assignments.filter(a => a.prof_id === prof.id).map(a => (
                                                        <span key={a.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                            {a.matiere}
                                                            <button onClick={() => handleDeleteAssignment(a.id)} className="text-blue-500 hover:text-red-600">✕</button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* All Assignments Table */}
                                <div className="bg-white rounded-2xl shadow-lg p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Assignations de Matières ({assignments.length})</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-blue-50 text-blue-800">
                                                    <th className="py-3 px-4 text-left font-semibold">Professeur</th>
                                                    <th className="py-3 px-4 text-left font-semibold">Faculté</th>
                                                    <th className="py-3 px-4 text-left font-semibold">Matière</th>
                                                    <th className="py-3 px-4 text-left font-semibold">Année</th>
                                                    <th className="py-3 px-4 text-left font-semibold">Session</th>
                                                    <th className="py-3 px-4 text-left font-semibold">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assignments.map((a, i) => (
                                                    <tr key={a.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                        <td className="py-3 px-4 font-medium">{a.professor?.full_name}</td>
                                                        <td className="py-3 px-4">{a.faculty}</td>
                                                        <td className="py-3 px-4">{a.matiere}</td>
                                                        <td className="py-3 px-4">{a.year_study}</td>
                                                        <td className="py-3 px-4">{a.session}</td>
                                                        <td className="py-3 px-4">
                                                            <button onClick={() => handleDeleteAssignment(a.id)}
                                                                className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200">
                                                                Supprimer
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* New Assignment Form */}
                        {activeTab === 'assign' && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Assigner une Matière à un Professeur</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Professeur *</label>
                                        <select value={assignForm.prof_id} onChange={e => setAssignForm({ ...assignForm, prof_id: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                            <option value="">-- Sélectionner --</option>
                                            {professors.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Faculté *</label>
                                        <select value={assignForm.faculty} onChange={e => setAssignForm({ ...assignForm, faculty: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                            <option value="">-- Sélectionner --</option>
                                            {facultyNames.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                                        <select value={assignForm.year_study} onChange={e => setAssignForm({ ...assignForm, year_study: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                            {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y}ème année</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
                                        <select value={assignForm.matiere} onChange={e => setAssignForm({ ...assignForm, matiere: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                            <option value="">-- Sélectionner --</option>
                                            {courses.map((c, i) => <option key={i} value={c.courses}>{c.courses}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                                        <select value={assignForm.session} onChange={e => setAssignForm({ ...assignForm, session: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                            <option value="1">Session 1</option>
                                            <option value="2">Session 2</option>
                                        </select>
                                    </div>
                                </div>
                                <button onClick={handleAssign} disabled={saving}
                                    className="mt-6 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                                    {saving ? 'Enregistrement...' : 'Assigner'}
                                </button>
                            </div>
                        )}

                        {/* Lectures & Quiz */}
                        {activeTab === 'lectures' && (
                            <div className="space-y-6">
                                {/* Upload Form */}
                                <div className="bg-white rounded-2xl shadow-lg p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Télécharger un Fichier</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                                            <input type="text" value={lectureForm.title} onChange={e => setLectureForm({ ...lectureForm, title: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="Titre du document" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                            <select value={lectureForm.type} onChange={e => setLectureForm({ ...lectureForm, type: e.target.value as any })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                                <option value="lecture">Cours</option>
                                                <option value="quiz">Quiz</option>
                                                <option value="exam">Examen</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Faculté *</label>
                                            <select value={lectureForm.faculty} onChange={e => setLectureForm({ ...lectureForm, faculty: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                                <option value="">-- Sélectionner --</option>
                                                {facultyNames.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
                                            <input type="text" value={lectureForm.matiere} onChange={e => setLectureForm({ ...lectureForm, matiere: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="Nom de la matière" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fichier *</label>
                                            <input type="file" onChange={e => setLectureFile(e.target.files?.[0] || null)}
                                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                        </div>
                                    </div>
                                    <button onClick={handleUploadLecture} disabled={saving}
                                        className="mt-6 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                                        {saving ? 'Téléchargement...' : 'Télécharger'}
                                    </button>
                                </div>

                                {/* Lectures List */}
                                <div className="bg-white rounded-2xl shadow-lg p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Fichiers Téléchargés ({lectures.length})</h3>
                                    {lectures.length === 0 ? (
                                        <p className="text-center text-gray-500 py-8">Aucun fichier téléchargé</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {lectures.map(l => (
                                                <div key={l.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${l.type === 'lecture' ? 'bg-blue-100 text-blue-700' : l.type === 'quiz' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                                            {l.type === 'lecture' ? 'Cours' : l.type === 'quiz' ? 'Quiz' : 'Examen'}
                                                        </span>
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{l.title}</h4>
                                                            <p className="text-xs text-gray-500">{l.faculty} • {l.matiere} • {new Date(l.created_at).toLocaleDateString('fr-FR')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <a href={l.file_url} target="_blank" rel="noopener noreferrer"
                                                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition">
                                                            Voir
                                                        </a>
                                                        <button onClick={() => handleDeleteLecture(l.id)}
                                                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition">
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
