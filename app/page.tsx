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

 const searchpara = useSearchParams();
         const search = searchpara.get('faculty') || '';
         //const search2 = searchpara.get('niveau') || '';

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
    <div className="mb-4 bg-white p-2 rounded-sm">
      <button className="text-[20px] flex w-35 justify-center border rounded-lg hover:bg-gray-300" onClick={()=>setFilter(!filter)}>filter
     {filter ?  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
        strokeWidth="1.5" stroke="currentColor" className="size-6  ml-2 mt-1">
  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
</svg> :<svg xmlns="http://www.w3.org/2000/svg" fill="none" 
        viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 ml-2 mt-1">
  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg> }</button>
    </div>

      <div className="text-gray-600 bg-white pl-3 mb-2 rounded-sm">
        {dat?.length} Résultats...
      </div>
   {filter ?
  <div className="absolute top-31 w-12.5">
     <form action="/" className="absolute bg-gray-300 w-65 p-5 rounded-xl">
     <select name="faculty" >
      <option value="">faculté</option>
      <option>Génie Civil</option>
      <option>Médecine Générale</option>
      <option>Odontologie</option>
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
             {/* <select name="niveau" className="m-5" required>
              <option value="">niveau</option>
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
             </select> */}
   <button type="submit" className="bg-[#2DAE0D] rounded-2xl
             text-white text-[20px] hover:bg-green-700 w-20">filter</button>
   </form>
  </div> : null}
  </div>
  {search ? (<div className="flex flex-warps">
    {dat.map((compan,index)=>(
  <ol key={compan.id}   className={`w-[345px] flex bg-[#FBFBFB] rounded-xl m-2`}>
    <div className="size-32 rounded-full border-2 border-gray-400 overflow-hidden bg-gray-300 flex items-center justify-center m-2">
                        {compan.photo_url? (<img src={compan.photo_url} alt="Preview"
                      className="w-full h-full object-cover rounded-xl" />) 
                      : (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                          </svg>
                        )}</div>
      <li className="m-2 bg-gray-100 w-[210px] relative">
          <li className="w-full font-black  text-gray-700 border-gray-500 text-[20px]">
      <Link className="hover:text-blue-600 hover:text-[24px] hover:font-bold" href={`search?nom=${compan.last_name}&prenom=${compan.first_name}`}>
    {compan.last_name} {compan.first_name}</Link></li>
    {/*section faculty */}
  <li className="w-full border-gray-500 text-[16px] text-[#787878] font-medium flex">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 mr-1">
  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
</svg>
{compan.faculty}</li>
{/*section code */}
   <li className="w-full border-gray-500 flex text-[#484646] font-medium">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 mr-1">
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
</svg>{compan.student_code}</li>
  {/*academy year */}
  <li className="w-full font-bold text-[#0077B6] text-[20px] border-gray-500 text-right pr-2">
    {compan.academy}
</li>
{/*student year active */}
  <li className="border-[#FFAE00] absolute right-2 top-6 border rounded-full size-11 justify-items-center text-[28px] text-[#484646]"><Filter2 id={compan.id} bool/></li>
 {/*delete section */}
 <li className="w-full border-gray-500 absolute top-20 right-0">
    <Delete_button name={`${compan.last_name} ${compan.first_name}`} id={compan.id} value="student"/></li>
 </li>
      
  {/* <li className="w-full border-r border-gray-500"><Filter2 id={compan.id} bool/></li>
   <li className="w-full border-r border-gray-500">
    <Delete_button name={`${compan.last_name} ${compan.first_name}`} id={compan.id} value="student"/></li> */}
      
 
 
  </ol>
))}
  </div>)
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
