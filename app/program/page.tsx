'use client'
import { Suspense, useState, useEffect } from "react";
import { supabase } from "../component/db";
import Input from "../component/input/input-comp";
import TheTable from "../component/table/table";
import { useSearchParams } from "next/navigation";

type prog = {
    id: number
    created_at:string 
    courses: string 
    credit: number
    session_subjet: number
    hour_session: number
    total_hour: number
    faculty: string
    year: number
    session: number
}
 function Program(){
    const [program, setProgram] = useState<prog[]>([])
    const [veri, setVeri] = useState(false)

    const [courses,setCourses] = useState('')
    const [credit, setCredit]= useState(Number)
    const [session_subjet,setSession_subjet] = useState(Number)
    const [ hour_session, setHour_session] = useState(Number)
    const [total_hour, setTotal_hour] = useState(Number)
    const [faculty,setFaculty]= useState('')
    const [year, setYear] = useState(Number)
    const [session, setSession]= useState(Number)

    const searchpara= useSearchParams()
    const search = searchpara.get('faculty')

    const programInput = async (e:any)=> {
        e.preventDefault()
        const { data, error } = await supabase
  .from('course_program').insert({courses,credit,session_subjet,
    hour_session,total_hour,faculty,year,session,}).select()
  if (error) console.error(error.message) 
    else {
console.log('Save',data)
setVeri(false)}
}
 useEffect(() => {
        const getData = async ()=> {const { data, error } = await supabase
  .from('course_program')
  .select('*').eq('faculty',search)
        if (error) console.error(error.message)
        else setProgram(data)};
    getData()},[])
    const sum = program
    return(
        <div className="w-full bg-gray-200 mt-3 rounded-xl mr-3"> 
        <form action="/program" className="text-center">
        {/*<input type="text" name="faculty"  className="border-2" />*/}
        <label>Faculté:</label>
                <select name="faculty"
                    className="px-4 focus:outline-none
                  rounded-4xl bg-gray-300 w-60">
                    <option>option</option>
                    <option>Génie Civil</option>
                    <option>Médecine Générale</option>
                    <option>Odontologie</option>
                    <option>Sciences Infirmières</option>
                    <option> Sciences Administratives</option>
                    <option>Sciences Comptables</option>
                    <option>Gestion des affaires</option>
                    <option>Sciences Agronomiques</option>
                    <option> Sciences Economiques</option>
                    <option>Sciences de l'Education</option>
                    <option>Sciences Juridiques</option>
                    <option>Pharmacologies</option>
                    <option>Médecine vétérinaire</option>
                    <option> Laboratoire medicale</option>
                    <option>Physiothérapie</option>
                    <option>Jardinières d'enfants</option>
                </select>
        <button type="submit" className="bg-green-400 border border-gray-400 m-3 rounded-2xl
             text-gray-800 text-[16px] hover:bg-green-700 w-25 h-6">search</button></form>

            {veri ? <form onSubmit={programInput} className="grid justify-between m-3 grid-cols-5 ">
                <Input int={courses} type="text" text="Cours" out={(e)=>setCourses(e.target.value)}/>
                 <Input int={credit} type="number" text="Crédit" out={(e)=>setCredit(e.target.value)}/>
                  <Input int={session_subjet} type="number" text="Nombres séances/H" out={(e)=>setSession_subjet(e.target.value)}/>
                   <Input int={hour_session} type="number" text="Nombres H/séances" out={(e)=>setHour_session(e.target.value)}/>
                    <Input int={total_hour} type="number" text="Numbres d'heures totals " out={(e)=>setTotal_hour(e.target.value)}/>
                     
                     <div className="w-1">
                         <label>Faculté:</label>
                <select value={faculty} onChange={(e)=>setFaculty(e.target.value)}
                    className="px-4 focus:outline-none
                  rounded-4xl bg-gray-300 w-50">
                    <option>option</option>
                    <option>Génie Civil</option>
                    <option>Médecine Géneérale</option>
                    <option>Odontologie</option>
                    <option>Sciences Infirmières</option>
                    <option> Sciences Administratives</option>
                    <option>Sciences Comptables</option>
                    <option>Gestion des affaires</option>
                    <option>Sciences Agronomiques</option>
                    <option> Sciences Economiques</option>
                    <option>Sciences de l'Education</option>
                    <option>Sciences Juridiques</option>
                    <option>Pharmacologies</option>
                    <option>Médecine vétérinaire</option>
                    <option> Laboratoire medicale</option>
                    <option>Physiothérapie</option>
                    <option>Jardinières d'enfants</option>
                </select>
                     </div>
                <div className="m-5">
                      <label>Session</label>
                      <select className="px-4  focus:outline-none
                  rounded-4xl bg-gray-300" onChange={(e:any)=>setSession(e.target.value)}>
                        <option>option</option>
                        <option>1</option>
                        <option>2</option>
                      </select></div>
                    
                    <div className="m-5">                       
                      <label>Année</label>
                      <select className="px-4 focus:outline-none
                  rounded-4xl bg-gray-300" onChange={(e:any)=>setYear(e.target.value)}>
                        <option>option</option>
                        <option>1</option>
                        <option>2</option>
                        <option>3</option>
                        <option>4</option>
                        <option>5</option>
                      </select>
                    </div>
                    <button className="bg-gray-400/50 border border-gray-400 m-5 rounded-2xl
             text-gray-800 text-[20px] hover:bg-green-700 w-25 h-8"
             onClick={()=>setVeri(false)}>Cancel</button>
                       <button type="submit" className="bg-[#2DAE0D] m-5 rounded-2xl
             text-white text-[20px] hover:bg-green-700 w-25 h-8">save</button>
            </form> : <button  className="bg-[#2DAE0D] m-5 rounded-2xl
             text-white text-[16px] hover:bg-green-700 pr-5 pl-5 h-8" onClick={()=>setVeri(true)}>Add program</button> }
            {/*table program */}
            <h3 className="text-center">Program des cours : {search} </h3>
            
            { search ? <div className=" mt-15">
                <TheTable int={program} session={1} year={1} faculty={search}/>
                <TheTable int={program} session={2} year={1} faculty={search}/>

                <TheTable int={program} session={1} year={2} faculty={search}/>
                <TheTable int={program} session={2} year={2} faculty={search}/>

                <TheTable int={program} session={1} year={3} faculty={search}/>
                <TheTable int={program} session={2} year={3} faculty={search}/>

                <TheTable int={program} session={1} year={4} faculty={search}/>
                <TheTable int={program} session={2} year={4} faculty={search}/>

                <TheTable int={program} session={1} year={5} faculty={search}/>
                <TheTable int={program} session={2} year={5} faculty={search}/>
            </div>: null}
        </div>
    )
}
export default function Programm(){
    return(
        <Suspense fallback={<div>chargement..</div>}>
            <Program/>
        </Suspense>
    )
}