'use client'

import {supabase} from "./component/db"
import { useState,useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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

//export const dynamic = 'force-dynamic';

export default function Home() {
  const [dat, setDat]= useState<student[]>([])
  //const [use,setUse]= useState<any[] | null>([])
  const [filter, setFilter] = useState(false)

 const searchpara = useSearchParams();
         const search = searchpara.get('faculty') || '';

      //     async ()=> {const { data, error } = await supabase.auth.getUser()
      //   if (error) console.error(error.message)
      //   //else setUse(user as any | null)
      // }
  // useEffect(() => {
  //   const getData = async () => {
  //     const { data:comp, error } =  await supabase.from('student').select('*')
  //     .eq('faculty', search);
  //   if (error) console.error(error.message)
  //     else setDat(comp)
  //   }; 
  //   getData()},[])
 
 
  return (
<>
<div className="w-full mt-3">
   {/* filter query*/}
  <div><button className="text-xl ml-5 flex" onClick={()=>setFilter(!filter)}>filter
     {filter ?  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
        strokeWidth="1.5" stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
</svg> :<svg xmlns="http://www.w3.org/2000/svg" fill="none" 
        viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg> }</button>
   {filter ?
  <div>
     <form action="/">
    <div><input type="radio" name="faculty" value='Genie Civil' /> Génie Civil</div>
     <div><input type="radio" name="faculty" value='Médecine Géneérale' />Médecine Géneérale</div>
     <div><input type="radio" name="faculty" value='Odontologie' /> Odontologie</div>
     <div><input type="radio" name="faculty" value='Sciences Infirmières' /> Sciences Infirmières</div>
     <div><input type="radio" name="faculty" value=' Sciences Administratives' /> Sciences Administratives</div>
     <div><input type="radio" name="faculty" value='Sciences Comptables' /> Sciences Comptables</div>
      <div><input type="radio" name="faculty" value='Gestion des affaires' /> Gestion des affaires</div>
       <div><input type="radio" name="faculty" value='Sciences Agronomiques' /> Sciences Agronomiques</div>
        <div><input type="radio" name="faculty" value='Sciences Economiques' /> Sciences Economiques</div>
         <div><input type="radio" name="faculty" value={`Sciences de l'Education`} /> Sciences de l'Education</div>
          <div><input type="radio" name="faculty" value='Sciences Juridiques' /> Sciences Juridiques</div>
           <div><input type="radio" name="faculty" value='Pharmacologies' /> Pharmacologies</div>
            <div><input type="radio" name="faculty" value='Médecine vétérinaire' /> Médecine vétérinaire</div>
             <div><input type="radio" name="faculty" value='Laboratoire medicale' /> Laboratoire medicale</div>
              <div><input type="radio" name="faculty" value='Physiothérapie' /> Physiothérapie</div>
               <div><input type="radio" name="faculty" value={`Jardinières d'enfants`} /> Jardinières d'enfants</div>
   <button type="submit" className="bg-[#2DAE0D] rounded-2xl
             text-white text-[20px] hover:bg-green-700 w-20">filter</button>
   </form>
  </div> : null}
  </div>
  {/* header for the list of student by faculty*/}
    <ol className="flex justify-between  bg-sky-200 font-poppins rounded-t-lg ">
    <li className="ml-5">fullname</li>
  <li className="">Faculty</li>
  <li className="mr-10">year</li>
  </ol>
  {/*list of list of student by faculty */}
  <div className="rounded-b-lg min-h-20 bg-gray-200">{dat.map((compan)=>(
  <ol key={compan.id}   className="flex justify-between text-center">
    <li className="ml-5"><Link href={`search?nom=${compan.last_name}&prenom=${compan.first_name}`}>{compan.last_name} {compan.first_name}</Link></li>
  <li className="">{compan.faculty}</li>
  <li className="mr-10">0</li>
  </ol>
))}</div>

</div>

</>
  )
}
