'use client'
import { supabase } from "../component/db";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Stu } from "../component/add-payment/addpayment";
import { Filter2 } from "../component/filter/filter";
import { ReadNote, ReadNote2 } from "../component/teacher/teacher";

export default function Student_dashboard(){
    const [user,setUser] =useState<any[]>([])
    const [status,setStatus] = useState<any[]>([])
    const searchpara= useSearchParams()
        const search = searchpara.get('code')

      

     useEffect(() => {
        const getData = async ()=> {
            const { data:theData, error } = await supabase
  .from('student')
  .select('id,last_name,first_name,student_code,faculty')
  .eq('student_code',search)
        if (error) console.error(error.message)
        else {
    setUser(theData)
    const { data:dat, error:Err } = await supabase
  .from('student_status')
  .select('id,student_id,year_study')
  .eq('student_id', theData[0]?.id)
        if (Err) console.error(Err.message)
        else setStatus(dat)
        }
   
        };
    getData()},[])
    return(
        <div className="bg-gray-200 rounded-xl w-full p-15">
            <form action="/student" >
                <input type="text" name="code" className="focus:outline-none border"/>
                <button type="submit">search</button>
            </form>
            <div className="pl-2 bg text-[20px] font-medium text-center m-5">
                nom et prénom: {user[0]?.last_name} {user[0]?.first_name}
            </div>
            <h3 className="pl-2 bg text-[20px] font-medium text-center m-5">faculty: {user[0]?.faculty}</h3>
            {user.map((user)=>
            <div key={user.id} className="flex justify-between text-center">
                <div className="bg-gray-300  text-[20px] font-bold p-10 rounded-2xl"><div className="top-0">code</div>{user.student_code}</div>
                <div key={user.id} className="bg-gray-300  text-[20px] font-bold p-10 rounded-2xl">
                    <div>7</div>moyen</div>

                <div className="bg-gray-300  text-[20px] font-bold p-10 rounded-2xl">
                    <div><Filter2 id={user.id} bool/></div>year</div>

                <div className="bg-gray-300  text-[20px] font-bold p-10 rounded-2xl">
                    <div><Stu id={user.id}/></div>balance</div>

                <div className="bg-gray-300  text-[20px] font-bold p-10 rounded-2xl">
                    <div>2/10/20XX</div>exam date</div>
            </div>)}

                <div className="m-10"> session 1
                    <div>
              <div className="flex bg-gray-100">
              <div className="w-20 m-2">Name</div>
              <div className="w-27 m-2">Matière</div>
              <div className="w-10 m-2">Intra</div>
              <div className="w-10 m-2">Final</div>
            </div>
                </div>
                {status.map((stat)=>
                <ol key={stat.id}>
                    <ReadNote2 year={stat.year_study} session={1} id={stat.student_id} matiere={''} faculty={''} name=""/>
                </ol>)}
                </div>

            <div className="grid grid-cols-2">
                <div className="border border-gray-500 bg-gray-300 w-[90%] pl-5 rounded mt-5">1 semester</div>
                <div className="border border-gray-500 bg-gray-300 w-[90%] pl-5 rounded mt-5">2 semester</div>
                <div className="border border-gray-500 bg-gray-300 w-[90%] pl-5 rounded mt-5">devoir</div>
                <div className="border border-gray-500 bg-gray-300 w-[90%] pl-5 rounded mt-5">quiz</div>
                <div className="border border-gray-500 bg-gray-300 w-[90%] pl-5 rounded mt-5">horaire</div>
            </div>
        </div>
    )
}