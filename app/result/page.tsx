'use client'
import { supabase } from "@/app/component/db";
import { useState, useEffect } from "react";
import { Filter2 } from "@/app/component/filter/filter";
import { ReadNote, Readsession } from "@/app/component/teacher/teacher";
import { calculateGPA, type GradeEntry } from "@/app/lib/gpa";

// ============ Payment History Section ============
function PaymentSection({ paymentRecord }: { paymentRecord: any }) {
    const history: any[] = paymentRecord?.payment_history || []
    const currentBalance = paymentRecord?.balance ?? 0
    const totalPrice = paymentRecord?.price ?? paymentRecord?.amount ?? 0
    const discount = paymentRecord?.discount ?? 0
    const totalPaid = totalPrice - discount - currentBalance

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-linear-to-r from-green-600 to-emerald-500 p-6 text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                    </svg>
                    Historique des Paiements
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="bg-white/15 rounded-lg p-3 text-center">
                        <p className="text-green-100 text-xs font-medium">Frais Total</p>
                        <p className="text-lg font-bold">{Number(totalPrice).toLocaleString()} HTG</p>
                    </div>
                    {discount > 0 && (
                        <div className="bg-white/15 rounded-lg p-3 text-center">
                            <p className="text-green-100 text-xs font-medium">Remise</p>
                            <p className="text-lg font-bold">-{Number(discount).toLocaleString()} HTG</p>
                        </div>
                    )}
                    <div className="bg-white/15 rounded-lg p-3 text-center">
                        <p className="text-green-100 text-xs font-medium">Total Payé</p>
                        <p className="text-lg font-bold">{Number(totalPaid).toLocaleString()} HTG</p>
                    </div>
                    <div className="bg-white/15 rounded-lg p-3 text-center">
                        <p className="text-green-100 text-xs font-medium">Solde Restant</p>
                        <p className="text-lg font-bold">{Number(currentBalance).toLocaleString()} HTG</p>
                    </div>
                </div>
            </div>
            <div className="px-6 pt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progression</span>
                    <span>{(totalPrice - discount) > 0 ? Math.round((totalPaid / (totalPrice - discount)) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-linear-to-r from-green-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(totalPrice - discount) > 0 ? Math.min((totalPaid / (totalPrice - discount)) * 100, 100) : 0}%` }} />
                </div>
            </div>
            <div className="p-6">
                {history.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-700">
                                    <th className="py-3 px-4 text-left font-semibold">#</th>
                                    <th className="py-3 px-4 text-left font-semibold">Date</th>
                                    <th className="py-3 px-4 text-right font-semibold">Montant</th>
                                    <th className="py-3 px-4 text-right font-semibold">Solde Après</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((entry: any, i: number) => (
                                    <tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition`}>
                                        <td className="py-3 px-4 text-gray-500 font-medium">{i + 1}</td>
                                        <td className="py-3 px-4 text-gray-700">
                                            {entry.date ? new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="inline-flex items-center gap-1 text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                                                + {Number(entry.amount || 0).toLocaleString()} HTG
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-gray-700">
                                            {Number(entry.balance || 0).toLocaleString()} HTG
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p className="font-medium">Aucun paiement enregistré</p>
                        <p className="text-sm mt-1">Les paiements apparaîtront ici une fois effectués</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============ Program by Semester Section ============
function ProgramSection({ program }: { program: any[] }) {
    const sem1 = program.filter(p => p.session === 1)
    const sem2 = program.filter(p => p.session === 2)

    const renderTable = (courses: any[], title: string) => (
        <div className="mb-6">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                {title}
            </h4>
            {courses.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-blue-50 text-blue-800">
                                <th className="py-2 px-3 text-left font-semibold">Matière</th>
                                <th className="py-2 px-3 text-left font-semibold">Crédits</th>
                                <th className="py-2 px-3 text-left font-semibold">Séances/Mois</th>
                                <th className="py-2 px-3 text-left font-semibold">H/Séance</th>
                                <th className="py-2 px-3 text-left font-semibold">Total H</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((c: any, i: number) => (
                                <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="py-2 px-3 font-medium">{c.courses || c.course_name}</td>
                                    <td className="py-2 px-3">{c.credit || c.credits}</td>
                                    <td className="py-2 px-3">{c.session_subjet}</td>
                                    <td className="py-2 px-3">{c.hour_session}</td>
                                    <td className="py-2 px-3">{c.total_hour}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-500 text-sm italic">Pas encore de cours assigné</p>
            )}
        </div>
    )

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-600 rounded"></span>
                Programme d&apos;Études
            </h3>
            {renderTable(sem1, 'Semestre 1')}
            {renderTable(sem2, 'Semestre 2')}
        </div>
    )
}

// ============ Important Dates Section ============
function ImportantDatesSection() {
    const [dat, setDat] = useState<any[]>([])
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.from('imp_date').select('*')
            if (data) setDat(data)
        }
        load()
    }, [])

    const icons = ['📚', '📝', '🎄', '📋', '📚', '📋', '🎉', '📖']
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-orange-500 rounded"></span>
                Dates Importantes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dat.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:bg-blue-50 transition">
                        <span className="text-2xl">{icons[i % icons.length]}</span>
                        <div>
                            <p className="font-medium text-gray-900 text-sm">{d.tittle}</p>
                            <p className="text-xs text-gray-500">{d.date}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function ResultDashboard(){
    const [userX,setUser] = useState<any[]>([])
    const [status,setStatus] = useState<any[]>([])
    const [session,setSession] = useState(false)
    const [session2,setSession2] = useState(false)
    const [mat,setMat] = useState(false)
    const [showPayments, setShowPayments] = useState(false)
    const [showProgram, setShowProgram] = useState(false)
    const [showDates, setShowDates] = useState(false)
    const [code,setCode] = useState('')
    const [sendCode,setsenCode] = useState(false)
    const [load,setLoad] = useState(false)
    const [result,setResult] = useState(false)
    const [program,setProgram] = useState<any[]>([])
    const [paymentRecord,setPaymentRecord] = useState<any>(null)
    const [grades,setGrades] = useState<any[]>([])
    const [gpa,setGpa] = useState(0)

    // Trigger search on manual search
    useEffect(() => {
        if (!code) { setLoad(false); return }
        const getData = async ()=> {
            setLoad(true)
            const { data:theData, error } = await supabase
                .from('student')
                .select('id,last_name,first_name,student_code,faculty,email')
                .eq('student_code', code)
            if (error || !theData?.length) { setLoad(false); return }
            setUser(theData)

            const studentId = theData[0]?.id
            const faculty = theData[0]?.faculty

            const [programRes, statusRes, paymentRes, gradeRes] = await Promise.all([
                supabase.from('course_program').select('*').eq('faculty', faculty),
                supabase.from('student_status').select('id,student_id,year_study').eq('student_id', studentId),
                supabase.from('student_payment').select('*').eq('student_id', studentId).maybeSingle(),
                supabase.from('exam').select('*').eq('student_id', studentId),
            ])

            if (programRes.data) setProgram(programRes.data)
            if (statusRes.data) setStatus(statusRes.data)
            if (paymentRes.data) setPaymentRecord(paymentRes.data)
            if (gradeRes.data) {
                setGrades(gradeRes.data)
                const entries: GradeEntry[] = gradeRes.data.map((g: any) => {
                    const score = g.reprise ?? g.final ?? 0
                    const course = programRes.data?.find((p: any) => p.course_name === g.matière)
                    return { score: Number(score), credits: Number(course?.credits) || 3 }
                })
                setGpa(calculateGPA(entries))
            }

            setResult(true)
            setLoad(false)
        }
        getData()
    }, [sendCode])

    const totalPaid = paymentRecord ? (Number(paymentRecord.price || paymentRecord.amount || 0) - Number(paymentRecord.discount || 0) - Number(paymentRecord.balance || 0)) : 0
    const paymentCount = paymentRecord?.payment_history?.length || 0

    const handleDownloadTranscript = () => {
        if (!userX[0]?.id) return
        window.open(`/api/pdf/transcript?student_id=${userX[0].id}`, '_blank')
    }

    return(
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Recherche Étudiant</h1>
                    <p className="text-gray-600">Consultez les résultats et informations académiques</p>
                </div>

                {/* Search Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex gap-4 items-end flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Code Étudiant</label>
                            <input 
                                type="text" 
                                value={code}
                                onChange={(e)=>setCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && setsenCode(!sendCode)}
                                placeholder="Entrez le code (ex: STU001)"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition text-base"
                            />
                        </div>
                        <button 
                            onClick={()=>setsenCode(!sendCode)} 
                            className="bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.5 5.5a7.5 7.5 0 0 0 10.5 10.5Z" />
                            </svg>
                            Rechercher
                        </button>
                    </div>
                </div>

                {/* Content Section */}
                {load ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600">Chargement des informations...</p>
                    </div>
                ) : result ? (
                    <div className="space-y-6">
                        {/* Student Info Header */}
                        <div className="bg-linear-to-r from-blue-600 to-blue-500 rounded-2xl shadow-xl p-6 md:p-8 text-white">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold mb-2">{userX[0]?.last_name} {userX[0]?.first_name}</h2>
                                    <p className="text-blue-100 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                        </svg>
                                        Faculté: <span className="font-semibold">{userX[0]?.faculty}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-blue-100 text-sm mb-1">Code Étudiant</p>
                                    <p className="text-xl md:text-2xl font-bold">{userX[0]?.student_code}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
                                <div className="text-sm text-gray-500 font-semibold mb-2">GPA</div>
                                <div className="text-3xl font-bold text-blue-600">{gpa.toFixed(2)}</div>
                                <div className="text-xs text-gray-400 mt-2">
                                    {gpa >= 3.5 ? 'Excellent' : gpa >= 2.5 ? 'Bien' : gpa >= 1.5 ? 'Passable' : 'À améliorer'}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
                                <div className="text-sm text-gray-500 font-semibold mb-2">Année d&apos;Étude</div>
                                <div className="flex items-center gap-2">
                                    <Filter2 id={userX[0]?.id} bool/>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
                                <div className="text-sm text-gray-500 font-semibold mb-2">Total Payé</div>
                                <div className="text-2xl font-bold text-green-600">{totalPaid.toLocaleString()} HTG</div>
                                <div className="text-xs text-gray-400 mt-2">{paymentCount} paiement(s)</div>
                                {paymentRecord?.balance > 0 && (
                                    <div className="text-xs text-orange-500 mt-1">Solde: {Number(paymentRecord.balance).toLocaleString()} HTG</div>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
                                <div className="text-sm text-gray-500 font-semibold mb-2">Matières</div>
                                <div className="text-2xl font-bold text-purple-600">{grades.length}</div>
                                <div className="text-xs text-gray-400 mt-2">
                                    {grades.filter(g => (g.reprise ?? g.final ?? 0) >= 50).length} réussie(s)
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Consultez les Résultats</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                <button 
                                    onClick={()=>{setSession(!session); if(session2) setSession2(false)}} 
                                    className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                                        session 
                                            ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                    </svg>
                                    Semestre 1
                                </button>

                                <button 
                                    onClick={()=>{setSession2(!session2); if(session) setSession(false)}}
                                    className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                                        session2
                                            ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                    </svg>
                                    Semestre 2
                                </button>

                                <button 
                                    onClick={()=>{setMat(!mat)}} 
                                    className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                                        mat 
                                            ? 'bg-linear-to-r from-purple-600 to-purple-500 text-white shadow-lg' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                    </svg>
                                    Matières
                                </button>

                                <button 
                                    onClick={() => setShowProgram(!showProgram)}
                                    className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                                        showProgram 
                                            ? 'bg-linear-to-r from-indigo-600 to-indigo-500 text-white shadow-lg' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.251 2.251 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                                    </svg>
                                    Programme
                                </button>

                                <button 
                                    onClick={() => setShowPayments(!showPayments)}
                                    className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                                        showPayments
                                            ? 'bg-linear-to-r from-green-600 to-green-500 text-white shadow-lg' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                                    </svg>
                                    Paiements
                                </button>

                                <button 
                                    onClick={() => setShowDates(!showDates)}
                                    className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                                        showDates
                                            ? 'bg-linear-to-r from-orange-600 to-orange-500 text-white shadow-lg' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                    Dates
                                </button>

                                <button 
                                    onClick={handleDownloadTranscript}
                                    className="py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm bg-linear-to-r from-green-600 to-green-500 text-white shadow-lg hover:from-green-700 hover:to-green-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    Relevé
                                </button>
                            </div>
                        </div>

                        {/* Session 1 Results */}
                        {session && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-blue-600 rounded"></span>
                                    Résultats - Semestre 1
                                </h3>
                                <div className="space-y-4">
                                    {status.length > 0 ? (
                                        status.map((stat: any) => (
                                            <div key={stat.id} className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-100">
                                                <Readsession year={stat.year_study} session={1} id={stat.student_id} matiere={''} faculty={userX[0]?.faculty} name=""/>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>Aucune donnée disponible</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Session 2 Results */}
                        {session2 && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-blue-600 rounded"></span>
                                    Résultats - Semestre 2
                                </h3>
                                <div className="space-y-4">
                                    {status.length > 0 ? (
                                        status.map((stat: any) => (
                                            <div key={stat.id} className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-100">
                                                <Readsession year={stat.year_study} session={2} id={stat.student_id} matiere={''} faculty={userX[0]?.faculty} name=""/>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>Aucune donnée disponible</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Materials List */}
                        {mat && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-purple-600 rounded"></span>
                                    Matières
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {program.map((prog: any) => (
                                        <div key={prog.id} className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-100 hover:shadow-md transition-shadow">
                                            <h4 className="font-bold text-gray-900 mb-2">{prog.courses || prog.course_name || 'Matière'}</h4>
                                            <p className="text-sm text-gray-600 mb-1">{prog.credit || prog.credits || '3'} crédits</p>
                                            <p className="text-xs text-gray-500">Session {prog.session}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Program by Semester */}
                        {showProgram && <ProgramSection program={program} />}

                        {/* Payment History */}
                        {showPayments && <PaymentSection paymentRecord={paymentRecord} />}

                        {/* Important Dates */}
                        {showDates && <ImportantDatesSection />}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mx-auto mb-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.5 5.5a7.5 7.5 0 0 0 10.5 10.5Z" />
                        </svg>
                        <p className="text-lg text-gray-600 font-medium">Saisissez un code étudiant pour consulter les résultats</p>
                        <p className="text-gray-500 mt-2">Utilisez la barre de recherche ci-dessus</p>
                    </div>
                )}
            </div>
        </div>
    )
}