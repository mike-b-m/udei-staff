'use client'
import { supabase } from "@/app/component/db";
import { useState,useEffect } from "react";
import { useSearchParams } from "next/navigation";
import TheacherInput, { ReadNote, TheacherInput2 } from "@/app/component/teacher/teacher";
// const colors=[
//  "bg-[#2DAE0D]/70",
//  "bg-gray-200"
// ]
const colors=[
  "bg-[#CAF0F8]/25 font-medium",
  "bg-[#90C3C8]/70 font-medium"
]
export default function Teacher(){
    const [exam,setExam] = useState<any[]>([])
    const [note, setNote] = useState<any[]>([])
    const [program,setProgram] = useState<any[]>([])
    const [faculty,setFaculty] = useState('')
    const [intra,setIntra] = useState(true)
    const [read,setRead] = useState(false)
    
        const [student,setStudent]= useState<any[]>([])
        const searchpara= useSearchParams()
            const search = searchpara.get('faculty') || ''
            //const search2 = searchpara.get('matiere') ||''
            const search3 = searchpara.get('year') || ''
            const search4 = searchpara.get('session') || ''

     useEffect(() => {
            const getData = async () => {
               //list cours in program
               const { data:pro, error:theError } = await supabase
  .from('course_program')
  .select('*').eq('faculty', search).eq('session', search4).eq('year', search3)//.eq('courses', search2);
  // read student in faculty
  // const { data:stud, error:second } =  await supabase.from('student')
  //             .select('id,last_name,first_name').eq('faculty', search)
  //             .order('last_name', { ascending: true })
   const { data:stud, error:second } =  await supabase.from('student_status')
              .select('id,student_id,year_study')
        .eq('year_study',search3);
              const { data:exa, error:third } =  await supabase.from('exam')
              .select('*')
              ;
              if (third) console.error(third.message)
        else { 
      setExam(exa)
      setNote(exa[1]?.intra)
        }
               if (second) console.error(second.message)
        else setStudent(stud)

        if (theError) console.error(theError.message)
        else setProgram(pro)
            }; 
            getData()},[])
    return(
        <div className="bg-gray-200 mt-3 w-full rounded-xl">
          <h2 className="text-center m-3 font-bold text-[16px]">Note</h2>
          {/*filter */}
          <form action='/admin/teacher' className="p-10">
            <select name="matiere" id="" className="mr-5" onChange={(e)=>setFaculty(e.target.value)}>
              <option value="">matière</option>
              {program.map((pro)=>
              <option key={pro.courses}>{pro.courses}</option>)}
            </select>
            {/*faculty */}
            <select  name="faculty" id="" className="mr-5">
              <option value="">Faculty</option>
                    <option>Génie Civil</option>
                    <option>Médecine Générale</option>
                    <option>Odontologie</option>
                    <option>Sciences Infirmières</option>
                    <option> Sciences Administratives</option>
                    <option>Sciences Comptables</option>
                    <option>Science Informatique</option>
                    <option>Gestion Des Affaires</option>
                    <option>Sciences Agronomiques</option>
                    <option> Sciences Economiques</option>
                    <option>Sciences De L'Education</option>
                    <option>Sciences Juridiques</option>
                    <option>Pharmacologies</option>
                    <option>Médecine Vétérinaire</option>
                    <option> Laboratoire Médicale</option>
                    <option>Physiothérapie</option>
                    <option>Jardinières D'enfants</option>
            </select>
            {/*year/nivau */}
            {/* <label>nivau</label> */}
            <select name="year" id="" className="mr-5">
              <option value="">nivau</option>
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
              <option>6</option>
            </select>
            {/*session */}
            {/* <label>session</label> */}
            <select name="session" id="" className="mr-5">
              <option value="">session</option>
              <option>1</option>
              <option>2</option>
            </select>
            <button type="submit" className="bg-[#2DAE0D] rounded-2xl text-white text-[16px] hover:bg-green-700 w-20 h-6 ml-3">filter</button>
          </form>
       
        {/*button */}
        <div className="border border-gray-400 rounded-full p-1 m-4 w-68.5 ">
          <button onClick={()=>{setRead(true) 
        setIntra(false)}} 
          className={`${read ? 'bg-[#0077B6] rounded-2xl text-white text-[16px] w-20 h-6 '
          :'bg-gray-100 rounded-2xl text-[16px] hover:bg-blue-400 w-20 h-6'}`}>read</button>
          <button onClick={()=>{setIntra(true)
            setRead(false)
          }} 
          className={`${intra ? 'bg-[#0077B6] rounded-2xl text-white text-[16px] w-20 h-6 ml-3'
          :'bg-gray-100 rounded-2xl text-[16px] hover:bg-blue-400 w-20 h-6 ml-3'}`}>intra</button>
         <button onClick={()=>setIntra(false)}
          className={`${!intra && read===false ? 'bg-[#0077B6] rounded-2xl text-white text-[16px] w-20 h-6 ml-3'
          :'bg-gray-100 rounded-2xl text-[16px] hover:bg-blue-400 w-20 h-6 ml-3'}`}>Final</button></div>

          {/*show filter selected */}
          <div className="flex">
              {search ? (<div className=" m-4 p-1 rounded shadow-sm shadow-[#0077B6]">{search}</div>):null}
              {search3 ? (<div className=" m-4 p-1 rounded shadow-sm shadow-[#0077B6]">Niveau: {search3}</div>):null}
              {search4 ? (<div className=" m-4 p-1 rounded shadow-sm shadow-[#0077B6]">Session: {search4}</div>):null}
          </div>
             {faculty ? <h3 className="text-center font-bold">matière sélectionné: {faculty}</h3>: <h3 className="text-center">Veuillez sélectionner une matiere dans la section filtre des matière.</h3>}
          {/*teacher enter intra*/}
          {intra ? <div className="border border-gray-100 m-2">
            <div className="flex">
            <div className="mr-4 pl-2 min-w-40">Nom et Prénom</div>
            <div>Note</div>
          </div>
         {student.map((exa:any,index)=>
        <ol key={exa.id} className={`${colors[index % colors.length]}`}>
          <li><TheacherInput faculty={search} session={search4} year={search3} name={''} matiere={faculty} id={exa.student_id}/> </li>           
        </ol>)} 
          </div> : !intra && !read ?
            (<div className="border border-gray-100 m-2">
              {/* teacher enter final */}
            <div className="flex">
            <div className="mr-4 pl-2 min-w-40">Nom et Prénom</div>
            <div className="w-20 text-center">Note</div>
            <div className="w-20">Note</div>
          </div>
          {student.map((exa:any,index)=>
        <ol key={exa.id} className={`${colors[index % colors.length]}`}>
             <li><TheacherInput2 faculty="" session={search4} year={search3} 
                name={`${exa.last_name} ${exa.first_name}`} matiere={faculty} id={exa.student_id}/></li>
        </ol>)}
            </div>):null}
            {/*read session */}
            {read ? <div className="">
              <div className="flex bg-gray-100 font-semibold text-black/78">
              <div className="w-30 m-2">Name</div>
              <div className="w-30 m-2">Matière</div>
              <div className="w-10 m-2">Intra</div>
              <div className="w-13 m-2">reprise</div>
              <div className="w-10 m-2">Final</div>
              <div className="w-13 m-2">reprise</div>
              <div className="w-15 m-2">Session</div>
              <div className="w-10 m-2">nivo</div>
              <div className="w-30 m-2 text-center">Faculté</div>
              <div className="w-25 m-2">session</div>
            </div>
            {student.map((stud)=>
            <ol key={stud.id} className="flex border-b">
              <li ><ReadNote faculty="" session={search4} year={search3} id={stud.student_id} name="" matiere=''/></li>
              </ol>)}
            </div>
            : null}
        </div>
    )
}