'use client'
import { supabase } from "../db";
import { useState, useEffect } from "react";
import Notation from "../notation/notation";
interface int{
    session: number |string | null 
    name: string | number
    matiere: string | null
    year: number | string | null
    id: number
    faculty: string | null
}
interface rep{
    session: number |string | null 
    not:number
    name: number
    matiere: string | null
    year: number | string | null
    id: number
    faculty: string | null
    nbr: number
}
interface note{
    intra: number
    final: number 
    repri_final: number
    repri_intra: number
}
const colors=[
  "bg-[#CAF0F8]/25 font-medium",
  "bg-[#90C3C8]/70 font-medium"
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

export  function RepriseInput({session,not,matiere,name,nbr,id,year}:rep){
    const [note, setNote] = useState('')
    const [read,setRead] =useState(false)
    const [dat,setdat] = useState<any>()
    const [fullname,setFullname] = useState<any[]>([])
    const [dis,setDis] = useState(false)

     useEffect(() => {
            const getData = async () => {
              if (not <= 65 && not >= 50 && !name || not <= 65 && not >= 50 && name >= 50 && name < 65 ) {
                setDis(false)
              }
              else setDis(true)
              ;}
               getData()},[])
               
    useEffect(() => {
            const getData = async () => {
            const {data , error } =  await supabase.from('exam')
        .select('*')
        .eq('student_id', id).eq('matiere',matiere).eq('session',session).eq('year',year).maybeSingle();
        if (data?.intra !== null && data?.final === null) {
             //setRead(true) 
             setdat(data)
            }
            else {
                //setRead(false)
            }
              ;}
               getData()},[matiere])

    const handleSave= async ()=> {    
        if (nbr ===1){
            const {error:status_error } =  await supabase.from('exam')
        .update([{repri_intra: note}])
        .select('*')
        .eq('id',id)
            if (status_error) console.error(status_error.message)
            else {
        console.log('saved')
        setRead(false)}}
        else if (nbr===2){
           const {error:status_error } =  await supabase.from('exam')
        .update([{repri_final: note}])
        .select('*')
        .eq('id',id)
            if (status_error) console.error(status_error.message)
            else {
        console.log('saved')
        setRead(false)} 
        }
    }
    return(
        <div className="text-center">
            <button  disabled={dis} onClick={()=>setRead(!read)}>{not <= 65 && not >= 50 && !name  ? 
            <div className="text-red-500 font-bold">ajouter</div> :
             <span className={`${name < 65 && name >= 50 ? 'text-red-600':''}`}>{name}</span>}</button>
            {read ? <form action={handleSave} className="flex">
          <input type="Reprise" value={note} max={100} min={0}
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
            <div className="w-33 ml-2">{fullname[0]?.last_name} {fullname[0]?.first_name} </div>
            <div>
                {note.map((not,index)=>
            <ol key={not.id} className={`${colors[index % colors.length]} flex`}>
                <li className="w-30 mr-2 ml-2">{not.matiere}</li>
                <li className="w-10 mr-2 ml-2">{not.intra}</li>
                <li className="w-13 mr-2 ml-2">
                    <RepriseInput nbr={1} session={not.session} id={not.id} faculty={''} year={not.year} matiere={not.matiere} not={not.intra} name={not.repri_intra} /></li>
                <li className="w-10 mr-2 ml-2">{not.final}</li>
                <li className="w-13 mr-2 ml-2">
                     <RepriseInput nbr={2} session={not.session} id={not.id} faculty={''} year={not.year} matiere={not.matiere} not={not.final} name={not.repri_final} />
                </li>
                <li className="w-15 m-2">
                    <CalculSession final={not.final} intra={not.intra} repri_final={not.repri_final} repri_intra={not.repri_intra}/>
                </li>
                {/* <li className="w-10 mr-2 ml-2">{not.year}</li>
                <li className="w-25 mr-2 ml-2">{not.faculty}</li> */}
            </ol>)}
             <ol className={`flex`}>
                <li className="w-30 mr-2 ml-2">
             Total
                    </li>
                <li className="w-10 mr-2 ml-2">
             {note?.reduce((accumulator : number, currentItem:any) => accumulator + Number(currentItem.intra), 0)}
                    </li>
                    <li className="w-13 m-2"></li>
                <li className="w-10 mr-2 ml-2">
             {note?.reduce((accumulator : number, currentItem:any) => accumulator + Number(currentItem.final), 0)}
                    </li>
            </ol>
            </div>
            <ol className="flex">
                 <li className="w-10 mr-2 text-center">{note[0]?.year}</li>
                <li className="w-30  text-center">{note[0]?.faculty}</li>
                 <li className="w-25 mr-2 text-center ">{note[0]?.session}</li>
            </ol>
        </div>
    )
}

export function ReadNote2({session,year,id}:int){
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
            <div className="w-50 m-2">{fullname[0]?.last_name} {fullname[0]?.first_name} </div>
            <div>
                {note.map((not,index)=>
            <ol key={not.id} className={`${colors[index % colors.length]} flex`}>
                <li className="w-50 mr-2 ml-2">{not.matiere}</li>
                <li className="w-10 mr-2 ml-2 text-center">{not.intra}</li>
                <li className="w-10 mr-2 ml-2 text-center">{not.final}</li>
                {/* <li className="w-10 mr-2 ml-2 text-center"><Notation id={((not.final + not.intra)/2)} /> </li> */}
            </ol>)}
             <ol className={`flex`}>
                <li className="w-50 mr-2 ml-2">
             Total
                    </li>
                <li className="w-10 mr-2 ml-2 text-center">
             {note?.reduce((accumulator : number, currentItem:any) => accumulator + Number(currentItem.intra), 0)}
                    </li>
                <li className="w-10 mr-2 ml-2 text-center">
             {note?.reduce((accumulator : number, currentItem:any) => accumulator + Number(currentItem.final), 0)}
                    </li>
            </ol>
            </div>
        </div>
    )
}
export function CalculSession({intra,final,repri_final,repri_intra}:note){
 const [fin,setFin] = useState(Number)
 const [int,setInt] = useState(Number)

 useEffect(() => {
            const getData = async () => {
              if (intra > repri_intra) setInt(intra)
                else if(intra< repri_intra) setInt(repri_intra)
            if (final > repri_final) setFin(final)
                else if (final< repri_final) setFin(repri_final)
              ;}
               getData()},[])

    return(
        <div className="text-center">
            {(fin + int)/2}
             {/* {note?.reduce((accumulator : number, currentItem:any) => accumulator + Number(currentItem.intra), 0)} */}
        </div>
    )
}