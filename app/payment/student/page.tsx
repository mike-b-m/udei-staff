'use client'
import { supabase } from "@/app/component/db";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Student_pay } from "@/app/component/add-payment/addpayment";
type user = {
    id: number
    first_name: string
    last_name: string
    faculty: string
}
type st={
    balance: string
}
type ide={
    id: number
}
const colors=[
 "bg-[#2DAE0D]/70",
 "bg-gray-200"
]
 function Stu({id}:ide){
    const [du,setDu] =useState<st[] | any>()
     useEffect(() => {
            const getData = async () => {
              
          const { data, error:status_error } =  await supabase.from('student_payment').select('balance')
              .eq('student_id', id).single();
              
            if (status_error) console.error(status_error.message)
                else setDu(data)
            }; 
            getData()},[])
            return (
                <div>HTG {du?.balance}</div>
            )
 }
export default function student_pa(){
    const [student,setStudent] = useState<user[]>([])

   

    return(
        <div>
            <Student_pay/>
        </div>      
    )
}