'use client'

import {supabase} from "@/app/component/db"
import { Suspense, useState, useEffect} from "react";
import Link from "next/link";
import {Filter2} from "@/app/component/filter/filter";
import { Delete_button } from "@/app/component/add-buuton/add_button";
import {StudentInfos2} from "@/app/component/student-infos/studeninfos";
import Loading from "@/app/component/loading/loading";
import {Loading2} from "@/app/component/loading/loading";
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
  const [dat, setDat]= useState<student[]>([])
  //const [use,setUse]= useState<any[] | null>([])
  const [filter, setFilter] = useState(false)
  //const [no,setNivo] = useState<any>([])
  const [faculty,setFaculty] = useState('')
  const [send,setSend] = useState(false)
  const [load,setLoad] = useState(false)
  const [open,setOpen] = useState(false)
  const search = null

          async ()=> {const { data, error } = await supabase.auth.getUser()
        if (error) console.error(error.message)
        //else setUse(user as any | null)
      }
  useEffect(() => {
    const getData = async () => {
    //   const { data:com, error:Error } =  await supabase.from('student_status').select('year_study,student_id,id')
    //       .eq('student_year', search2);
    // if (Error) console.error(Error.message)
    //   else setNivo(com)
    setFilter(false)
    setLoad(true)
      const { data:comp, error } =  await supabase.from('student').select('*')
      .order('last_name', { ascending: true })
      .eq('faculty', faculty)//.ilike('academy', `%${search}%`);
    if (error) console.error(error.message)
      else setDat(comp)
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

      {/* Selected Faculty Tag */}
      {faculty && (
        <div className="mt-3 inline-block">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {faculty}
            <button onClick={() => setFaculty('')} className="text-blue-600 hover:text-blue-800 font-bold">✕</button>
          </span>
        </div>
      )}

      <div className="text-gray-600 mt-2 text-sm font-medium">
        {dat?.length} résultats trouvés
      </div>

      {/* Faculty Dropdown */}
      {filter && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <select name="faculty" value={faculty} onChange={(e)=>setFaculty(e.target.value)} className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
            <option value="">-- Sélectionner une Faculté --</option>
            <option>Génie Civil</option>
            <option>Médecine Générale</option>
            <option>Odontologie</option>
            <option>Sciences Infirmières</option>
            <option>Sciences Administratives</option>
            <option>Sciences Comptables</option>
            <option>Gestion des affaires</option>
            <option>Sciences Agronomiques</option>
            <option>Sciences Economiques</option>
            <option>Sciences de l'Education</option>
            <option>Sciences Juridiques</option>
            <option>Science Informatique</option>
            <option>Pharmacologies</option>
            <option>Médecine vétérinaire</option>
            <option>Laboratoire Médicale</option>
            <option>Physiothérapie</option>
            <option>Jardinières d'enfants</option>
          </select>
          <button  onClick={()=>setSend(!send)}
            className="mt-3 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
            Appliquer le Filtre
          </button>
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
        <span className="text-lg font-bold text-blue-600">{compan.academy}</span>
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
