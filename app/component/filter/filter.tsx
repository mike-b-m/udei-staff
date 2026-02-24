'use client'
import { useState, useEffect} from "react";
import { supabase } from "../db";
import Input from "../input/input-comp";
import Lecture from "../lect_input/lecture";

type student = {
    id: number
    student_id: number
    enroll_year: string
    faculty: string
    year_study: number
    faculty_completion: boolean
    year_commpleted: string
    year_completed: number  
}
interface stat{
    id: number
    bool: boolean | null
}
interface statu{
    id: number
    bool: boolean | null
    year: number
    year_complt: number
}

export function Filter3({id,bool}:stat){
    const [filter, setFilter] = useState<any>([])
    
     useEffect(() => {
        const getData = async () => {
          const { data:comp, error } =  await supabase.from('student_status').select('year_study,student_id,id')
          .eq('student_id', id);
        if (error) console.error(error.message)
          else setFilter(comp)
        }; 
        getData()},[])
        return(
            <div>
                  {filter.map((filt:any)=>
        <ol key={filt.id}>
            <Lecture int="Année actuel" out={filt.year_study} />
            <Lecture int="Année complete" out={filt.year_completed} />
            <li>{filt.enrol_date}</li>
            <li>{filt.year_study}</li>
            <li>{filt.year_study}</li>
        </ol>)}  
            </div>
        )
}
export function Filter2({id}:stat){
    const [filter, setFilter] = useState<any>([])
    
     useEffect(() => {
        const getData = async () => {
          const { data:comp, error } =  await supabase.from('student_status').select('year_study,student_id,id')
          .eq('student_id', id);
        if (error) console.error(error.message)
          else setFilter(comp)
        }; 
        getData()},[])
        return(
            <div>
                  {filter.map((filt:any)=>
        <ol key={filt.id}>
            <li>{filt.year_study}</li>
        </ol>)}  
            </div>
        )
}

export function Filter({id,bool,year,year_complt}:statu){
    const [yea, setYea]= useState(year)
    const [faculty_cpt, setFaculty_cpt] = useState(bool)
    const [year_completed,setYear_comppleted] = useState(year_complt)
    const [open,setOpen] = useState(false)
    const [filter, setFilter] = useState<student[]>([])

    const handleUpdate= async ()=> {
        const {error:status_error } =  await supabase.from('student_status')
        .update([{year_study: yea, year_completed: year_completed,
             faculty_completion: faculty_cpt, }])
        .select('*')
          .eq('student_id', id);
            if (status_error) console.error(status_error.message)
            else 
        {
        console.log('saved')
        setOpen(false)
        }
    }

     useEffect(() => {
        const getData = async () => {
          const { data:comp, error } =  await supabase.from('student_status').select('*')
          .eq('student_id', id);
        if (error) console.error(error.message)
          else setFilter(comp)
        }; 
        getData()},[])
    return (
        <div className="relative">    
            {open ? <form action={handleUpdate} className="flex flex-col right-0 w-55 absolute bg-gray-100 p-3 rounded-xl border border-gray-600">
                <Input int={yea} out={(e)=>setYea(e.target.value)} type="number" text="année actuel"/>
                  <Input int={year_completed} out={(e)=>setYear_comppleted(e.target.value)} type="number" text="année complete"/>
                <div className="text-center">
                     <h4>faculté completer</h4>
                    <button className={`${faculty_cpt !==true ? 'text-gray-500' : 'text-gray-800'}`}>
                    <input type="checkbox" onChange={(e)=>setFaculty_cpt(!bool)}/>oui
                    </button>
                </div>
                <div>
                    <button className={`bg-gray-500 rounded-2xl text-white text-[16px] 
                hover:bg-gray-700 w-20 h-6 m-2 `} onClick={()=>{
                setOpen(false)}}>cancel</button>

                <button type="submit" className={`bg-[#2DAE0D] rounded-2xl text-white text-[16px]
                 hover:bg-green-700 w-20 h-6 m-2 pl-2`} >Save</button>
                </div>
            </form>
            :
            <button className={`bg-[#2DAE0D] rounded-2xl text-white text-[16px] 
                hover:bg-green-700 w-20 h-6 m-3 `} onClick={()=>{
                setOpen(true)}}>edit</button>}

        </div>
    )
}