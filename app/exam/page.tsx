'use client'
import { supabase } from "../component/db";
import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";

export default function Exam(){
    const [exam,setExam] = useState<any[]>([])
    const [program,setProgram] = useState<any[]>([])
    const [student,setStudent]= useState<any[]>([])
    const searchpara= useSearchParams()
        const search = searchpara.get('faculty')

     useEffect(() => {
            const getData = async () => {
                //read note
              const { data:comp, error } =  await supabase.from('exam')
              .select('*')
              ;
              //list cours in program
               const { data, error:theError } = await supabase
  .from('course_program')
  .select('*').eq('faculty', 'Genie Civil');
  // read student in faculty
  const { data:stud, error:second } =  await supabase.from('student')
              .select('*')
              ;
               if (second) console.error(second.message)
        else setStudent(stud)

        if (theError) console.error(theError.message)
        else setProgram(data)

            if (error) console.error(error.message)
              else setExam(comp)
            }; 
            getData()},[])
return(
    <div>
        <div>
            <h3>faculty:</h3>
        </div>
        {/*student */}
         {student.map((exa:any)=>
        <ol>
            <li>{exa.intra}</li>
            <li>{exa.final}</li>
        </ol>)}
            {/*program */}
         {program.map((exa:any)=>
        <ol>
            <li>{exa.intra}</li>
            <li>{exa.final}</li>
        </ol>)}

        {exam.map((exa:any)=>
        <ol>
            <li>{exa.intra}</li>
            <li>{exa.final}</li>
        </ol>)}
    </div>
)
}