'use client'
import { useState, useEffect } from "react";
import { supabase } from "../db";
import { useSearchParams } from "next/navigation";
import  Lecture  from "../lect_input/lecture";

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
interface prop{
  nom: string
  prenom: string
}
type stat ={
  id: number
  student_id : number
  enroll_year: string
  year_study: number
  faculty_completion: boolean
  faculty: string
  year_completed: number
}
export default function StudentInfos({nom,prenom}:prop){
     const [studentInfos, setStudentInfos] = useState<user[]>([])
     const [first_name,setFirst_name]=useState('')
     const [last_name, setLast_name]= useState('')
    const  [status,setStatus] = useState<stat[]>([])
       const searchpara = useSearchParams();
    const search = searchpara.get('nom') || '';
    const search2 = searchpara.get('prenom') || '';

     useEffect(() => {
        const getData = async () => {
          const { data:comp, error } =  await supabase.from('student').select('*')
          .eq('last_name', `${nom}`).eq('first_name', `${prenom}`);
        if (error) console.error(error.message)
          else {
      const { data:com, error:status_error } =  await supabase.from('student_status').select('*')
          .eq('student_id', `${comp[0]?.id}`);
          setStudentInfos(comp)
        if (status_error) console.error(status_error.message)
        else setStatus(com) }
        }; 
        getData()},[])
        
     return(
        <>
        <div className="ml-[1%] mr-[1%] bg-gray-200 rounded-2xl m-3 p-2 w-full">
        
          <form action="/search" className="flex justify-between">
           
            <input type="text" value={last_name}
            name="nom"
                placeholder="nom"
                 onChange={(e)=>setLast_name(e.target.value)}
                className="mr-[15%] py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] h-8 bg-gray-100"/>

                  <input type="text" value={first_name}
            name="prenom"
                placeholder="prenom"
                 onChange={(e)=>setFirst_name(e.target.value)}
                 className="mr-[15%] py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] h-8 bg-gray-100"/>

                  <button type="submit" className="bg-[#2DAE0D] rounded-2xl
             text-white text-[20px] hover:bg-green-700 w-25 h-8">Search</button>
          </form>
          <h3 className="text-center font-poppins text-[20px]">formulaire Inscription</h3>
            <ol>{studentInfos.map((user)=>
            <li className="grid grid-cols-2" key={user.id}>
                {/*infos perso */}
                <Lecture int="Nom" out={user.first_name} />
                 <Lecture int="Prenom" out={user.last_name} />
                  <Lecture int="Email" out={user.email} />
                   <Lecture int="Date de naissance" out={user.date_birth} />
                    <Lecture int="lieu de naissance" out={user.place_of_birth} />
                     <Lecture int="Sexe" out={user.sex} />
                      <Lecture int="NIF/CIN" out={user.nif_cin} />
                      <Lecture int="Statut matrimanial" out={user.marital_status} />
                      <Lecture int="Adress" out={user.adress} />
                      <Lecture int="Telephone" out={user.phone_number} />
                      <Lecture int="Faculté" out={user.faculty} />
                      <Lecture int="Vue par" out={user.seen_by} />
                     
               
                  <h3 className="text-right m-2 underline text-[16px]">Information </h3>
                  <h3 className="m-2 underline text-[16px]">familiales</h3>
                   {/*family infos for mother*/}
                    <Lecture int="Mère" out={user.mother_name} />
                       <Lecture int="Lieu de naissance" out={user.mother_birth} />
                        <Lecture int="Domicile" out={user.mother_residence} />
                       <Lecture int="Téléphone" out={user.mother_phone} />
                        <Lecture int="Profession" out={user.mother_profesion} />
                       

                  <h3 className=""> </h3>
                  <h3 className="m-2 text-right underline text-[16px]"> Information</h3><h3 className="m-2 underline text-[16px]"> familiales </h3>
                  {/*family infos for father*/}
                  <Lecture int="Père" out={user.father_name} />
                 <Lecture int="Lieu de naissance" out={user.father_birth} />
                        <Lecture int="Domicile" out={user.father_residence} />
                       <Lecture int="Téléphone" out={user.father_phone} />
                        <Lecture int="Profession" out={user.father_profesion} />
           </li>)}
            </ol>
             {/*status section*/}
             <div className="flex">
               <Lecture int="Année actuel" out={status[0]?.year_study} />
             <Lecture int="Année complete" out={status[0]?.year_completed} />
             <Lecture int="Vue par" out={studentInfos[0]?.seen_by} />
              </div>
        </div>
        </>
     )
}