'use client'
import { useState, useEffect } from "react";
import { supabase } from "../component/db";
import { useSearchParams } from "next/navigation";
import Pay from "../component/add-payment/addpayment";
type pay = {
    id: number
    student_id: number
    payment_history: string
    amount: number
    balance: number
    faculty: string
    price: number
}
type user = {
    first_name: string
    last_name: string
}
export default function Payment(){
    const [payment, setPayment]= useState<pay[]>([])
    const [student, setStudent] = useState<user[]>([])
    const searchpara = useSearchParams()
    const search =  searchpara.get('id')
     useEffect(() => {
        const getData = async () => {
          const { data:comp, error } =  await supabase.from('student_payment').select('*')
          .eq('student_id', `53`);
        if (error) console.error(error.message)
          else {
      const { data:com, error:status_error } =  await supabase.from('student').select('last_name, first_name')
          .eq('id', `53`);
          setPayment(comp)
        if (status_error) console.error(status_error.message)
        else setStudent(com) }
        }; 
        getData()},[])
    return(
        <div className="bg-amber-300 w-50 ">
            {payment.map((pay)=>
            <ol key={pay.id} className="flex justify-between">
            <Pay id={pay.id} price={pay.price} amount={pay.amount} history={pay.payment_history}/>
            <li>h{pay.payment_history}
            </li>
            <li>b{pay.balance}</li>
            <li>{pay.faculty}</li>
            <li>a{pay.amount}</li>
            <li>{pay.price}</li>
            </ol>)}
        </div>
    )
}