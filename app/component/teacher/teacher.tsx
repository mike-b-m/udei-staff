'use client'
import { supabase } from "../db";
import { useState, useEffect } from "react";
interface int{
    session: number |string | null 
    name: string
    matiere: string | null
    year: number | string | null
    id: number
}
const colors=[
 "bg-[#2DAE0D]/70",
 "bg-gray-200"
]
export default function TheacherInput({session,name,matiere,id,year}:int){
    const [note, setNote] = useState('')
    const [read,setRead] =useState(false)

     useEffect(() => {
            const getData = async () => {
            const {data , error } =  await supabase.from('exam')
        .select('*')
        .eq('student_id', id).eq('matiere',matiere).eq('session',session).eq('year',year).single();
        if (data !== null) {
            console.error('exist')
            }
            else setRead(true)
              ;}
               getData()},[])
    const handleSave= async ()=> {
        const {data , error } =  await supabase.from('exam')
        .select('*')
        .eq('student_id', id).eq('matiere',matiere).single();
        if (data?.matiere !== null) console.error('exist')

        const {error:status_error } =  await supabase.from('exam')
        .insert([{intra: note,matiere, session,year,student_id:id}])
        .select('*')
        .eq('student_id',id);
            if (status_error) console.error(status_error.message)
            else {
        console.log('saved')
        setRead(false)
    }
    }
    return(
        <div>
            {read ? <form action={handleSave} className="flex">
          <div className="w-40 pl-2 mr-3">{name}</div><input type="number" value={note} max={100} min={0}
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

     useEffect(() => {
            const getData = async () => {
            const {data , error } =  await supabase.from('exam')
        .select('*')
        .eq('student_id', id).eq('matiere',matiere).eq('session',session).eq('year',year).maybeSingle();
        if (data?.intra !== null && data?.final === null) {
             setRead(true) 
             setdat(data)
            }
            else console.error('exist')
              ;}
               getData()},[])
    const handleSave= async ()=> {
        const {data , error } =  await supabase.from('exam')
        .select('final')
        .eq('student_id', id).eq('matiere',matiere).single();
        if (data !== null) console.error('exist')
        
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
          <div className="w-40 pl-2 mr-3">{name}</div> <div className="w-20 text-center">{dat?.intra}</div>
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
        <div>
            {note.map((not,index)=>
            <ol key={not.id} className={`${colors[index % colors.length]} flex`}>
                <li className="w-30 mr-2 ml-2">{not.matiere}</li>
                <li className="w-10 mr-2 ml-2">{not.intra}</li>
                <li className="w-10 mr-2 ml-2">{not.final}</li>
                <li className="w-10 mr-2 ml-2">{not.year}</li>
            </ol>)}
        </div>
    )
}