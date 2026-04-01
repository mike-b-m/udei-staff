'use client'

import {supabase} from "@/app/component/db"
import { Suspense, useState, useEffect} from "react";
import Link from "next/link";
import {Filter2,Filter4} from "@/app/component/filter/filter";
import { Delete_button } from "@/app/component/add-buuton/add_button";
import {StudentInfos2} from "@/app/component/student-infos/studeninfos";
import Loading from "@/app/component/loading/loading";
import {Loading2} from "@/app/component/loading/loading";
import { exportToCSV, printHTML } from "@/app/component/export/exportUtils";
import { useFaculties } from "@/app/component/student-infos/useFaculties";

type student = {
    id: number
    first_name: string
    last_name: string
    faculty: string
    date_birth: string
    place_of_birth: string
    nif_cin: string
    sex: string
    email: string
    phone_number: string
    marital_status: string
    adress: string
    
    mother_name: string
    mother_birth:string
    mother_residence: string
    mother_phone: string
    mother_profesion: string

     father_name: string
    father_birth:string
    father_residence: string
    father_phone: string
    father_profesion: string

    diploma: string
    enrol_date: string
    seen_by: string
    academy: string
    student_code: string
    photo_url: string
}
const colors=[
  "bg-[#CAF0F8]/25 font-medium",
  "bg-[#90C3C8]/70 font-medium"
]
//export const dynamic = 'force-dynamic';

function Home() {
  const { facultyNames } = useFaculties()
  const [dat, setDat]= useState<student[]>([])
  const [filter, setFilter] = useState(false)
  const [faculty,setFaculty] = useState('')
  const [studyYear, setStudyYear] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [dateEnrollFrom, setDateEnrollFrom] = useState('')
  const [dateEnrollTo, setDateEnrollTo] = useState('')
  const [send,setSend] = useState(false)
  const [load,setLoad] = useState(false)
  const [open,setOpen] = useState(false)
  const search = null

  useEffect(() => {
    const getData = async () => {
    setLoad(true)
      let query = supabase.from('student').select('*')
        .order('last_name', { ascending: true })

      if (faculty) query = query.eq('faculty', faculty)
      if (dateEnrollFrom) query = query.gte('enroll_date', dateEnrollFrom)
      if (dateEnrollTo) query = query.lte('enroll_date', dateEnrollTo)

      const { data:comp, error } = await query
      if (error) console.error(error.message)
      else {
        let filtered = comp || []

        // If studyYear or academicYear are set, filter by student_status
        if (studyYear || academicYear) {
          let statusQuery = supabase.from('student_status').select('student_id,year_study,academic_year')
          if (studyYear) statusQuery = statusQuery.eq('year_study', parseInt(studyYear))
          if (academicYear) statusQuery = statusQuery.ilike('academic_year', `%${academicYear}%`)

          const { data: statusData } = await statusQuery
          if (statusData) {
            const matchingIds = new Set(statusData.map((s: any) => s.student_id))
            filtered = filtered.filter(s => matchingIds.has(s.id))
          }
        }

        setDat(filtered)
      }
    setLoad(false)
    }; 
    getData()},[send])
 
 
  return (
<>
<div className="w-full bg-linear-to-br from-gray-50 to-gray-100 min-h-screen p-4">
  {/* Header */}
  <div className="max-w-7xl mx-auto mb-6">
    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Gestion des Étudiants</h1>
    <p className="text-gray-600">Consultez et gérez tous les étudiants par faculté</p>
  </div>

  {/* Filter Section */}
  <div className="max-w-7xl mx-auto">
    {/*filter section */}
    <div className="mb-6 bg-white p-4 rounded-xl shadow-md">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
         onClick={()=>setFilter(!filter)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.485 0 2.709.033 3.654.135 2.426.314 3.97 1.857 4.284 4.283.102.945.135 1.169.135 3.654s-.033 2.709-.135 3.654c-.314 2.426-1.857 3.97-4.283 4.284-.945.102-1.169.135-3.654.135s-2.709-.033-3.654-.135c-2.426-.314-3.97-1.857-4.284-4.283-.102-.945-.135-1.169-.135-3.654s.033-2.709.135-3.654c.314-2.426 1.857-3.97 4.283-4.284C9.291 3.033 9.515 3 12 3Z" />
          </svg>
          Filtrer
          {filter ?  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
          </svg> :<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg> }
        </button>

        {/* Export Buttons */}
        {dat.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => {
              const headers = ['Nom', 'Prénom', 'Faculté', 'Code', 'Email', 'Téléphone', 'Date Inscription']
              const rows = dat.map(s => [s.last_name, s.first_name, s.faculty, s.student_code, s.email || '', s.phone_number || '', s.enrol_date || ''])
              exportToCSV(headers, rows, `etudiants_${faculty || 'tous'}_${new Date().toISOString().slice(0,10)}`)
            }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Excel/CSV
            </button>
            <button onClick={() => {
              const tableRows = dat.map((s, i) => `<tr class="${i % 2 === 0 ? '' : 'even'}"><td>${s.last_name}</td><td>${s.first_name}</td><td>${s.faculty}</td><td>${s.student_code}</td><td>${s.email || '-'}</td><td>${s.phone_number || '-'}</td><td>${s.enrol_date || '-'}</td></tr>`).join('')
              printHTML('Liste des Étudiants', `
                <h2>Liste des Étudiants${faculty ? ` — ${faculty}` : ''}</h2>
                <div class="info"><p>${dat.length} étudiant(s) trouvé(s)</p>${faculty ? `<p>Faculté: ${faculty}</p>` : ''}${studyYear ? `<p>Année d'étude: ${studyYear}</p>` : ''}${academicYear ? `<p>Année académique: ${academicYear}</p>` : ''}</div>
                <table><thead><tr><th>Nom</th><th>Prénom</th><th>Faculté</th><th>Code</th><th>Email</th><th>Téléphone</th><th>Date Inscription</th></tr></thead><tbody>${tableRows}</tbody></table>
              `)
            }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 7.088H5.25" />
              </svg>
              Imprimer
            </button>
            <button onClick={() => {
              const tableRows = dat.map((s, i) => `<tr class="${i % 2 === 0 ? '' : 'even'}"><td>${s.last_name}</td><td>${s.first_name}</td><td>${s.faculty}</td><td>${s.student_code}</td><td>${s.email || '-'}</td><td>${s.phone_number || '-'}</td><td>${s.enrol_date || '-'}</td></tr>`).join('')
              const html = `
                <h2>Liste des Étudiants${faculty ? ` — ${faculty}` : ''}</h2>
                <div class="info"><p>${dat.length} étudiant(s)</p></div>
                <table><thead><tr><th>Nom</th><th>Prénom</th><th>Faculté</th><th>Code</th><th>Email</th><th>Téléphone</th><th>Date Inscription</th></tr></thead><tbody>${tableRows}</tbody></table>
              `
              printHTML('PDF — Liste des Étudiants', html)
            }} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              PDF
            </button>
          </div>
        )}
      </div>

      {/* Active Filter Tags */}
      <div className="mt-3 flex flex-wrap gap-2">
        {faculty && (
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Faculté: {faculty}
            <button onClick={() => setFaculty('')} className="text-blue-600 hover:text-blue-800 font-bold">✕</button>
          </span>
        )}
        {studyYear && (
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Année: {studyYear}
            <button onClick={() => setStudyYear('')} className="text-green-600 hover:text-green-800 font-bold">✕</button>
          </span>
        )}
        {academicYear && (
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            Acad: {academicYear}
            <button onClick={() => setAcademicYear('')} className="text-purple-600 hover:text-purple-800 font-bold">✕</button>
          </span>
        )}
        {(dateEnrollFrom || dateEnrollTo) && (
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
            Date: {dateEnrollFrom || '...'} → {dateEnrollTo || '...'}
            <button onClick={() => { setDateEnrollFrom(''); setDateEnrollTo('') }} className="text-orange-600 hover:text-orange-800 font-bold">✕</button>
          </span>
        )}
      </div>

      <div className="text-gray-600 mt-2 text-sm font-medium">
        {dat?.length} résultats trouvés
      </div>

      {/* Expanded Filter Panel */}
      {filter && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Faculty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Faculté</label>
              <select name="faculty" value={faculty} onChange={(e)=>setFaculty(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                <option value="">-- Toutes les Facultés --</option>
                {facultyNames.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Study Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année d&apos;Étude</label>
              <select value={studyYear} onChange={(e) => setStudyYear(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                <option value="">-- Toutes --</option>
                <option value="1">1ère année</option>
                <option value="2">2ème année</option>
                <option value="3">3ème année</option>
                <option value="4">4ème année</option>
                <option value="5">5ème année</option>
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année Académique</label>
              <input type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="ex: 2025-2026"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
            </div>

            {/* Date Enroll From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inscrit depuis</label>
              <input type="date" value={dateEnrollFrom} onChange={(e) => setDateEnrollFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
            </div>

            {/* Date Enroll To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inscrit jusqu&apos;à</label>
              <input type="date" value={dateEnrollTo} onChange={(e) => setDateEnrollTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={()=>setSend(!send)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
              Appliquer les Filtres
            </button>
            <button onClick={() => { setFaculty(''); setStudyYear(''); setAcademicYear(''); setDateEnrollFrom(''); setDateEnrollTo(''); setSend(!send) }}
              className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-medium">
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>

  {/* loadingsection */}
  {load  ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
    {/* loadingsection */}
     <Loading/> <Loading/><Loading/> <Loading/>
     </div>) : dat ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl">
    {dat.map((compan,index)=>(
  <div key={compan.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
    {/* Card Header with Photo */}
    <div className="relative w-full h-40 bg-linear-to-b from-blue-100 to-gray-100 flex items-center justify-center overflow-hidden">
      {compan.photo_url? (
        <img src={compan.photo_url} alt={`${compan.first_name} ${compan.last_name}`}
          className="w-full h-full object-cover" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      )}
    </div>

    {/* Card Body */}
    <div className="p-4 space-y-3">
      {/* Student Name */}
      <div className="border-b pb-3">
        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition">
          <StudentInfos2 search={compan.student_code} fullnamex={`${compan.last_name} ${compan.first_name}`}/>
        </h3>
      </div>

      {/* Faculty */}
      <div className="flex items-center gap-2 text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
        </svg>
        <span className="text-sm font-medium">{compan.faculty}</span>
      </div>

      {/* Student Code */}
      <div className="flex items-center gap-2 text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-500 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
        </svg>
        <span className="text-sm font-mono font-medium text-blue-600">{compan.student_code}</span>
      </div>

      {/* Academy Year */}
      <div className="flex items-center justify-between pt-3 border-t">
        <span className="text-xs font-medium text-gray-600">Année Académique</span>
        <span className="text-lg font-bold text-blue-600"><Filter4 id={compan.id} bool/></span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-3 border-t">
        <button className="flex-1 py-2 text-[30px] bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium text-sm transition flex items-center justify-center gap-1">
          <Filter2 id={compan.id} bool/>
        </button>
          <Delete_button name={`${compan.last_name} ${compan.first_name}`} id={compan.id} value="student"/>
      </div>
    </div>
  </div>
))}
  </div>
) : (
  <div className="text-center py-16 px-4">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-400 mb-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.711v.5a.75.75 0 0 1-1.5 0v-.5c0-.712-.705-1.35-1.45-1.711-.24-.116-.467-.263-.67-.442-1.172-1.025-1.172-2.687 0-3.712ZM12 15a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
    </svg>
    <p className="text-gray-600 text-lg font-medium">Veuillez sélectionner une faculté dans le filtre pour afficher les étudiants.</p>
  </div>
)}
  </div>
</div>

</>
  )
}
export default function Page(){
  return (
    <Suspense fallback={<div className="text-center"><Loading2/></div>}>
      <Home/>
    </Suspense>
  )
}
