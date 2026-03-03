'use client'
import { supabase } from "../component/db";
import { useState,useEffect } from "react";
import { useSearchParams } from "next/navigation";
import TheacherInput, { TheacherInput2 } from "../component/teacher/teacher";
const colors=[
 "bg-[#2DAE0D]/70",
 "bg-gray-200"
]
export default function Teacher(){
    const [exam,setExam] = useState<any[]>([])
    const [note, setNote] = useState<any[]>([])
    const [program,setProgram] = useState<any[]>([])
        const [student,setStudent]= useState<any[]>([])
        const searchpara= useSearchParams()
            const search = searchpara.get('faculty') || ''
            const search2 = searchpara.get('matiere') ||''
            const search3 = searchpara.get('year') || ''
            const search4 = searchpara.get('session') || ''

     useEffect(() => {
            const getData = async () => {
               //list cours in program
               const { data:pro, error:theError } = await supabase
  .from('course_program')
  .select('*').eq('faculty', search).eq('session', search4).eq('year', search3).eq('courses', search2);
  // read student in faculty
  const { data:stud, error:second } =  await supabase.from('student')
              .select('*')
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
        <div className="bg-gray-200 mt-3">
          {/*filter */}
          <form action='/teacher' className="p-10">
            <label>matière</label>
            <select name="matiere" id="" className="mr-5">
              <option value="anan">anan</option>
            </select>
            {/*faculty */}
            <label>Faculty</label>
            <select name="faculty" id="" className="mr-5">
              <option value="Génie Civil">Génie Civil
              </option>
            </select>
            {/*year/nivau */}
            <label>nivau</label>
            <select name="year" id="" className="mr-5">
              <option value="1">1</option>
            </select>
            {/*session */}
            <label>session</label>
            <select name="session" id="" className="mr-5">
              <option value="1">1</option>
            </select>
            <button type="submit">filter</button>
          </form>

          {/*student */}
          <div className="flex">
            <div className="mr-4 pl-2 min-w-40">Nom et Prénom</div>
            <div>Note</div>
          </div>
         {student.map((exa:any,index)=>
        <ol key={exa.id} className={`${colors[index % colors.length]}`}>
          <li><TheacherInput session={search4} year={search3} name={`${exa.last_name}
             ${exa.first_name}`} matiere={search2} id={exa.id}/> </li>           
        </ol>)}

            <div className="flex">
            <div className="mr-4 pl-2 min-w-40">Nom et Prénom</div>
            <div className="w-20 text-center">Note</div>
            <div className="w-20">Note</div>
          </div>
          {student.map((exa:any,index)=>
        <ol key={exa.id} className={`${colors[index % colors.length]}`}>
             <li><TheacherInput2 session={search4} year={search3} 
                name={`${exa.last_name} ${exa.first_name}`} matiere={search2} id={exa.id}/></li>
        </ol>)}
            {/*read session */}
            {exam.map((exa)=>
            <ol key={exa.id} className="flex">
              <li>id: {exa.student_id}</li>
              <li>intra: {exa.intra}</li>
              <li>final: {exa.final}</li>
              </ol>)}
        </div>
    )
}