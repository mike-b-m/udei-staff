'use client'
import { supabase } from "@/app/component/db";
import { useState, useEffect } from "react";
import { Stu } from "@/app/component/add-payment/addpayment";
import { Filter2 } from "@/app/component/filter/filter";
import {  ReadNote2 } from "@/app/component/teacher/teacher";
import Input from "../component/input/input-comp";
import {TheTable2} from "../component/table/table";

export default function Student_dashboard(){
    const [userX,setUser] =useState<any[]>([])
    const [status,setStatus] = useState<any[]>([])
    const [session,setSession] = useState(false)
    const [mat,setMat] = useState(false)
    //code section
    const [code,setCode] = useState('')
    const [sendCode,setsenCode] = useState(false)
    const [load,setLoad] = useState(false)
    const [result,setResult] = useState(false)
    const [program,setProgram] = useState<any[]>([])

     useEffect(() => {
        const getData = async ()=> {
            setLoad(true)
            const { data:theData, error } = await supabase
  .from('student')
  .select('id,last_name,first_name,student_code,faculty')
  .eq('student_code', code)
        if (error) console.error(error.message)
        else {
    setUser(theData)
    const { data, error } = await supabase
  .from('course_program')
  .select('*').eq('faculty',theData[0]?.faculty)
        if (error) console.error(error.message)
        else setProgram(data)
    const { data:dat, error:Err } = await supabase
  .from('student_status')
  .select('id,student_id,year_study')
  .eq('student_id', theData[0]?.id || null)
        if (Err) console.error(Err.message)
        else {
    setStatus(dat)
    setResult(true)}
        setLoad(false)}
   
        };
    getData()},[sendCode])
    return(
        <div className="bg-gray-200 rounded-xl w-full p-15">     
        <div className="flex justify-items-center text-center">
             <Input int={code} type="text" text="Code" 
                                     out={(e)=>setCode(e.target.value)} require={true}/>
                                      <button onClick={()=>setsenCode(!sendCode)} className="bg-gray-700 text-white text-[20px] pl-2 pr-2 max-h-10 mt-2 rounded-xl">search</button>
        </div>
        
            {load ? "chargement" : 
             result ? (<div>
                <div className="pl-2 bg text-[20px] font-medium text-center m-5 p-2 
            w-100 border-2 border-white bg-gray-100 rounded-2xl">
                Nom et Prénom: {userX[0]?.last_name} {userX[0]?.first_name}
            </div>
            <h3 className="pl-2 bg text-[20px] font-medium text-center m-5 p-2 
            w-100 border-2 border-white bg-gray-100 rounded-2xl">faculty: {userX[0]?.faculty}</h3>
            {userX.map((use:any)=>
            <div key={use.id} className="flex justify-between">
                <div className="bg-gray-100  text-[20px] font-bold p-10 rounded-2xl relative text-gray-800">
                    <div className="text-[16px] text-gray-500 absolute top-5 left-10">
                    code</div>{use.student_code}</div>

                <div key={use.id} className="bg-gray-100  text-[20px] text-center font-bold p-10 rounded-2xl relative w-40 text-gray-800">
                    <div className="text-[16px] text-gray-500 absolute top-5 left-10">moyen</div>A</div>

                <div className="bg-gray-100  text-[20px] text-center font-bold p-10 rounded-2xl relative w-40 text-gray-800">
                    <div className="text-[16px] text-gray-500 absolute top-5 left-10">year</div><Filter2 id={use.id} bool/></div>

                <div className="bg-gray-100  text-[20px] text-center font-bold p-10 rounded-2xl relative w-40 text-gray-800">
                    <div className="text-[16px] text-gray-500 absolute top-5 left-10">balance
                        </div><Stu id={use.id}/></div>

                <div className="bg-gray-100  text-[20px] text-center font-bold p-10 rounded-2xl relative w-40 text-gray-800">
                    <div className="text-[16px] text-gray-500 absolute top-5 left-10">exam date</div>2/10/20XX</div>
            </div>)}


            <div className="">
                <button onClick={()=>{setSession(!session)}} className="bg-gray-300  text-[16px] font-bold rounded-2xl w-50 mt-5 text-gray-800 border-2 shadow-2xs border-white">1 semester</button>
                <button  className="bg-gray-300  text-[16px] font-bold rounded-2xl w-50 mt-5 text-gray-800 border-2 shadow-2xs border-white">2 semester</button>
                <button onClick={()=>{setMat(!mat)}} className="bg-gray-300  text-[16px] font-bold rounded-2xl w-50 mt-5 text-gray-800 border-2 shadow-2xs border-white">Matière</button>
                <button  className="bg-gray-300  text-[16px] font-bold rounded-2xl w-50 mt-5 text-gray-800 border-2 shadow-2xs border-white">Horaire</button>
               </div>
            </div>) : <div className="text-center justify-items-center-safe font-medium ">Saisissez le code dans la section de recherche pour consulter vos informations.</div>}
            
               {/*session 1 */} 
               { session ? (<div className="m-10"> session 1
                    <div>
              <div className="flex bg-gray-100">
              <div className="w-50 m-2">Name</div>
              <div className="w-50 m-2">Matière</div>
              <div className="w-10 m-2">Intra</div>
              <div className="w-10 m-2">Final</div>
            </div>
                </div>
                {status.map((stat)=>
                <ol key={stat.id}>
                    <ReadNote2 year={stat.year_study} session={1} id={stat.student_id} matiere={''} faculty={''} name=""/>
                </ol>)}
                {/* session 2 */}

                </div>) : null}
                {/* list program */}
                {mat ? (<div>
                    {status.map((stat)=>
                <ol key={stat.id} className="flex">
                    <TheTable2 int={program} session={1} year={stat.year_study} faculty={stat.faculty}/>
                    <TheTable2 int={program} session={2} year={stat.year_study} faculty={stat.faculty}/>
                </ol>)}
                </div>) :
                null}
        </div>
    )
}