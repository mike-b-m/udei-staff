'use client'
import { supabase } from "@/app/component/db";
import { useState, useEffect } from "react";
import { Filter2 } from "@/app/component/filter/filter";
import { ReadNote } from "@/app/component/teacher/teacher";
import { getGradeInfo, calculateGPA, type GradeEntry } from "@/app/lib/gpa";
import { FACULTIES } from "@/app/component/student-infos/constants";

// ============ Account Creation Form ============
function StudentAccountForm({ email, onCreated }: { email: string; onCreated: () => void }) {
    const [form, setForm] = useState({
        first_name: '', last_name: '', faculty: '',
        date_birth: '', place_of_birth: '', sex: 'M',
        phone_number: '', nif_cin: '', marital_status: 'Célibataire',
        adress: '', diploma: '',
        mother_name: '', mother_phone: '', mother_profesion: '',
        father_name: '', father_phone: '', father_profesion: '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [step, setStep] = useState(1)

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async () => {
        if (!form.first_name || !form.last_name || !form.faculty) {
            setError('Veuillez remplir les champs obligatoires (Nom, Prénom, Faculté)')
            return
        }
        setSaving(true)
        setError('')
        try {
            // Generate student code
            const year = new Date().getFullYear().toString().slice(-2)
            const prefix = form.faculty.slice(0, 3).toUpperCase()
            const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
            const student_code = `${prefix}-${year}-${rand}`

            const { error: insertError } = await supabase.from('student').insert({
                ...form,
                email,
                student_code,
                enroll_date: new Date().toISOString().slice(0, 10),
                academy: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
            })
            if (insertError) throw insertError

            // Create student_status record
            await supabase.from('student_status').insert({
                student_id: (await supabase.from('student').select('id').eq('email', email).single()).data?.id,
                year_study: 1,
                enroll_year: new Date().toISOString().slice(0, 10),
                academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
                faculty: form.faculty
            })

            onCreated()
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la création')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Formulaire d&apos;Inscription</h2>
                    <p className="text-gray-600 mt-1">Complétez votre profil étudiant pour accéder à la plateforme</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex items-center gap-2">
                            <button onClick={() => setStep(s)} className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${step === s ? 'bg-blue-600 text-white shadow-lg' : step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {step > s ? '✓' : s}
                            </button>
                            {s < 3 && <div className={`w-12 h-1 rounded ${step > s ? 'bg-green-400' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

                {/* Step 1: Personal Info */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations Personnelles</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                <input type="text" value={form.last_name} onChange={e => handleChange('last_name', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="Votre nom" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                <input type="text" value={form.first_name} onChange={e => handleChange('first_name', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="Votre prénom" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Faculté *</label>
                                <select value={form.faculty} onChange={e => handleChange('faculty', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                    <option value="">-- Sélectionner --</option>
                                    {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de Naissance</label>
                                <input type="date" value={form.date_birth} onChange={e => handleChange('date_birth', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de Naissance</label>
                                <input type="text" value={form.place_of_birth} onChange={e => handleChange('place_of_birth', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="Lieu de naissance" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                                <select value={form.sex} onChange={e => handleChange('sex', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                    <option value="M">Masculin</option>
                                    <option value="F">Féminin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input type="tel" value={form.phone_number} onChange={e => handleChange('phone_number', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="Votre numéro" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NIF/CIN</label>
                                <input type="text" value={form.nif_cin} onChange={e => handleChange('nif_cin', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="Numéro NIF ou CIN" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">État Civil</label>
                                <select value={form.marital_status} onChange={e => handleChange('marital_status', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                    <option value="Célibataire">Célibataire</option>
                                    <option value="Marié(e)">Marié(e)</option>
                                    <option value="Divorcé(e)">Divorcé(e)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                <input type="text" value={form.adress} onChange={e => handleChange('adress', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="Adresse complète" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Diplôme Précédent</label>
                                <input type="text" value={form.diploma} onChange={e => handleChange('diploma', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="Dernier diplôme obtenu" />
                            </div>
                        </div>
                        <button onClick={() => setStep(2)} className="mt-4 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                            Suivant →
                        </button>
                    </div>
                )}

                {/* Step 2: Parents Info */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations des Parents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2"><h4 className="font-medium text-blue-600">Mère</h4></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la Mère</label>
                                <input type="text" value={form.mother_name} onChange={e => handleChange('mother_name', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone Mère</label>
                                <input type="tel" value={form.mother_phone} onChange={e => handleChange('mother_phone', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Profession Mère</label>
                                <input type="text" value={form.mother_profesion} onChange={e => handleChange('mother_profesion', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                            </div>
                            <div className="md:col-span-2"><h4 className="font-medium text-blue-600 mt-2">Père</h4></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Père</label>
                                <input type="text" value={form.father_name} onChange={e => handleChange('father_name', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone Père</label>
                                <input type="tel" value={form.father_phone} onChange={e => handleChange('father_phone', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Profession Père</label>
                                <input type="text" value={form.father_profesion} onChange={e => handleChange('father_profesion', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition">← Retour</button>
                            <button onClick={() => setStep(3)} className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">Suivant →</button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review & Submit */}
                {step === 3 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Vérification & Soumission</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                            <p><strong>Nom:</strong> {form.last_name} {form.first_name}</p>
                            <p><strong>Faculté:</strong> {form.faculty || 'Non sélectionnée'}</p>
                            <p><strong>Naissance:</strong> {form.date_birth || 'Non renseignée'} — {form.place_of_birth || ''}</p>
                            <p><strong>Téléphone:</strong> {form.phone_number || 'Non renseigné'}</p>
                            <p><strong>Email:</strong> {email}</p>
                            <p><strong>Diplôme:</strong> {form.diploma || 'Non renseigné'}</p>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setStep(2)} className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition">← Retour</button>
                            <button onClick={handleSubmit} disabled={saving}
                                className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                                {saving ? 'Enregistrement...' : 'Soumettre l\'inscription'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============ Payment History Section ============
function PaymentSection({ paymentRecord }: { paymentRecord: any }) {
    const history: any[] = paymentRecord?.payment_history || []
    const currentBalance = paymentRecord?.balance ?? 0
    const totalPrice = paymentRecord?.price ?? paymentRecord?.amount ?? 0
    const totalPaid = totalPrice - currentBalance

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-r from-green-600 to-emerald-500 p-6 text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                    </svg>
                    Historique des Paiements
                </h3>
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-white/15 rounded-lg p-3 text-center">
                        <p className="text-green-100 text-xs font-medium">Frais Total</p>
                        <p className="text-lg font-bold">{Number(totalPrice).toLocaleString()} HTG</p>
                    </div>
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

            {/* Progress Bar */}
            <div className="px-6 pt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progression</span>
                    <span>{totalPrice > 0 ? Math.round((totalPaid / totalPrice) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-linear-to-r from-green-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${totalPrice > 0 ? Math.min((totalPaid / totalPrice) * 100, 100) : 0}%` }} />
                </div>
            </div>

            {/* Payment History Table */}
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
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75" />
                        </svg>
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
    const [dat,setDat] = useState<any[]>([])
    //--fetch date
    useEffect(() => {
        const Load = async () => {
                const { data,error } = await supabase
                    .from('imp_date')
                    .select('*')
                    // .maybeSingle()
                if (error) {
                   console.log(error.message)
                } else {
                    setDat(data || [])
                }
            
        }
        Load()
    }, [])
    
    const dates = [
        { label: 'Début des cours', date: 'Octobre 2025', icon: '📚' },
        { label: 'Examens Intra', date: 'Décembre 2025', icon: '📝' },
        { label: 'Vacances de Noël', date: '21 Déc - 6 Jan', icon: '🎄' },
        { label: 'Examens Finaux Sem 1', date: 'Février 2026', icon: '📋' },
        { label: 'Début Semestre 2', date: 'Mars 2026', icon: '📚' },
        { label: 'Examens Finaux Sem 2', date: 'Juin 2026', icon: '📋' },
    ]
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-orange-500 rounded"></span>
                Dates Importantes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dat.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:bg-blue-50 transition">
                        <span className="text-2xl">{dates[i].icon}</span>
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

export default function Student_dashboard(){
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
    const [load,setLoad] = useState(true)
    const [result,setResult] = useState(false)
    const [noAccount, setNoAccount] = useState(false)
    const [authEmail, setAuthEmail] = useState('')
    const [program,setProgram] = useState<any[]>([])
    const [paymentRecord,setPaymentRecord] = useState<any>(null)
    const [grades,setGrades] = useState<any[]>([])
    const [gpa,setGpa] = useState(0)
    const [authLoaded,setAuthLoaded] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    // Auto-load by auth email on mount
    useEffect(() => {
        const autoLoad = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.email) {
                setAuthEmail(user.email)
                const { data } = await supabase
                    .from('student')
                    .select('student_code')
                    .eq('email', user.email)
                    .maybeSingle()
                if (data?.student_code) {
                    setCode(data.student_code)
                    setAuthLoaded(true)
                    setNoAccount(false)
                } else {
                    setNoAccount(true)
                    setLoad(false)
                }
            } else {
                setLoad(false)
            }
        }
        autoLoad()
    }, [refreshKey])

    // Trigger search when auth loads code or manual search
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
                // Calculate GPA
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
    }, [sendCode, authLoaded])

    const totalPaid = paymentRecord ? (Number(paymentRecord.price || paymentRecord.amount || 0) - Number(paymentRecord.balance || 0)) : 0
    const paymentCount = paymentRecord?.payment_history?.length || 0

    const handleDownloadTranscript = () => {
        if (!userX[0]?.id) return
        window.open(`/api/pdf/transcript?student_id=${userX[0].id}`, '_blank')
    }
    return(
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-100 p-6">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Tableau de Bord Étudiant</h1>
                    <p className="text-gray-600">Consultez vos informations académiques et votre planning</p>
                </div>

                {/* Show Account Creation Form if no student record */}
                {noAccount ? (
                    <StudentAccountForm email={authEmail} onCreated={() => setRefreshKey(k => k + 1)} />
                ) : (
                <>
                {/* Search Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex gap-4 items-end flex-wrap">
                        <div className="flex-1 min-w-xs">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Code Étudiant</label>
                            <input 
                                type="text" 
                                value={code}
                                onChange={(e)=>setCode(e.target.value)}
                                placeholder="Entrez votre code (ex: STU001)"
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
                        <div className="bg-linear-to-r from-blue-600 to-blue-500 rounded-2xl shadow-xl p-8 text-white">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold mb-2">{userX[0]?.last_name} {userX[0]?.first_name}</h2>
                                    <p className="text-blue-100 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3.042.525A9.006 9.006 0 0 0 3 9.694M12 6.042c1.052 0 2.062.18 3.042.525A9.006 9.006 0 0 1 21 9.694M12 6.042A8.968 8.968 0 0 1 18 3.75c1.052 0 2.062.18 3.042.525A9.006 9.006 0 0 1 21 9.694M9 19.5a9 9 0 1 1 12 0A9 9 0 0 1 9 19.5Z" />
                                        </svg>
                                        Faculté: <span className="font-semibold">{userX[0]?.faculty}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-blue-100 text-sm mb-1">Code Étudiant</p>
                                    <p className="text-2xl font-bold">{userX[0]?.student_code}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="text-sm text-gray-500 font-semibold mb-2">GPA</div>
                                <div className="text-3xl font-bold text-blue-600">{gpa.toFixed(2)}</div>
                                <div className="text-xs text-gray-400 mt-2">
                                    {gpa >= 3.5 ? 'Excellent' : gpa >= 2.5 ? 'Bien' : gpa >= 1.5 ? 'Passable' : 'À améliorer'}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="text-sm text-gray-500 font-semibold mb-2">Année d&apos;Étude</div>
                                <div className="flex items-center gap-2">
                                    <Filter2 id={userX[0]?.id} bool/>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="text-sm text-gray-500 font-semibold mb-2">Total Payé</div>
                                <div className="text-2xl font-bold text-green-600">{totalPaid.toLocaleString()} HTG</div>
                                <div className="text-xs text-gray-400 mt-2">{paymentCount} paiement(s)</div>
                                {paymentRecord?.balance > 0 && (
                                    <div className="text-xs text-orange-500 mt-1">Solde: {Number(paymentRecord.balance).toLocaleString()} HTG</div>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="text-sm text-gray-500 font-semibold mb-2">Matières</div>
                                <div className="text-2xl font-bold text-purple-600">{grades.length}</div>
                                <div className="text-xs text-gray-400 mt-2">
                                    {grades.filter(g => (g.reprise ?? g.final ?? 0) >= 50).length} réussie(s)
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Consultez vos Résultats</h3>
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
                                                <ReadNote year={stat.year_study} session={1} id={stat.student_id} matiere={''} faculty={userX[0]?.faculty} name=""/>
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
                                                <ReadNote year={stat.year_study} session={2} id={stat.student_id} matiere={''} faculty={userX[0]?.faculty} name=""/>
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
                                    <span className="w-1 h-6 bg-blue-600 rounded"></span>
                                    Vos Matières
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
                        <p className="text-lg text-gray-600 font-medium">Saisissez votre code étudiant dans la section de recherche</p>
                        <p className="text-gray-500 mt-2">pour consulter vos informations académiques.</p>
                    </div>
                )}
                </>
                )}
            </div>
        </div>
    )
}