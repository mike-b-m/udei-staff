'use client'
import { supabase } from "@/app/component/db";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import TheacherInput, { ReadNote, Readsession, TeacherSession, TheacherInput2 } from "@/app/component/teacher/teacher";

interface FormRow {
  courses: string
  credit: string
  session_subjet: string
  hour_session: string
  total_hour: string
  pass_grade: number
}

export default function Teacher() {
    const [exam, setExam] = useState<any[]>([])
    const [note, setNote] = useState<any[]>([])
    const [program, setProgram] = useState<FormRow[]>([])
    const [faculty, setFaculty] = useState('')
    const [intra, setIntra] = useState(false)
    const [read, setRead] = useState(false)
    const [sessionTab, setSessionTab] = useState(true)
    const [loading, setLoading] = useState(false)

    const [student, setStudent] = useState<any[]>([])
    const [fullname, setFullname] = useState<any[]>([])
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [modalLoading, setModalLoading] = useState(false)
    const [facultyFilter, setFacultyFilter] = useState('')
    const [yearFilter, setYearFilter] = useState('')
    const [sessionFilter, setSessionFilter] = useState('')
    
    const searchpara = useSearchParams()
    const search = searchpara.get('faculty') || ''
    const search3 = searchpara.get('year') || ''
    const search4 = searchpara.get('session') || ''

    useEffect(() => {
        const getData = async () => {
            setLoading(true);
            try {
                // Validate required filters
                // if (!search || !search3 || !search4) {
                //     setStudent([]);
                //     setFullname([]);
                //     setProgram([]);
                //     setLoading(false);
                //     return;
                // }

                // Get courses
                const { data: pro, error: theError } = await supabase
                    .from('course_program')
                    .select('*')
                    .eq('faculty', facultyFilter || search)
                    .eq('session', sessionFilter || search4)
                    .eq('year', yearFilter || search3);

                if (theError) {
                    console.error('Error fetching courses:', theError.message);
                }

                // Get students with student info joined
                const { data: stud, error: second } = await supabase.from('student_status')
                    .select('id,student_id,year_study,academic_year,student(id,last_name,first_name,student_code,faculty)')
                    .eq('year_study', yearFilter || search3)
                    .eq('faculty', facultyFilter || search)
                    .order('student(last_name)', { ascending: true });

                if (second) {
                    console.error('Error fetching students:', second.message);
                } else if (stud && stud.length > 0) {
                    // Extract student data from joined relationship
                    const studentList = stud.reduce((acc, s) => {
                        try {
                            if (s && s.student) {
                                const student = s.student as Record<string, any>;
                                if (student.id) {
                                    acc.push({
                                        id: student.id,
                                        last_name: student.last_name || '',
                                        first_name: student.first_name || '',
                                        student_code: student.student_code || '',
                                        faculty: student.faculty || ''
                                    });
                                }
                            }
                        } catch (e) {
                            console.error('Error processing student:', e);
                        }
                        return acc;
                    }, [] as Array<{ id: string; last_name: string; first_name: string; student_code: string; faculty: string }>);
                    
                    setFullname(studentList);
                    setStudent(stud);
                } else {
                    console.warn('No students found for the selected criteria');
                    setFullname([]);
                    setStudent([]);
                }

                // Get exams
                const { data: exa, error: third } = await supabase.from('exam')
                    .select('*');

                if (third) {
                    console.error('Error fetching exams:', third.message);
                } else if (exa && exa.length > 0) {
                    setExam(exa);
                    setNote(exa[1]?.intra || []);
                } else {
                    setExam([]);
                    setNote([]);
                }

                if (pro && pro.length > 0) {
                    setProgram(pro);
                } else {
                    setProgram([]);
                }
            } catch (error: any) {
                console.error('Unexpected error:', error);
            } finally {
                setLoading(false);
            }
        };
        getData()
    }, [facultyFilter, yearFilter, sessionFilter]);

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
                                {program && program.length > 0 ? (
                                    program.map((pro) => (
                                        <option key={pro.courses}>{pro.courses}</option>
                                    ))
                                ) : (
                                    <option disabled>aucune matière disponible</option>
                                )}
                            </select>
                        </div>

                        {/* Faculty Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Faculté</label>
                            <select
                                name="faculty"
                                value={facultyFilter}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            onChange={(e)=>setFacultyFilter(e.target.value)}>
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
                                    value={yearFilter}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                onChange={(e)=>setYearFilter(e.target.value)}>
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
                                    value={sessionFilter}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                onChange={(e)=>setSessionFilter(e.target.value)}>
                                <option value="">Sélectionner une session</option>
                                <option>1</option>
                                <option>2</option>
                            </select>
                        </div>

                        {/* Filter Button */}
                        {/* <div className="flex items-end">
                            <button disabled
                                type="submit"
                                className="w-full px-6 py-2 bg-linear-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition shadow-md"
                            >
                                Filtrer
                            </button>
                        </div> */}
                    </form>

                    {/* Active Filters Display */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {search || facultyFilter ? (
                            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                Faculté: {search || facultyFilter}
                            </div>
                        ) : null}
                        {search3 || yearFilter ? (
                            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                Niveau: {search3 || yearFilter}
                            </div>
                        ) : null}
                        {search4 || sessionFilter ? (
                            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                Session: {search4 || sessionFilter}
                            </div>
                        ) : null}
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
                                    ) : fullname && fullname.length > 0 ? (
                                        <div className="space-y-2">
                                            {/* Header */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg font-semibold text-gray-700">
                                                <div>Nom et Prénom</div>
                                                <div className="text-center">Note Intra</div>
                                                <div className="text-center">Note Finale</div>
                                                <div className="text-center">Action</div>
                                            </div>
                                            {/* Student Rows */}
                                            {fullname.map((studentInfo: any, index) => {
                                                const studentStatus = student.find(s => s.student_id === studentInfo.id);
                                                return (
                                                    <div key={studentInfo.id} className={`p-4 rounded-lg ${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'} border border-gray-100`}>
                                                        <TheacherInput2
                                                            faculty={search}
                                                            session={search4}
                                                            year={search3}
                                                            name={`${studentInfo.last_name} ${studentInfo.first_name}`}
                                                            matiere={faculty}
                                                            id={studentInfo.id}
                                                        />
                                                    </div>
                                                );
                                            })}
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
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-linear-to-r from-emerald-600 to-emerald-500 text-white p-4">
                                    <h3 className="text-lg font-semibold">Consultation des Notes</h3>
                                </div>
                                <div className="p-6">
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">Chargement...</p>
                                        </div>
                                    ) : fullname && fullname.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg font-semibold text-gray-700 mb-2 sticky top-0 z-10">
                                                <div className="text-left">Nom et Prénom</div>
                                                <div className="text-right">Action</div>
                                            </div>

                                            {/* Table Rows */}
                                            <div className="space-y-2">
                                                {fullname.map((studentInfo, index) => {
                                                    const studentStatus = student.find(s => s.student_id === studentInfo.id);
                                                    return (
                                                        <div
                                                            key={studentInfo.id}
                                                            className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg items-center transition-all duration-300 ${
                                                                index % 2 === 0 ? 'bg-emerald-50' : 'bg-white'
                                                            } border border-gray-100 hover:border-emerald-300 hover:shadow-md`}
                                                        >
                                                            <div className="text-gray-800 font-medium">
                                                                {studentInfo.last_name} {studentInfo.first_name}
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 md:justify-end">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedStudent({
                                                                            student_id: studentInfo.id,
                                                                            full_name: `${studentInfo.last_name} ${studentInfo.first_name}`,
                                                                            ...studentStatus
                                                                        });
                                                                        setModalOpen(true);
                                                                    }}
                                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm whitespace-nowrap"
                                                                >
                                                                    Voir note année {search3} -session{search4}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                            <p className="text-lg">Aucun étudiant trouvé avec les critères sélectionnés</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Modal - Notes Popup */}
                        {modalOpen && selectedStudent && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                                    {/* Modal Header */}
                                    <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-linear-to-r from-emerald-600 to-emerald-500 text-white">
                                        <div>
                                            <h3 className="text-xl font-bold">
                                                {selectedStudent.full_name || 'Étudiant'}
                                            </h3>
                                            <p className="text-emerald-100 text-sm mt-1">Année {search3} - Session {search4}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setModalOpen(false);
                                                setSelectedStudent(null);
                                            }}
                                            className="p-2 hover:bg-emerald-700 rounded-lg transition"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Modal Content */}
                                    <div className="flex-1 overflow-y-auto p-6">
                                        {modalLoading ? (
                                            <div className="space-y-4 animate-pulse">
                                                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                                <div className="h-32 bg-gray-200 rounded"></div>
                                            </div>
                                        ) : selectedStudent.student_id ? (
                                            <Readsession
                                                faculty={search || facultyFilter}
                                                session={search4 || sessionFilter}
                                                year={search3 || yearFilter}
                                                id={selectedStudent.student_id}
                                                name={selectedStudent.full_name}
                                                matiere={faculty}
                                            />
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <p>Erreur: Impossible de charger les notes</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                                        <button
                                            onClick={() => {
                                                setModalOpen(false);
                                                setSelectedStudent(null);
                                            }}
                                            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium"
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                </div>
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
                                                        faculty={search || facultyFilter}
                                                        session={search4 || sessionFilter}
                                                        year={search3 || yearFilter}
                                                        name={[exa.academic_year, program.filter((p) => p.courses === faculty).map((p) => p.pass_grade)]}
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