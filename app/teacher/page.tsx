'use client'
import { supabase } from "../component/db";
import { useState,useEffect } from "react";
import { useSearchParams } from "next/navigation";
import TheacherInput, { ReadNote, TheacherInput2 } from "../component/teacher/teacher";
const colors=[
 "bg-[#2DAE0D]/70",
 "bg-gray-200"
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
  const { data:stud, error:second } =  await supabase.from('student')
              .select('*')
              .order('last_name', { ascending: true })
              ;
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
          <form action='/teacher' className="p-10">
            <label>matière</label>
            <select name="matiere" id="" className="mr-5" onChange={(e)=>setFaculty(e.target.value)}>
              {program.map((pro)=>
              <option key={pro.courses}>{pro.courses}</option>)}
            </select>
            {/*faculty */}
            <label>Faculty</label>
            <select name="faculty" id="" className="mr-5">
              <option>option</option>
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
            <label>nivau</label>
            <select name="year" id="" className="mr-5">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            {/*session */}
            <label>session</label>
            <select name="session" id="" className="mr-5">
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
            <button type="submit" className="bg-[#2DAE0D] rounded-2xl text-white text-[16px] hover:bg-green-700 w-20 h-6 ml-3">filter</button>
          </form>
       
        {/*button */}
        <div><button onClick={()=>{setRead(true) 
        setIntra(false)}} 
          className={`${read ? 'bg-[#2DAE0D] rounded-2xl text-white text-[16px] hover:bg-green-700 w-20 h-6 ml-3'
          :'bg-gray-100 rounded-2xl text-[16px] hover:bg-green-700 w-20 h-6 ml-3'}`}>read</button>
          <button onClick={()=>{setIntra(true)
            setRead(false)
          }} 
          className={`${intra ? 'bg-[#2DAE0D] rounded-2xl text-white text-[16px] hover:bg-green-700 w-20 h-6 ml-3'
          :'bg-gray-100 rounded-2xl text-[16px] hover:bg-green-700 w-20 h-6 ml-3'}`}>intra</button>
         <button onClick={()=>setIntra(false)}
          className={`${!intra && read===false ? 'bg-[#2DAE0D] rounded-2xl text-white text-[16px] hover:bg-green-700 w-20 h-6 ml-3'
          :'bg-gray-100 rounded-2xl text-[16px] border-1 hover:bg-green-700 w-20 h-6 ml-3'}`}>Final</button></div>

             <h3>{faculty}</h3>
          {/*teacher enter intra*/}
          {intra ? <div className="border border-gray-100 m-2">
            <div className="flex">
            <div className="mr-4 pl-2 min-w-40">Nom et Prénom</div>
            <div>Note</div>
          </div>
         {student.map((exa:any,index)=>
        <ol key={exa.id} className={`${colors[index % colors.length]}`}>
          <li><TheacherInput session={search4} year={search3} name={`${exa.last_name}
             ${exa.first_name}`} matiere={faculty} id={exa.id}/> </li>           
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
             <li><TheacherInput2 session={search4} year={search3} 
                name={`${exa.last_name} ${exa.first_name}`} matiere={faculty} id={exa.id}/></li>
        </ol>)}
            </div>):null}
            {/*read session */}
            {read ? <div>
              <div className="flex bg-gray-100">
              <div className="w-30 m-2">Name</div>
              <div className="w-30 m-2">Matière</div>
              <div className="w-10 m-2">Intra</div>
              <div className="w-10 m-2">Final</div>
              <div className="w-10 m-2">nivo</div>
              <div className="w-30 m-2">Faculté</div>
            </div>
            {student.map((stud)=>
            <ol key={stud.id} className="flex border-b">
              <li className="w-30 m-2">{stud.last_name} {stud.first_name}</li>
              <li ><ReadNote session={1} year={1} id={stud.id} name="" matiere=''/></li>
              <li className="w-30 m-2">{stud.faculty}</li>
              </ol>)}
            </div>
            : null}
        </div>
    )
}