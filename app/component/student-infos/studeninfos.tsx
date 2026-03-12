'use client'
import { useState,useEffect} from "react";
import { supabase } from "../db";
import { useSearchParams } from "next/navigation";
import  Lecture  from "../lect_input/lecture";
import Link from "next/link";
import { Filter } from "../filter/filter";
import Image from "next/image";

type user = {
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
    student_code: string
    
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
    photo_url: string
}
// interface prop{
//   nom: string
//   prenom: string
// }
type stat ={
  id: number
  student_id : number
  enroll_year: string
  year_study: number
  faculty_completion: boolean
  faculty: string
  year_completed: number
}
interface ph{
  dat: string
}

export default function StudentInfos(){
     const [studentInfos, setStudentInfos] = useState<user[]>([])
     const [first_name,setFirst_name]=useState('')
     const [last_name, setLast_name]= useState('')
    const  [status,setStatus] = useState<stat[]>([])
    const [role,setRole] = useState<any>([])
    const [fullname,setFullname] = useState<any[]>([])

     const searchpara = useSearchParams();
        const search = searchpara.get('nom') || '';
        const search2 = searchpara.get('prenom') || '';
       
      useEffect(() => {
            const getData = async () => {
              if (first_name || last_name){
                const { data:stud, error:second } =  await supabase.from('student')
              .select('id,last_name,first_name,faculty,student_code').ilike('first_name', `%${first_name}%`)
              .ilike('last_name', `%${last_name}%`)
              if (second) console.error(second.message)
                else setFullname(stud)
              }
              ;}
               getData()},[first_name,last_name])

      useEffect(() => {
        const getData = async () => {
          const { data:comp, error } =  await supabase.from('student').select('*')
          .eq('last_name', search).eq('first_name', search2);
        if (error) console.error(error.message)
          else {
       const studebId = comp[0]?.id
       if (studebId){
        const { data:com, error:status_error } =  await supabase.from('student_status').select('*')
          .eq('student_id', comp[0]?.id);
          setStudentInfos(comp)
        if (status_error) console.error(status_error.message)
        else setStatus(com) }}
       //user role
                const { data:{user}, error:theError } =   await supabase.auth.getUser();
          if (theError) console.log('Error',theError.message);
          
          else {
           const { data,} = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id).maybeSingle();
    if (error) console.error(error.message)
    else setRole(data)
          }
        };
        getData()},[]) 
 

     return(
        <>
        <div className="bg-gray-200 rounded-2xl w-full ">
          {/*search section */}
          <form action="/search" className="flex static xl:justify-between xl:mb-5 xl:pr-50 xl:pt-5 xl:pl-50">
           
            <input type="text" value={last_name}
            name="nom"
                placeholder="nom"
                 onChange={(e)=>setLast_name(e.target.value)}
                className="mr-[15%] py-2 px-4 focus:outline-none focus:border focus:border-blue-300 focus:h-9
                 hover:border hover:border-blue-300  border-gray-400 border
                  rounded-4xl placeholder:text  h-8 bg-gray-100"/>

                  <input type="text" value={first_name}
            name="prenom"
                placeholder="prenom"
                 onChange={(e)=>setFirst_name(e.target.value)}
                 className="mr-[15%] py-2 px-4 focus:outline-none focus:border focus:border-blue-300 focus:h-9
                 hover:border hover:border-blue-300  border-gray-400 border
                  rounded-4xl placeholder:text w- h-8 bg-gray-100"/>

          {/*search preview */}
           {last_name || first_name ? (<div className="absolute insert-0 top-36 bg-white rounded-xl">
            {fullname.map((stud)=>
            <ol key={stud.id} className="flex">
               <Link className="pl-3 flex " href={`/search?nom=${stud.last_name}&prenom=${stud.first_name}`} onClick={ (e) => {
    // Prevents Next.js client-side navigation
    e.preventDefault(); 
    // Forces a full browser page reload
    window.location.reload(); 
    // Manually navigate after reload
    window.location.href = `/search?nom=${stud.last_name}&prenom=${stud.first_name}`; 
  }} >
              <li className="m-1 p-1">{stud.last_name}</li>
              <li className="m-1 p-1">{stud.first_name}</li>
              <li className="m-1 p-1">faculté: {stud.faculty}</li>
              <li className="m-1 p-1">Code {stud.student_code}</li>
               </Link>
            </ol>)}
          </div>): null}
          
                  <button type="submit" className="bg-[#2DAE0D] rounded-2xl
             text-white text-[20px] hover:bg-green-700 w-30 pr-5 pl-5 h-8">Search</button>

          </form>

          {/*section read student infos */}
          {search && search2 ? 
          (<div>
            <h3 className="text-center font-poppins text-[20px]">formulaire Inscription</h3>
            <ol>{studentInfos.map((user)=>
            <li className="" key={user.id}>
                {/*infos perso */}
                 <div className="flex ">
                  <div className="w-32 h-32 rounded-full border-2 border-gray-400 overflow-hidden bg-gray-300 flex items-center justify-center mt-10 m-2">
                    {user.photo_url? (<Image src={user.photo_url} alt="Preview" width={128} height={128} 
                  className="w-full h-full object-cover rounded-xl" />) 
                  : (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    )}</div>

                <div className="grid grid-flow-col grid-rows-3 w-full p-2">
                  <Lecture int="Nom" out={user.last_name} />
                 <Lecture int="Prenom" out={user.first_name} />
                  <Lecture int="Email" out={user.email} />
                   <Lecture int="Date de naissance" out={user.date_birth} />
                    <Lecture int="lieu de naissance" out={user.place_of_birth} />
                     <Lecture int="Sexe" out={user.sex} />
                      <Lecture int="NIF/CIN" out={user.nif_cin} />
                      <Lecture int="Statut matrimanial" out={user.marital_status} />
                      <Lecture int="Adress" out={user.adress} />
                      <Lecture int="Telephone" out={user.phone_number} />
                      <Lecture int="Faculté" out={user.faculty} />
                      <Lecture int="code" out={user.student_code} />
                  </div>
                 </div>
                  {/*link */}
                    {role.role === 'admin' || role.role === 'admistration' ? <Link href={`/payment?id=${user.id}`}  className="pl-3  bg-[#2DAE0D] rounded-2xl text-white text-[20px] hover:bg-green-700 w-35 pr-2  m-3 flex">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 mt-1">
  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
</svg><span className="ml-2">payment</span></Link>: null}
                {/*status section*/}
             <h6 className="text-center m-2 underline text-[16px]">statut de progression de l'étudiant</h6>
             <div className="flex">
               <Lecture int="Année actuel" out={status[0]?.year_study} />
             <Lecture int="Année complete" out={status[0]?.year_completed} />
             <Lecture int="Vue par" out={studentInfos[0]?.seen_by} />
             <Lecture int="année completer" out={status[0]?.faculty_completion ? 'Oui':'Non'} />
             
              { role.role === 'admin' || role.role === 'admistration' || role.role === 'editor' ?
              <Filter id={studentInfos[0]?.id} bool={status[0]?.faculty_completion} year={status[0]?.year_study}
               year_complt={status[0]?.year_completed}/>: null}
              </div>

                 {/*family infos for mother*/}
               <h3 className="text-center m-2 underline text-[16px]">Information familiales </h3>
                 <div className="grid grid-cols-3"> 
                    <Lecture int="Mère" out={user.mother_name ? `${user.mother_name}`:'vide'} />
                      <Lecture int="Lieu de naissance" out={user.mother_birth ? `${user.mother_birth}`:'vide'} />
                        <Lecture int="Domicile" out={user.mother_residence  ? `${user.mother_residence}`:'vide'} />
                       <Lecture int="Téléphone" out={user.mother_phone ? `${user.mother_phone}`:'vide'} />
                        <Lecture int="Profession" out={user.mother_profesion ? `${user.mother_profesion}`:'vide'} />
                  </div> 
                {/*family infos for father*/}
                 <div className="grid grid-cols-3">                  
                  <Lecture int="Père" out={user.father_name ? `${user.father_name}`:'vide'} />
                 <Lecture int="Lieu de naissance" out={user.father_birth ? `${user.father_birth}`:'vide'} />
                        <Lecture int="Domicile" out={user.father_residence ? `${user.father_residence}`:'vide'} />
                       <Lecture int="Téléphone" out={user.father_phone ? `${user.father_phone}`:'vide'} />
                        <Lecture int="Profession" out={user.father_profesion ? `${user.father_profesion}`:'vide'} />
                 </div>
           </li>)}
            </ol>
          </div>) : <div className="text-center text-[20px] p-50 font-inter text-gray-800">Veuillez saisir votre nom & prénom dans la section de recherche.</div>}
        
        </div>
        </>
     )
}