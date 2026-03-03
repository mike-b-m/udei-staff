'use client'
import { useState,useEffect } from "react";
import { supabase } from "../db";
interface date{
    one: number | string
    third: string
    out: (e:any)=> void
}
export function Code({one,third,out}:date){
    const [list,setList] =useState(0)
    //const [code,setcode]= useState('')
    const time =  Date().split(' ')

    // if (third=== 'Gestion des affaires' || 
    //     third=== `Jardin d'enfant` 
    //     || third=== `Sciences de l'Education`)
    useEffect(() => {
        const getData = async () => {
            const { data:comp, error } =  await supabase.from('student').select('id')
            .gte('enroll_date', '2024-01-01')
            .lte('enroll_date', '2027-01-01')
            ;
            if (error) console.error(error.message)
                else setList(comp.length) 
        };
        getData()},[]) ;
        const time2 = time[3]
       const code= third.split(' ')
       const code3= code[1]
      const code4=code3?.[0] || ''
       const code2 = code[0][0]

//out(list)
out(`F${code2}${code4}-${time2[2]+time2[3]}-${list.toString().padStart(4, "0")}`)
    return(
        <div>
            {/* <input type="text" onChange={(e)=> out(e)} />
            <input type="text" value={one} onChange={()=> out(` F${code2}${code4}-${time2[2]+time2[3]}-${list.toString().padStart(4, "0")}`)} />
            F{code2}{code4}-{time2[2]+time2[3]}-{list.toString().padStart(4, "0")} */}
        </div>
    )
}