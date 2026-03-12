'use client'
import { supabase } from "../db";
import { useState, useEffect } from "react";
interface int{
    session: number |string | null 
    name: string
    matiere: string | null
    year: number | string | null
    id: number
    faculty: string 
}
const colors=[
 "bg-[#2DAE0D]/70",
 "bg-gray-200"
]
export default function TheacherInput({session,name,matiere,id,year,faculty}:int){
    const [note, setNote] = useState('')
    const [read,setRead] =useState(false)
    const [fullname,setFullname] = useState<any[]>([])

     useEffect(() => {
            const getData = async () => {
              const { data:stud, error:second } =  await supabase.from('student')
              .select('id,last_name,first_name').eq('id', id);
              if (second) console.error(second.message)
                else setFullname(stud)
              ;}
               getData()},[])

               useEffect(() => {
            const getData = async () => {
                const { data:stud, error:second } =  await supabase.from('student')
              .select('id,last_name,first_name').eq('id', id);
              if (second) console.error(second.message)
                else setFullname(stud)

            const {data , error } =  await supabase.from('exam')
        .select('*')
        .eq('student_id', id).eq('matiere',matiere).eq('session',session).eq('year',year).maybeSingle();
        if (data?.matiere === matiere){
            setRead(false)
        }
        else if(matiere) setRead(true)
        if (error) {
            console.error(error.message)
            //console.error('exist')
            }
            //else setRead(true)
              ;}
               getData()},[matiere])
    const handleSave= async ()=> { 
        const {data , error } =  await supabase.from('exam')
        .select('*')
        .eq('student_id', id).eq('matiere',matiere).single();
        if (data?.matiere !== null){
            if (matiere){
                
        const {error:status_error } =  await supabase.from('exam')
        .insert([{intra: note,matiere, session,year,faculty,student_id:id}])
        .select('*')
        .eq('student_id',id);
            if (status_error) console.error(status_error.message)
            else {
        console.log('saved')
        setRead(false)
    }
            }
            else console.error('matiere non selected')
        }
        else {
           console.error('dont exist') 
        }
    }
    return(
        <div>
            {read ? <form action={handleSave} className="flex">
          <div className="w-40 pl-2 mr-3">{fullname[0]?.last_name} {fullname[0]?.first_name} {name}</div><input type="number" value={note} max={100} min={0}
          className="w-20 border mr-3" onChange={(e)=>setNote(e.target.value)}/>
          <button>save</button>
        </form>: null}
        </div>
    )
}


export  function TheacherInput2({session,name,matiere,id,year}:int){
    const [note, setNote] = useState('')
    const [read,setRead] =useState(false)
    const [dat,setdat] = useState<any>()
    const [fullname,setFullname] = useState<any[]>([])

     useEffect(() => {
            const getData = async () => {
              const { data:stud, error:second } =  await supabase.from('student')
              .select('id,last_name,first_name').eq('id', id);
              if (second) console.error(second.message)
                else setFullname(stud)
              ;}
               getData()},[])
               
    useEffect(() => {
            const getData = async () => {
            const {data , error } =  await supabase.from('exam')
        .select('*')
        .eq('student_id', id).eq('matiere',matiere).eq('session',session).eq('year',year).maybeSingle();
        if (data?.intra !== null && data?.final === null) {
             setRead(true) 
             setdat(data)
            }
            else {
                setRead(false)
            }
              ;}
               getData()},[matiere])
    const handleSave= async ()=> {
        const {data , error } =  await supabase.from('exam')
        .select('final')
        .eq('student_id', id).eq('matiere',matiere).single();
        if (data?.final !== null) console.error('exist')
        
        const {error:status_error } =  await supabase.from('exam')
        .update([{final: note,}])
        .select('*')
        .eq('student_id',id).eq('matiere',matiere).eq('session',session).eq('year',year);
            if (status_error) console.error(status_error.message)
            else {
        console.log('saved')
        setRead(false)}
    }
    return(
        <div>
            {read ? <form action={handleSave} className="flex">
          <div className="w-40 pl-2 mr-3">{fullname[0]?.last_name} {fullname[0]?.first_name} </div> <div className="w-20 text-center">{dat?.intra}</div>
          <input type="number" value={note} max={100} min={0}
          className="w-20 border mr-3" onChange={(e)=>setNote(e.target.value)}/>
          <button>save</button>
        </form>: null}
        </div>
    )
}

export function teacherUpdate({session,id,matiere,year}:int){
    const [update,setUpdate] = useState('')
    const [update2,setUpdate2] = useState('')

    const handleUpdate= async ()=> {  
        const {error:status_error } =  await supabase.from('exam')
        .update([{intra: update, final: update2}])
        .select('*')
        .eq('student_id',id).eq('matiere',matiere).eq('session',session).eq('year',year);
            if (status_error) console.error(status_error.message)
            }
    return (
        <div>
            <input type="number" value={update} onChange={(e)=>setUpdate(e.target.value)}/>
            <input type="number" value={update2} onChange={(e)=>setUpdate2(e.target.value)}/>
            <button onClick={handleUpdate}></button>
        </div>
    )
}
export function ReadNote({session,year,id}:int){
    const [note,setNote] = useState<any[]>([])
    const [fullname,setFullname] = useState<any[]>([])

     useEffect(() => {
            const getData = async () => {
              const { data:stud, error:second } =  await supabase.from('student')
              .select('id,last_name,first_name').eq('id', id);
              if (second) console.error(second.message)
                else setFullname(stud)
              ;}
               getData()},[])
    useEffect(() => {
            const getData = async () => {
            const {data , error } =  await supabase.from('exam')
        .select('*')
        .eq('student_id', id).eq('session',session).eq('year',year)
        if (error) console.error(error.message)
            else setNote(data)
              ;}
               getData()},[])
    return(
        <div className="flex">
            {fullname[0]?.last_name} {fullname[0]?.first_name} 
            <div>
                {note.map((not,index)=>
            <ol key={not.id} className={`${colors[index % colors.length]} flex`}>
                <li className="w-30 mr-2 ml-2">{not.matiere}</li>
                <li className="w-10 mr-2 ml-2">{not.intra}</li>
                <li className="w-10 mr-2 ml-2">{not.final}</li>
                <li className="w-10 mr-2 ml-2">{not.year}</li>
                <li className="w-25 mr-2 ml-2">{not.faculty}</li>
            </ol>)}
            </div>
        </div>
    )
}