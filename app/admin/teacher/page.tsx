'use client'
import { supabase } from "@/app/component/db";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import TheacherInput, { ReadNote, Readsession, TeacherSession, TheacherInput2 } from "@/app/component/teacher/teacher";

export default function Teacher() {
    const [exam, setExam] = useState<any[]>([])
    const [note, setNote] = useState<any[]>([])
    const [program, setProgram] = useState<any[]>([])
    const [faculty, setFaculty] = useState('')
    const [intra, setIntra] = useState(true)
    const [read, setRead] = useState(false)
    const [sessionTab, setSessionTab] = useState(false)
    const [loading, setLoading] = useState(false)

    const [student, setStudent] = useState<any[]>([])
    const searchpara = useSearchParams()
    const search = searchpara.get('faculty') || ''
    const search3 = searchpara.get('year') || ''
    const search4 = searchpara.get('session') || ''

    useEffect(() => {
        const getData = async () => {
            setLoading(true);
            try {
                // Get courses
                const { data: pro, error: theError } = await supabase
                    .from('course_program')
                    .select('*').eq('faculty', search).eq('session', search4).eq('year', search3);

                // Get students
                const { data: stud, error: second } = await supabase.from('student_status')
                    .select('id,student_id,year_study')
                    .eq('year_study', search3);

                // Get exams
                const { data: exa, error: third } = await supabase.from('exam')
                    .select('*');

                if (third) console.error(third.message)
                else {
                    setExam(exa)
                    setNote(exa[1]?.intra)
                }

                if (second) console.error(second.message)
                else setStudent(stud)

                if (theError) console.error(theError.message)
                else setProgram(pro)
            } finally {
                setLoading(false);
            }
        };
        getData()
    }, [search, search3, search4])

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestion des Notes</h1>
                    <p className="text-gray-600">Ajoutez, consultez et gérez les notes des étudiants</p>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Filtres</h2>
                    <form action='/admin/teacher' className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Matière Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Matière</label>
                            <select
                                name="matiere"
                                onChange={(e) => setFaculty(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            >
                                <option value="">Sélectionner une matière</option>
                                {program.map((pro) => (
                                    <option key={pro.courses}>{pro.courses}</option>
                                ))}
                            </select>
                        </div>

                        {/* Faculty Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Faculté</label>
                            <select
                                name="faculty"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            >
                                <option value="">Sélectionner une faculté</option>
                                <option>Génie Civil</option>
                                <option>Médecine Générale</option>
                                <option>Odontologie</option>
                                <option>Sciences Infirmières</option>
                                <option>Sciences Administratives</option>
                                <option>Sciences Comptables</option>
                                <option>Science Informatique</option>
                                <option>Gestion Des Affaires</option>
                                <option>Sciences Agronomiques</option>
                                <option>Sciences Economiques</option>
                                <option>Sciences De L'Education</option>
                                <option>Sciences Juridiques</option>
                                <option>Pharmacologies</option>
                                <option>Médecine Vétérinaire</option>
                                <option>Laboratoire Médicale</option>
                                <option>Physiothérapie</option>
                                <option>Jardinières D'enfants</option>
                            </select>
                        </div>

                        {/* Year/Level Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
                            <select
                                name="year"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            >
                                <option value="">Sélectionner un niveau</option>
                                <option>1</option>
                                <option>2</option>
                                <option>3</option>
                                <option>4</option>
                                <option>5</option>
                                <option>6</option>
                            </select>
                        </div>

                        {/* Session Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
                            <select
                                name="session"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            >
                                <option value="">Sélectionner une session</option>
                                <option>1</option>
                                <option>2</option>
                            </select>
                        </div>

                        {/* Filter Button */}
                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="w-full px-6 py-2 bg-linear-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition shadow-md"
                            >
                                Filtrer
                            </button>
                        </div>
                    </form>

                    {/* Active Filters Display */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {search && (
                            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                Faculté: {search}
                            </div>
                        )}
                        {search3 && (
                            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                Niveau: {search3}
                            </div>
                        )}
                        {search4 && (
                            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                Session: {search4}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-2xl p-2 mb-6 shadow-sm border border-gray-100 flex flex-wrap gap-2">
                    <button
                        onClick={() => { setIntra(true); setRead(false); setSessionTab(false); }}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${intra && !read && !sessionTab
                            ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Note Intra
                    </button>
                    <button
                        onClick={() => { setIntra(false); setRead(false); setSessionTab(false); }}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${!intra && !read && !sessionTab
                            ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Note Finale
                    </button>
                    <button
                        onClick={() => { setSessionTab(true); setIntra(false); setRead(false); }}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${sessionTab
                            ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Session
                    </button>
                    <button
                        onClick={() => { setRead(true); setIntra(false); setSessionTab(false); }}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${read
                            ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Consultation
                    </button>
                </div>

                {/* Matière Selection Warning */}
                {!faculty ? (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-6 text-center">
                        <p className="text-amber-900 font-semibold">
                            ⚠️ Veuillez sélectionner une matière dans la section filtre pour continuer
                        </p>
                    </div>
                ) : (
                    <div className="text-center mb-4 text-gray-600">
                        Matière sélectionnée: <span className="font-bold text-blue-600">{faculty}</span>
                    </div>
                )}

                {/* Content Sections */}
                {faculty && (
                    <div>
                        {/* Intra Notes Section */}
                        {intra && !sessionTab && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-linear-to-r from-blue-600 to-blue-500 text-white p-4">
                                    <h3 className="text-lg font-semibold">Saisie des Notes Intra</h3>
                                </div>
                                <div className="p-6">
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">Chargement...</p>
                                        </div>
                                    ) : student.length > 0 ? (
                                        <div className="space-y-2">
                                            {/* Header */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg font-semibold text-gray-700">
                                                <div>Nom et Prénom</div>
                                                <div className="text-center">Note</div>
                                                <div className="text-center">Action</div>
                                            </div>
                                            {/* Student Rows */}
                                            {student.map((exa: any, index) => (
                                                <div key={exa.id} className={`p-4 rounded-lg ${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'} border border-gray-100`}>
                                                    <TheacherInput
                                                        faculty={search}
                                                        session={search4}
                                                        year={search3}
                                                        name={''}
                                                        matiere={faculty}
                                                        id={exa.student_id}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            Aucun étudiant trouvé avec les critères sélectionnés
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Final Notes Section */}
                        {!intra && !read && !sessionTab && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-linear-to-r from-blue-600 to-blue-500 text-white p-4">
                                    <h3 className="text-lg font-semibold">Saisie des Notes Finales</h3>
                                </div>
                                <div className="p-6">
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">Chargement...</p>
                                        </div>
                                    ) : student.length > 0 ? (
                                        <div className="space-y-2">
                                            {/* Header */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg font-semibold text-gray-700">
                                                <div>Nom et Prénom</div>
                                                <div className="text-center">Note Intra</div>
                                                <div className="text-center">Note Finale</div>
                                                <div className="text-center">Action</div>
                                            </div>
                                            {/* Student Rows */}
                                            {student.map((exa: any, index) => (
                                                <div key={exa.id} className={`p-4 rounded-lg ${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'} border border-gray-100`}>
                                                    <TheacherInput2
                                                        faculty=""
                                                        session={search4}
                                                        year={search3}
                                                        name={`${exa.last_name} ${exa.first_name}`}
                                                        matiere={faculty}
                                                        id={exa.student_id}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            Aucun étudiant trouvé avec les critères sélectionnés
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Read/Consultation Section */}
                        {read && (
                            <div>
                                {loading ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>Chargement...</p>
                                    </div>
                                ) : student.length > 0 ? (
                                    <div className="space-y-6">
                                        {student.map((stud) => (
                                           <div key={stud.id}>
                                            <ReadNote
                                                faculty=""
                                                session={search4}
                                                year={search3}
                                                id={stud.student_id}
                                                name=""
                                                matiere=''
                                            />
                                            <Readsession
                                                faculty=""
                                                session={search4}
                                                year={search3}
                                                id={stud.student_id}
                                                name=""
                                                matiere=''
                                            />
                                           </div>

                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
                                        Aucun étudiant trouvé avec les critères sélectionnés
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Session Notes Section */}
                        {sessionTab && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-linear-to-r from-purple-600 to-purple-500 text-white p-4">
                                    <h3 className="text-lg font-semibold">Saisie des Notes de Session</h3>
                                    <p className="text-sm text-purple-100 mt-1">Notes enregistrées dans la table exam_1</p>
                                </div>
                                <div className="p-6">
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">Chargement...</p>
                                        </div>
                                    ) : student.length > 0 ? (
                                        <div className="space-y-2">
                                            {/* Header */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg font-semibold text-gray-700">
                                                <div>Nom et Prénom</div>
                                                <div className="text-center">Note</div>
                                                <div className="text-center">Action</div>
                                            </div>
                                            {/* Student Rows */}
                                            {student.map((exa: any, index) => (
                                                <div key={exa.id} className={`p-4 rounded-lg ${index % 2 === 0 ? 'bg-purple-50' : 'bg-white'} border border-gray-100`}>
                                                    <TeacherSession
                                                        faculty={search}
                                                        session={search4}
                                                        year={search3}
                                                        name={''}
                                                        matiere={faculty}
                                                        id={exa.student_id}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            Aucun étudiant trouvé avec les critères sélectionnés
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}