'use client'

import {supabase} from "./component/db"
import { Suspense, useState, useEffect} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {Filter2} from "./component/filter/filter";
import { Delete_button } from "./component/add-buuton/add_button";

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
}
const colors=[
 "bg-[#2DAE0D]/70",
 "bg-gray-200"
]
//export const dynamic = 'force-dynamic';

function Home() {
  const [dat, setDat]= useState<student[]>([])
  //const [use,setUse]= useState<any[] | null>([])
  const [filter, setFilter] = useState(false)

 const searchpara = useSearchParams();
         const search = searchpara.get('faculty') || '';
         
          async ()=> {const { data, error } = await supabase.auth.getUser()
        if (error) console.error(error.message)
        //else setUse(user as any | null)
      }
  useEffect(() => {
    const getData = async () => {
      const { data:comp, error } =  await supabase.from('student').select('*')
      .order('last_name', { ascending: true })
      .eq('faculty', search);
    if (error) console.error(error.message)
      else setDat(comp)
    }; 
    getData()},[])
 
 
  return (
<>
<div className="w-full rounded-xl static">
  
   {/* filter query*/}
  <div>
    {/*filter section */}
    <div className="mb-8">
      <button className="text-[20px] flex w-35 justify-center border rounded-lg" onClick={()=>setFilter(!filter)}>filter
     {filter ?  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
        strokeWidth="1.5" stroke="currentColor" className="size-6  ml-2 mt-1">
  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
</svg> :<svg xmlns="http://www.w3.org/2000/svg" fill="none" 
        viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 ml-2 mt-1">
  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg> }</button>
    </div>

      <div className="text-gray-600 mb-1">
        {dat?.length} Résultats
      </div>
   {filter ?
  <div className="absolute top-31 w-12.5">
     <form action="/" className="absolute bg-gray-300 w-65 p-5 rounded-xl">
    <div><input type="radio" name="faculty" value='Génie Civil' /> Génie Civil</div>
     <div><input type="radio" name="faculty" value='Médecine Générale' />Médecine Générale</div>
     <div><input type="radio" name="faculty" value='Odontologie' /> Odontologie</div>
     <div><input type="radio" name="faculty" value='Sciences Infirmières' /> Sciences Infirmières</div>
     <div><input type="radio" name="faculty" value=' Sciences Administratives' /> Sciences Administratives</div>
     <div><input type="radio" name="faculty" value='Sciences Comptables' /> Sciences Comptables</div>
      <div><input type="radio" name="faculty" value='Gestion Des Affaires' /> Gestion des affaires</div>
       <div><input type="radio" name="faculty" value='Sciences Agronomiques' /> Sciences Agronomiques</div>
        <div><input type="radio" name="faculty" value='Sciences Economiques' /> Sciences Economiques</div>
         <div><input type="radio" name="faculty" value={`Sciences De L'Education`} /> Sciences de l'Education</div>
          <div><input type="radio" name="faculty" value='Sciences Juridiques' /> Sciences Juridiques</div>
          <div><input type="radio" name="faculty" value='Science Informatique' /> Science Informatique</div>
           <div><input type="radio" name="faculty" value='Pharmacologies' /> Pharmacologies</div>
            <div><input type="radio" name="faculty" value='Médecine Vétérinaire' /> Médecine vétérinaire</div>
             <div><input type="radio" name="faculty" value='Laboratoire Medicale' /> Laboratoire Médicale</div>
              <div><input type="radio" name="faculty" value='Physiothérapie' /> Physiothérapie</div>
               <div><input type="radio" name="faculty" value={`Jardinières D'enfants`} /> Jardinières d'enfants</div>
   <button type="submit" className="bg-[#2DAE0D] rounded-2xl
             text-white text-[20px] hover:bg-green-700 w-20">filter</button>
   </form>
  </div> : null}
  </div>
  {search ? (<div className="border-4 border-gray-500 rounded-2xl">{/* header for the list of student by faculty*/}
    <ol className="w-full flex justify-between p-1 bg-gray-400 rounded-t-xl font-medium">
    <li className="w-full pl-5">Nom et Prénom</li>
  <li className="w-full">Faculté</li>
  <li className="w-full">Niveau</li>
  <li className="w-full"></li>
  </ol>
  {/*list of list of student by faculty */}
   <div className="rounded-b-lg min-h-20 bg-gray-200">{dat.map((compan,index)=>(
  <ol key={compan.id}   className={`flex   ${colors[index % colors.length]}`}>
    <li className="w-full pl-5"><Link href={`search?nom=${compan.last_name}&prenom=${compan.first_name}`}>{compan.last_name} {compan.first_name}</Link></li>
  <li className="w-full">{compan.faculty}</li>
  <li className="w-full"><Filter2 id={compan.id} bool/></li>
  <li className="w-full"><Delete_button id={compan.id} value="student"/></li>
  </ol>
))}
</div> </div>)
 : <div className="text-center text-[20px] p-50 font-inter text-gray-800">
  Veuillez sélectionner une faculté dans la section filtre.</div>}

</div>

</>
  )
}
export default function Page(){
  return (
    <Suspense fallback={<div className="text-center">Chajman...</div>}>
      <Home/>
    </Suspense>
  )
}
