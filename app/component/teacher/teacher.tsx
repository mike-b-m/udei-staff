'use client'
import { supabase } from "../db";
import { useState, useEffect } from "react";
import { exportToCSV, printHTML } from "../export/exportUtils";

interface TeacherInputProps {
    session: number | string | null 
    name: string | number
    matiere: string | null
    year: number | string | null
    id: number
    faculty: string | null
}

interface RepriseInputProps {
    session: number | string | null 
    not: number
    name: number
    matiere: string | null
    year: number | string | null
    id: number
    faculty: string | null
    nbr: number
}

interface NoteProps {
    intra: number
    final: number 
    repri_final: number
    repri_intra: number
}

const rowColors = [
  "bg-blue-50 hover:bg-blue-100",
  "bg-white hover:bg-blue-50"
]

const TABLE_HEADER_CLASS = "bg-linear-to-r from-blue-600 to-blue-500 text-white font-semibold";

// Reprise Modal Component
interface RepriseModalProps {
    isOpen: boolean
    onClose: () => void
    studentName: string
    matiere: string
    currentScore: number
    repriseType: 'intra' | 'final' | 'session'
    onSave: (value: number) => Promise<void>
}

function RepriseModal({ isOpen, onClose, studentName, matiere, currentScore, repriseType, onSave }: RepriseModalProps) {
    const [repriseScore, setRepriseScore] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSave = async () => {
        if (!repriseScore || repriseScore === '0') {
            setError('Veuillez entrer une note valide');
            return;
        }

        const score = parseFloat(repriseScore);
        if (score < 0 || score > 100) {
            setError('La note doit être entre 0 et 100');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await onSave(score);
            setRepriseScore('');
            onClose();
        } catch (err) {
            setError('Erreur lors de la sauvegarde');
        } finally {
            setIsLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Reprise - {repriseType === 'intra' ? 'Note Intra' : 'Note Finale'}
                    </h2>
                    <div className="h-1 w-16 bg-linear-to-r from-blue-600 to-blue-500 rounded-full"></div>
                </div>

                {/* Student Info */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Étudiant</p>
                    <p className="font-semibold text-gray-900">{studentName}</p>
                    <p className="text-sm text-gray-600 mt-2">Matière: <span className="font-medium">{matiere}</span></p>
                    <p className="text-sm text-gray-600">Note actuelle: <span className="font-bold text-blue-600">{currentScore}/100</span></p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nouvelle note ({repriseType === 'intra' ? 'Reprise Intra' : 'Reprise Finale'})
                    </label>
                    <input
                        type="number"
                        value={repriseScore}
                        onChange={(e) => setRepriseScore(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                        placeholder="Ex: 75"
                        min={0}
                        max={100}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-lg"
                        autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">Note: Entrez une valeur entre 0 et 100</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:bg-gray-100"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition disabled:from-gray-400 disabled:to-gray-400 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="inline-block animate-spin">⟳</span>
                                Enregistrement...
                            </>
                        ) : (
                            'Enregistrer'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

// Reprise Button Component
interface RepriseButtonProps {
    score: number | null
    repriseScore: number | null
    studentName: string
    matiere: string
    repriseType: 'intra' | 'final' | 'session'
    examId: number
    studentId: number
    session: number | string | null
    year: number | string | null
    tabl: string | null
    onSuccess?: () => void
}

function RepriseButton({ 
    score, 
    repriseScore, 
    studentName, 
    matiere, 
    repriseType, 
    examId,
    studentId,
    session,
    year,
    tabl,
    onSuccess 
}: RepriseButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Show button only if original score is between 50-64 and reprise doesn't exist
    const shouldShow = score && score >= 50 && score <= 64 && !repriseScore;

    const handleSaveReprise = async (value: number) => {
        const field = repriseType === 'intra' || repriseType === 'final' ? 'repri_intra' : repriseType === 'session' ? `note` : 'repri_final5';
        
        const { error } = await supabase
            .from(`${tabl}`)
            .update({ [field]: value })
            .eq('id', examId);

        if (error) {
            throw new Error(error.message);
        }
        
        if (onSuccess) {
            onSuccess();
        }
    }

    if (!shouldShow) {
        return null;
    }

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition whitespace-nowrap"
            >
                + Ajouter Reprise
            </button>
            <RepriseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                studentName={studentName}
                matiere={matiere}
                currentScore={score || 0}
                repriseType={repriseType}
                onSave={handleSaveReprise}
            />
        </>
    )
}
//----- insert intra ---------
export default function TeacherInput({session, name, matiere, id, year, faculty, }: TeacherInputProps) {
    const [note, setNote] = useState('')
    const [read, setRead] = useState(false)
    const [fullname, setFullname] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const getData = async () => {
            const { data: stud, error: second } = await supabase.from('student')
                .select('id,last_name,first_name').eq('id', id);
            if (second) console.error(second.message)
            else setFullname(stud)
        }
        getData()
    }, [id])

    useEffect(() => {
        const getData = async () => {
            const { data: stud, error: second } = await supabase.from('student')
                .select('id,last_name,first_name').eq('id', id);
            if (second) console.error(second.message)
            else setFullname(stud)

            const { data, error } = await supabase.from('exam')
                .select('*')
                .eq('student_id', id).eq('matiere', matiere).eq('session', session).eq('year', year).maybeSingle();
            if (data?.matiere === matiere) {
                setRead(false)
            }
            else if (matiere) setRead(true)
            if (error) {
                console.error(error.message)
            }
        }
        getData()
    }, [matiere, id, session, year])

    const handleSave = async () => {
        if (!note || note === '0') {
            alert('Veuillez entrer une note');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('exam')
                .select('*')
                .eq('student_id', id).eq('matiere', matiere).single();
            
            if (data?.matiere !== null) {
                if (matiere) {
                    const { error: status_error } = await supabase.from('exam')
                        .insert([{ intra: note, matiere, session, year, faculty, student_id: id }])
                        .select('*')
                        .eq('student_id', id);
                    
                    if (status_error) {
                        console.error(status_error.message)
                        alert('Erreur lors de la sauvegarde')
                    } else {
                        console.log('Note intra sauvegardée')
                        setNote('')
                        setRead(false)
                    }
                }
                else console.error('matiere non selected')
            }
            else {
                console.error('donnees non existent')
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full">
            {read ? (
                <div className="flex items-center gap-3 p-3">
                    <div className="flex-1 text-sm font-medium">{fullname[0]?.last_name} {fullname[0]?.first_name}</div>
                    <input 
                        type="number" 
                        value={note} 
                        max={100} 
                        min={0}
                        placeholder="0"
                        className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        onChange={(e) => setNote(e.target.value)}
                    />
                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                    >
                        {isLoading ? 'Saving...' : 'Enregistrer'}
                    </button>
                </div>
            ) : null}
        </div>
    )
}

//====== insert session ========
export function TeacherSession({session, name, matiere, id, year, faculty}: TeacherInputProps) {
    const [note, setNote] = useState('')
    const [read, setRead] = useState(false)
    const [fullname, setFullname] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const getData = async () => {
            const { data: stud, error: second } = await supabase.from('student')
                .select('id,last_name,first_name').eq('id', id);
            if (second) console.error(second.message)
            else setFullname(stud)
        }
        getData()
    }, [id])

    useEffect(() => {
        const getData = async () => {
            const { data: stud, error: second } = await supabase.from('student')
                .select('id,last_name,first_name').eq('id', id);
            if (second) console.error(second.message)
            else setFullname(stud)

            const { data, error } = await supabase.from('exam_1')
                .select('*')
                .eq('student_id', id).eq('matiere', matiere).eq('session', session).eq('year', year).maybeSingle();
            if (data?.matiere === matiere) {
                setRead(false)
            }
            else if (matiere) setRead(true)
            if (error) {
                console.error(error.message)
            }
        }
        getData()
    }, [matiere, id, session, year])

    const handleSave = async () => {
        if (!note || note === '0') {
            alert('Veuillez entrer une note');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('exam')
                .select('*')
                .eq('student_id', id).eq('matiere', matiere).single();
            
            if (data?.matiere !== null) {
                if (matiere && note<='100' ||matiere && note>='0') {
                    const { error: status_error } = await supabase.from('exam_1')
                        .insert([{ note, matiere, session, year, faculty, student_id: id }])
                        .select('*')
                        .eq('student_id', id);
                    
                    if (status_error) {
                        console.error(status_error.message)
                        alert('Erreur lors de la sauvegarde')
                    } else {
                        console.log('Note intra sauvegardée')
                        setNote('')
                        setRead(false)
                    }
                }
                else console.error('matiere non selected')
            }
            else {
                console.error('donnees non existent')
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full">
            {read ? (
                <div className="flex items-center gap-3 p-3">
                    <div className="flex-1 text-sm font-medium">{fullname[0]?.last_name} {fullname[0]?.first_name}</div>
                    <input 
                        type="number" 
                        value={note} 
                        max={100} 
                        min={0}
                        placeholder="0"
                        className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        onChange={(e) => setNote(e.target.value)}
                    />
                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                    >
                        {isLoading ? 'Saving...' : 'Enregistrer'}
                    </button>
                </div>
            ) : null}
        </div>
    )
}

export function TeacherInput2({session, name, matiere, id, year}: TeacherInputProps) {
    const [note, setNote] = useState('')
    const [read, setRead] = useState(false)
    const [dat, setdat] = useState<any>()
    const [fullname, setFullname] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const getData = async () => {
            const { data: stud, error: second } = await supabase.from('student')
                .select('id,last_name,first_name').eq('id', id);
            if (second) console.error(second.message)
            else setFullname(stud)
        }
        getData()
    }, [id])

    useEffect(() => {
        const getData = async () => {
            const { data, error } = await supabase.from('exam')
                .select('*')
                .eq('student_id', id).eq('matiere', matiere).eq('session', session).eq('year', year).maybeSingle();
            if (data?.intra !== null && data?.final === null) {
                setRead(true)
                setdat(data)
            }
            else {
                setRead(false)
            }
        }
        getData()
    }, [matiere, id, session, year])

    const handleSave = async () => {
        if (!note || note === '0') {
            alert('Veuillez entrer une note');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('exam')
                .select('final')
                .eq('student_id', id).eq('matiere', matiere).single();
            
            if (data?.final !== null) {
                console.error('Note finale déjà existante')
                return;
            }

            const { error: status_error } = await supabase.from('exam')
                .update([{ final: note }])
                .select('*')
                .eq('student_id', id).eq('matiere', matiere).eq('session', session).eq('year', year);

            if (status_error) {
                console.error(status_error.message)
                alert('Erreur lors de la sauvegarde')
            } else {
                console.log('Note finale sauvegardée')
                setNote('')
                setRead(false)
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full">
            {read ? (
                <div className="flex items-center gap-3 p-3">
                    <div className="flex-1 text-sm font-medium">{fullname[0]?.last_name} {fullname[0]?.first_name}</div>
                    <div className="w-20 text-center px-2 py-2 bg-blue-100 rounded-lg font-medium">{dat?.intra}</div>
                    <input 
                        type="number" 
                        value={note} 
                        max={100} 
                        min={0}
                        placeholder="0"
                        className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        onChange={(e) => setNote(e.target.value)}
                    />
                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                    >
                        {isLoading ? 'Saving...' : 'Enregistrer'}
                    </button>
                </div>
            ) : null}
        </div>
    )
}

export function RepriseInput({session, not, matiere, name, nbr, id, year, faculty}: RepriseInputProps) {
    const [note, setNote] = useState('')
    const [read, setRead] = useState(false)
    const [dat, setdat] = useState<any>()
    const [fullname, setFullname] = useState<any[]>([])
    const [dis, setDis] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (not <= 65 && not >= 50 && !name || not <= 65 && not >= 50 && name >= 50 && name < 65) {
            setDis(false)
        }
        else setDis(true)
    }, [not, name])

    useEffect(() => {
        const getData = async () => {
            const { data, error } = await supabase.from('exam')
                .select('*')
                .eq('student_id', id).eq('matiere', matiere).eq('session', session).eq('year', year).maybeSingle();
            if (data?.intra !== null && data?.final === null) {
                setdat(data)
            }
        }
        getData()
    }, [matiere, id, session, year])

    const handleSave = async () => {
        if (!note || note === '0') {
            alert('Veuillez entrer une note');
            return;
        }

        setIsLoading(true);
        try {
            if (nbr === 1) {
                const { error: status_error } = await supabase.from('exam')
                    .update([{ repri_intra: note }])
                    .select('*')
                    .eq('id', id)
                if (status_error) {
                    console.error(status_error.message)
                    alert('Erreur lors de la sauvegarde')
                } else {
                    console.log('Note reprise intra sauvegardée')
                    setNote('')
                    setRead(false)
                }
            }
            else if (nbr === 2) {
                const { error: status_error } = await supabase.from('exam')
                    .update([{ repri_final: note }])
                    .select('*')
                    .eq('id', id)
                if (status_error) {
                    console.error(status_error.message)
                    alert('Erreur lors de la sauvegarde')
                } else {
                    console.log('Note reprise finale sauvegardée')
                    setNote('')
                    setRead(false)
                }
            }
        } finally {
            setIsLoading(false);
        }
    }

    const getButtonLabel = () => {
        if (not <= 65 && not >= 50 && !name) {
            return <span className="text-red-600 font-semibold">Ajouter</span>
        }
        return <span className={name < 65 && name >= 50 ? 'text-red-600 font-semibold' : 'text-green-600'}>{name}</span>
    }

    return (
        <div>
            <button
                disabled={dis}
                onClick={() => setRead(!read)}
                className={`px-3 py-2 rounded-lg font-medium transition ${dis ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-blue-50 text-blue-600'}`}
            >
                {getButtonLabel()}
            </button>
            {read ? (
                <div className="flex gap-2 mt-2 p-2 bg-blue-50 rounded-lg">
                    <input
                        type="number"
                        value={note}
                        max={100}
                        min={0}
                        placeholder="0"
                        className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => setNote(e.target.value)}
                    />
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                    >
                        {isLoading ? 'Saving...' : 'Enregistrer'}
                    </button>
                </div>
            ) : null}
        </div>
    )
}

export function Readsession({ session, year, id }: TeacherInputProps) {
    const [note, setNote] = useState<any[]>([])
    const [fullname, setFullname] = useState<any[]>([])
    const [selectedMatiere, setSelectedMatiere] = useState<string | null>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [role, setRole] = useState<string | null>(null)

     useEffect(() => {
        const getData = async () => {
            // IMPORTANT: Do not remove this — it refreshes the auth token
  const { data: { user } } = await supabase.auth.getUser()
            const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single()
      setRole(profile?.role || null)
        }
        getData()
    }, [id])
    useEffect(() => {
        const getData = async () => {
            const { data: stud, error: second } = await supabase.from('student')
                .select('id,last_name,first_name').eq('id', id);
            if (second) console.error(second.message)
            else setFullname(stud)
        }
        getData()
    }, [id])

    useEffect(() => {
        const getData = async () => {
            const { data, error } = await supabase.from('exam_1')
                .select('*')
                .eq('student_id', id).eq('session', session).eq('year', year)
            if (error) console.error(error.message)
            else setNote(data || [])
        }
        getData()
    }, [id, session, year, refreshTrigger])

    const calculateFinal = (intra: number, final: number) => {
        const finalSession = Math.max(intra|| 0);
        return (finalSession).toFixed(2);
    }

    const handleRepriseSuccess = () => {
        // Refetch the data after a reprise is saved
        setRefreshTrigger(prev => prev + 1);
    }

    const totalSession = note?.reduce((acc: number, item: any) => acc + Number(item.note || 0), 0) || 0;
    const totalFinal = note?.reduce((acc: number, item: any) => acc + Number(item.final || 0), 0) || 0;

    return (
        <div className="w-full bg-white p-4 rounded-2xl">
            {/* Student Header */}
            <div className={`${TABLE_HEADER_CLASS} rounded-xl p-4 mb-4`}>
                <h3 className="text-lg font-bold">
                    {fullname[0]?.last_name} {fullname[0]?.first_name}
                </h3>
                <div className="text-sm mt-2 space-y-1">
                    <p>Année: <span className="font-semibold">{year}</span></p>
                    <p>Session: <span className="font-semibold">{session}</span></p>
                    <p>Faculté: <span className="font-semibold">{note[0]?.faculty || 'N/A'}</span></p>
                </div>
            </div>

            {/* Export Buttons */}
            {note.length > 0 && (role ==='admin' || role === 'editor' || role === 'administration' || role === 'prof') ? (
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => {
                            const studentName = `${fullname[0]?.last_name || ''} ${fullname[0]?.first_name || ''}`
                            const title = `Notes - ${studentName} - Session ${session} - Année ${year}`
                            const html = `
                                <h2>${title}</h2>
                                <div class="info">
                                    <p><strong>Faculté:</strong> ${note[0]?.faculty || 'N/A'}</p>
                                    <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                                </div>
                                <table>
                                    <thead><tr><th>Matière</th><th>Note Session</th><th>Reprise</th><th>Moyenne</th></tr></thead>
                                    <tbody>
                                        ${note.map((n: any) => {
                                            const avg = ((n.note || 0) / 10).toFixed(2)
                                            return `<tr><td>${n.matiere}</td><td>${n.note || '-'}</td><td>${n.repri_note || '-'}</td><td>${avg}</td></tr>`
                                        }).join('')}
                                        <tr class="total-row"><td>Total</td><td>${totalSession}</td><td>-</td><td>${((totalSession) / (note.length * 10)).toFixed(2)}</td></tr>
                                    </tbody>
                                </table>
                            `
                            printHTML(title, html)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        PDF
                    </button>
                    <button
                        onClick={() => {
                            const headers = ['Matière', 'Note Session', 'Reprise', 'Moyenne']
                            const rows = note.map((n: any) => [
                                n.matiere || '',
                                String(n.note || '-'),
                                String(n.repri_note || '-'),
                                ((n.note || 0) / 10).toFixed(2),
                            ])
                            rows.push(['Total', String(totalSession), '-', ((totalSession) / (note.length * 10)).toFixed(2)])
                            const studentName = `${fullname[0]?.last_name || ''}_${fullname[0]?.first_name || ''}`
                            exportToCSV(headers, rows, `notes_session_${studentName}_s${session}_y${year}`)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                        Excel
                    </button>
                    <button
                        onClick={() => {
                            const studentName = `${fullname[0]?.last_name || ''} ${fullname[0]?.first_name || ''}`
                            const title = `Notes - ${studentName} - Session ${session} - Année ${year}`
                            const html = `
                                <h2>${title}</h2>
                                <div class="info">
                                    <p><strong>Faculté:</strong> ${note[0]?.faculty || 'N/A'}</p>
                                    <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                                </div>
                                <table>
                                    <thead><tr><th>Matière</th><th>Session ${session}</th><th>Moyenne</th></tr></thead>
                                    <tbody>
                                        ${note.map((n: any) => {
                                            const avg =  ((n.note) / (10)).toFixed(2)
                                            return `<tr><td>${n.matiere}</td><td>${n.note || '-'}</td><td>${avg}</td></tr>`
                                        }).join('')}
                                        <tr class="total-row"><td>Total</td><td>${totalSession}</td><td>Total Moyenne</td><td>${((totalSession + totalFinal) / (note.length * 10)).toFixed(2)}</td></tr>
                                    </tbody>
                                </table>
                            `
                            printHTML(title, html)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Imprimer
                    </button>
                </div>
            ): null}

            {/* Notes Table */}
            {note.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full">
                        <thead>
                            <tr className={TABLE_HEADER_CLASS}>
                                <th className="px-4 py-3 text-left">Matière</th>
                                <th className="px-4 py-3 text-center">Session {session}</th>
                                {role ==='admin' || role === 'editor' || role === 'administration' || role === 'prof' ? (
                                    <th className="px-4 py-3 text-center">Reprise Session I</th>
                                ) : null}
                                <th className="px-4 py-3 text-center">Moyenne</th>
                            </tr>
                        </thead>
                        <tbody>
                            {note.map((not, index) => {
                                const moyenne = ((not.note) / (10)).toFixed(2);
                                const moyenneNum = parseFloat(moyenne);
                                let statusColor = 'bg-red-50';
                                let statusText = 'text-red-700';
                                if (moyenneNum >= 7) {
                                    statusColor = 'bg-green-50';
                                    statusText = 'text-green-700';
                                } else if (moyenneNum >= 5) {
                                    statusColor = 'bg-amber-50';
                                    statusText = 'text-amber-700';
                                }

                                return (
                                    <tr
                                        key={not.id}
                                        className={`${rowColors[index % rowColors.length]} border-t border-gray-200 transition hover:shadow-md`}
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-800">{not.matiere}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-block bg-blue-100 text-blue-900 font-semibold px-3 py-1 rounded-full">
                                                {not.note || '-'}
                                            </span>
                                        </td>
                                            {role ==='admin' || role === 'editor' || role === 'administration' || role === 'prof' ? (
                                                <td className="px-4 py-3 text-center">
                                               {not.repri_note ? (
                                                    <span className="inline-block bg-orange-100 text-orange-900 font-semibold px-3 py-1 rounded-full">
                                                        {not.repri_note}
                                                    </span>
                                                ) : (
                                                    <RepriseButton
                                                    score={not.note}
                                                    repriseScore={not.repri_note}
                                                    studentName={`${fullname[0]?.last_name} ${fullname[0]?.first_name}`}
                                                    matiere={not.matiere}
                                                    repriseType="session"
                                                    examId={not.id}
                                                    studentId={id}
                                                    session={not.session}
                                                    year={not.year}
                                                    tabl="exam_1"
                                                    onSuccess={handleRepriseSuccess}
                                                />
                                            )} </td>): null}
                                       
                                        <td className={`px-4 py-3 text-center`}>
                                            <span className={`inline-block ${statusColor} ${statusText} font-bold px-3 py-1 rounded-full`}>
                                                {moyenne}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* Totals Row */}
                            <tr className="bg-blue-600 text-white font-bold">
                                <td className="px-4 py-3">Total</td>
                                <td className="px-4 py-3 text-center">{totalSession}</td>
                                {(role ==='admin' || role === 'editor' || role === 'administration' || role === 'prof') && (
                                    <td className="px-4 py-3 text-center">-</td>
                                )}
                                <td className="px-4 py-3 text-center">Moyenne</td>
                                <td className="px-4 py-3 text-center">
                                    {((totalSession + totalFinal) / (note.length * 10)).toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">Aucune note disponible pour cet étudiant</p>
                </div>
            )}
        </div>
    )
}

//----- read session -----
export function ReadNote({ session, year, id }: TeacherInputProps) {
    const [note, setNote] = useState<any[]>([])
    const [fullname, setFullname] = useState<any[]>([])
    const [selectedMatiere, setSelectedMatiere] = useState<string | null>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    useEffect(() => {
        const getData = async () => {
            const { data: stud, error: second } = await supabase.from('student')
                .select('id,last_name,first_name').eq('id', id);
            if (second) console.error(second.message)
            else setFullname(stud)
        }
        getData()
    }, [id])

    useEffect(() => {
        const getData = async () => {
            const { data, error } = await supabase.from('exam')
                .select('*')
                .eq('student_id', id).eq('session', session).eq('year', year)
            if (error) console.error(error.message)
            else setNote(data || [])
        }
        getData()
    }, [id, session, year, refreshTrigger])

    const calculateFinal = (intra: number, final: number, repri_intra: number, repri_final: number) => {
        const finalIntra = Math.max(intra, repri_intra || 0);
        const finalFinal = Math.max(final, repri_final || 0);
        return ((finalIntra + finalFinal) / 2).toFixed(2);
    }

    const handleRepriseSuccess = () => {
        // Refetch the data after a reprise is saved
        setRefreshTrigger(prev => prev + 1);
    }

    const totalIntra = note?.reduce((acc: number, item: any) => acc + Number(item.intra || 0), 0) || 0;
    const totalFinal = note?.reduce((acc: number, item: any) => acc + Number(item.final || 0), 0) || 0;

    return (
        <div className="w-full bg-white p-4 rounded-2xl">
            {/* Student Header */}
            <div className={`${TABLE_HEADER_CLASS} rounded-xl p-4 mb-4`}>
                <h3 className="text-lg font-bold">
                    {fullname[0]?.last_name} {fullname[0]?.first_name}
                </h3>
                <div className="text-sm mt-2 space-y-1">
                    <p>Année: <span className="font-semibold">{year}</span></p>
                    <p>Session: <span className="font-semibold">{session}</span></p>
                    <p>Faculté: <span className="font-semibold">{note[0]?.faculty || 'N/A'}</span></p>
                </div>
            </div>

            {/* Export Buttons */}
            {note.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => {
                            const studentName = `${fullname[0]?.last_name || ''} ${fullname[0]?.first_name || ''}`
                            const title = `Notes - ${studentName} - Session ${session} - Année ${year}`
                            const html = `
                                <h2>${title}</h2>
                                <div class="info">
                                    <p><strong>Faculté:</strong> ${note[0]?.faculty || 'N/A'}</p>
                                    <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                                </div>
                                <table>
                                    <thead><tr><th>Matière</th><th>Note Intra</th><th>Reprise Intra</th><th>Note Finale</th><th>Reprise Finale</th><th>Moyenne</th></tr></thead>
                                    <tbody>
                                        ${note.map((n: any) => {
                                            const avg = calculateFinal(n.intra, n.final, n.repri_intra, n.repri_final)
                                            return `<tr><td>${n.matiere}</td><td>${n.intra || '-'}</td><td>${n.repri_intra || '-'}</td><td>${n.final || '-'}</td><td>${n.repri_final || '-'}</td><td>${avg}</td></tr>`
                                        }).join('')}
                                        <tr class="total-row"><td>Total</td><td>${totalIntra}</td><td>-</td><td>${totalFinal}</td><td>-</td><td>${((totalIntra + totalFinal) / (note.length * 2)).toFixed(2)}</td></tr>
                                    </tbody>
                                </table>
                            `
                            printHTML(title, html)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        PDF
                    </button>
                    <button
                        onClick={() => {
                            const headers = ['Matière', 'Note Intra', 'Reprise Intra', 'Note Finale', 'Reprise Finale', 'Moyenne']
                            const rows = note.map((n: any) => [
                                n.matiere || '',
                                String(n.intra || '-'),
                                String(n.repri_intra || '-'),
                                String(n.final || '-'),
                                String(n.repri_final || '-'),
                                calculateFinal(n.intra, n.final, n.repri_intra, n.repri_final),
                            ])
                            rows.push(['Total', String(totalIntra), '-', String(totalFinal), '-', ((totalIntra + totalFinal) / (note.length * 2)).toFixed(2)])
                            const studentName = `${fullname[0]?.last_name || ''}_${fullname[0]?.first_name || ''}`
                            exportToCSV(headers, rows, `notes_${studentName}_s${session}_y${year}`)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                        Excel
                    </button>
                    <button
                        onClick={() => {
                            const studentName = `${fullname[0]?.last_name || ''} ${fullname[0]?.first_name || ''}`
                            const title = `Notes - ${studentName} - Session ${session} - Année ${year}`
                            const html = `
                                <h2>${title}</h2>
                                <div class="info">
                                    <p><strong>Faculté:</strong> ${note[0]?.faculty || 'N/A'}</p>
                                    <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                                </div>
                                <table>
                                    <thead><tr><th>Matière</th><th>Note Intra</th><th>Reprise Intra</th><th>Note Finale</th><th>Reprise Finale</th><th>Moyenne</th></tr></thead>
                                    <tbody>
                                        ${note.map((n: any) => {
                                            const avg = calculateFinal(n.intra, n.final, n.repri_intra, n.repri_final)
                                            return `<tr><td>${n.matiere}</td><td>${n.intra || '-'}</td><td>${n.repri_intra || '-'}</td><td>${n.final || '-'}</td><td>${n.repri_final || '-'}</td><td>${avg}</td></tr>`
                                        }).join('')}
                                        <tr class="total-row"><td>Total</td><td>${totalIntra}</td><td>-</td><td>${totalFinal}</td><td>-</td><td>${((totalIntra + totalFinal) / (note.length * 2)).toFixed(2)}</td></tr>
                                    </tbody>
                                </table>
                            `
                            printHTML(title, html)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Imprimer
                    </button>
                </div>
            )}

            {/* Notes Table */}
            {note.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full">
                        <thead>
                            <tr className={TABLE_HEADER_CLASS}>
                                <th className="px-4 py-3 text-left">Matière</th>
                                <th className="px-4 py-3 text-center">Note Intra</th>
                                <th className="px-4 py-3 text-center">Reprise Intra</th>
                                <th className="px-4 py-3 text-center">Note Finale</th>
                                <th className="px-4 py-3 text-center">Reprise Finale</th>
                                <th className="px-4 py-3 text-center">Moyenne</th>
                            </tr>
                        </thead>
                        <tbody>
                            {note.map((not, index) => {
                                const moyenne = calculateFinal(not.intra, not.final, not.repri_intra, not.repri_final);
                                const moyenneNum = parseFloat(moyenne);
                                let statusColor = 'bg-red-50';
                                let statusText = 'text-red-700';
                                if (moyenneNum >= 70) {
                                    statusColor = 'bg-green-50';
                                    statusText = 'text-green-700';
                                } else if (moyenneNum >= 50) {
                                    statusColor = 'bg-amber-50';
                                    statusText = 'text-amber-700';
                                }

                                return (
                                    <tr
                                        key={not.id}
                                        className={`${rowColors[index % rowColors.length]} border-t border-gray-200 transition hover:shadow-md`}
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-800">{not.matiere}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-block bg-blue-100 text-blue-900 font-semibold px-3 py-1 rounded-full">
                                                {not.intra || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {not.repri_intra ? (
                                                <span className="inline-block bg-orange-100 text-orange-900 font-semibold px-3 py-1 rounded-full">
                                                    {not.repri_intra}
                                                </span>
                                            ) : (
                                                <RepriseButton
                                                    score={not.intra}
                                                    repriseScore={not.repri_intra}
                                                    studentName={`${fullname[0]?.last_name} ${fullname[0]?.first_name}`}
                                                    matiere={not.matiere}
                                                    repriseType="intra"
                                                    examId={not.id}
                                                    studentId={id}
                                                    session={not.session}
                                                    year={not.year}
                                                    tabl="exam"
                                                    onSuccess={handleRepriseSuccess}
                                                />
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-block bg-blue-100 text-blue-900 font-semibold px-3 py-1 rounded-full">
                                                {not.final || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {not.repri_final ? (
                                                <span className="inline-block bg-orange-100 text-orange-900 font-semibold px-3 py-1 rounded-full">
                                                    {not.repri_final}
                                                </span>
                                            ) : (
                                                <RepriseButton
                                                    score={not.final}
                                                    repriseScore={not.repri_final}
                                                    studentName={`${fullname[0]?.last_name} ${fullname[0]?.first_name}`}
                                                    matiere={not.matiere}
                                                    repriseType="final"
                                                    examId={not.id}
                                                    studentId={id}
                                                    session={not.session}
                                                    year={not.year}
                                                    tabl="exam"
                                                    onSuccess={handleRepriseSuccess}
                                                />
                                            )}
                                        </td>
                                        <td className={`px-4 py-3 text-center`}>
                                            <span className={`inline-block ${statusColor} ${statusText} font-bold px-3 py-1 rounded-full`}>
                                                {moyenne}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* Totals Row */}
                            <tr className="bg-blue-600 text-white font-bold">
                                <td className="px-4 py-3">Total</td>
                                <td className="px-4 py-3 text-center">{totalIntra}</td>
                                <td className="px-4 py-3 text-center">-</td>
                                <td className="px-4 py-3 text-center">{totalFinal}</td>
                                <td className="px-4 py-3 text-center">-</td>
                                <td className="px-4 py-3 text-center">
                                    {((totalIntra + totalFinal) / (note.length * 2)).toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">Aucune note disponible pour cet étudiant</p>
                </div>
            )}
        </div>
    )
}

export function CalculSession({ intra, final, repri_final, repri_intra }: NoteProps) {
    const [fin, setFin] = useState<number>(0)
    const [int, setInt] = useState<number>(0)

    useEffect(() => {
        if (intra > (repri_intra || 0)) setInt(intra)
        else if (intra < (repri_intra || 0)) setInt(repri_intra)
        else setInt(intra)

        if (final > (repri_final || 0)) setFin(final)
        else if (final < (repri_final || 0)) setFin(repri_final)
        else setFin(final)
    }, [intra, final, repri_intra, repri_final])

    const moyenne = ((fin + int) / 2).toFixed(2);
    const moyenneNum = parseFloat(moyenne);

    let statusColor = 'text-red-600 font-bold';
    if (moyenneNum >= 70) {
        statusColor = 'text-green-600 font-bold';
    } else if (moyenneNum >= 50) {
        statusColor = 'text-amber-600 font-bold';
    }

    return (
        <div className={`text-center ${statusColor} px-3 py-1 bg-gray-100 rounded-lg`}>
            {moyenne}
        </div>
    )
}

// Backward compatibility exports
export const TheacherInput = TeacherInput;
export const TheacherInput2 = TeacherInput2;