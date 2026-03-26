'use client'
import { supabase } from "@/app/component/db";
import { useState, useEffect } from "react";
import { Filter2 } from "@/app/component/filter/filter";
import {  ReadNote } from "@/app/component/teacher/teacher";
import Input from "../component/input/input-comp";

export default function Student_dashboard(){
    const [userX,setUser] =useState<any[]>([])
    const [status,setStatus] = useState<any[]>([])
    const [session,setSession] = useState(false)
    const [mat,setMat] = useState(false)
    const [code,setCode] = useState('')
    const [sendCode,setsenCode] = useState(false)
    const [load,setLoad] = useState(false)
    const [result,setResult] = useState(false)
    const [program,setProgram] = useState<any[]>([])

     useEffect(() => {
        const getData = async ()=> {
            setLoad(true)
            const { data:theData, error } = await supabase
  .from('student')
  .select('id,last_name,first_name,student_code,faculty')
  .eq('student_code', code)
        if (error) console.error(error.message)
        else {
    setUser(theData)
    const { data, error } = await supabase
  .from('course_program')
  .select('*').eq('faculty',theData[0]?.faculty)
        if (error) console.error(error.message)
        else setProgram(data)
    const { data:dat, error:Err } = await supabase
  .from('student_status')
  .select('id,student_id,year_study')
  .eq('student_id', theData[0]?.id || null)
        if (Err) console.error(Err.message)
        else {
    setStatus(dat)
    setResult(true)}
        setLoad(false)}
   
        };
    getData()},[sendCode])
    return(
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-100 p-6">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Tableau de Bord Étudiant</h1>
                    <p className="text-gray-600">Consultez vos informations académiques et votre planning</p>
                </div>

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
                            {userX.map((use:any) => (
                                <div key={use.id} className="space-y-4">
                                    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                                        <div className="text-sm text-gray-500 font-semibold mb-2">Moyenne</div>
                                        <div className="text-3xl font-bold text-blue-600">A</div>
                                        <div className="text-xs text-gray-400 mt-2">Très bien</div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                                        <div className="text-sm text-gray-500 font-semibold mb-2">Année d'Étude</div>
                                        <div className="flex items-center gap-2">
                                            <Filter2 id={use.id} bool/>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                                        <div className="text-sm text-gray-500 font-semibold mb-2">Solde</div>
                                        <div className="text-2xl font-bold text-green-600">$0</div>
                                        <div className="text-xs text-gray-400 mt-2">À jour</div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                                        <div className="text-sm text-gray-500 font-semibold mb-2">Date Examen</div>
                                        <div className="text-lg font-bold text-gray-800">2/10/20XX</div>
                                        <div className="text-xs text-gray-400 mt-2">À confirmer</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Consultez vos Résultats</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <button 
                                    onClick={()=>{setSession(!session)}} 
                                    className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
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
                                    className="py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                    </svg>
                                    Semestre 2
                                </button>

                                <button 
                                    onClick={()=>{setMat(!mat)}} 
                                    className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                                        mat 
                                            ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41.75.75 0 1 1 .494 1.425 50.123 50.123 0 0 0-8.514 4.462c-.068.06-.136.12-.203.182a48.997 48.997 0 0 1-7.707-7.707.75.75 0 0 1 .896-1.159zm19.474-6.423c.78.797 1.26 1.887 1.26 3.077 0 2.871-2.612 5.190-5.824 5.190-.842 0-1.659-.257-2.324-.743l-.841 3.059.02-.02a48.039 48.039 0 0 1-7.773 3.276c-2.896.168-4.979-1.630-5.191-4.576-.04-.559-.031-1.126.061-1.682 0-.855.07-1.679.194-2.476a.75.75 0 0 1 1.439-.54c.166.682.292 1.359.315 2.066a46.591 46.591 0 0 0-.52 3.95c-.518 4.02 3.271 7.286 8.577 5.33a50.115 50.115 0 0 0 5.9-2.5.75.75 0 0 1 .898 1.128 51.69 51.69 0 0 1-6.06 2.619c-2.29.878-4.576 1.106-6.815.892-2.238-.214-4.268-1.17-5.657-2.653l-.181-.182a.75.75 0 1 1 1.06-1.061l.182.181c1.08 1.079 2.74 1.927 4.677 2.105 1.938.177 3.873-.003 5.82-.753.504-.193.984-.435 1.436-.722l.841-3.058a6.694 6.694 0 0 1-2.324.743c-3.212 0-5.824-2.319-5.824-5.19 0-1.19.48-2.28 1.26-3.077.768-.778 1.801-1.30 2.995-1.30 1.194 0 2.227.522 2.995 1.3.78.797 1.26 1.887 1.26 3.077 0 1.19-.48 2.28-1.26 3.077a4.001 4.001 0 0 1-2.995 1.3c-.483 0-.945-.088-1.382-.26l-.841 3.059a6.657 6.657 0 0 0 2.223.26c3.212 0 5.824-2.319 5.824-5.19 0-1.19-.48-2.28-1.26-3.077-.768-.778-1.801-1.30-2.995-1.30z" />
                                    </svg>
                                    Matières
                                </button>

                                <button 
                                    className="py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                    Horaire
                                </button>
                            </div>
                        </div>

                        {/* Session 1 Results */}
                        {session && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-blue-600 rounded"></span>
                                    Résultats - Semestre {session ? '1' : '2'}
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
                                            <h4 className="font-bold text-gray-900 mb-2">{prog.course_name || 'Matière'}</h4>
                                            <p className="text-sm text-gray-600 mb-3">{prog.credits || '3'} crédits</p>
                                            <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1">
                                                Voir détails
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
            </div>
        </div>
    )
}