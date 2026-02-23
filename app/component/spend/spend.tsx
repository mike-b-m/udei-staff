'use client'

import { supabase } from "../db";
import { useState,useEffect } from "react";
import Add_botton from "../add-buuton/add_button";
import Time from "../time/time";
type company ={
  id: number
  name: string
  date_time: string
  amount: string
  pay_method: string
  decribe_motive: string
}
const colors=[
 " bg-green-200",
 "bg-gray-200"
]
export default function Spend() {
  const [dat, setDat]= useState<company[]>([])
 
  useEffect(() => {
    const getData = async () => {
      const { data:comp, error } =  await supabase.from('spent_in_company').select('*');
    if (error) console.error(error)
      else setDat(comp)
    }; 
    getData()},[])
 
 
  return (
<>
<div className="mr-5 ml-1 w-[80%] justify-center">
  History 
   {/* filter query*/}
  <div>filter
    year
    month
  </div>
  <Add_botton/>
  {/* header for the list of spent */}
   <h3 className="text-center text-[20px]">Money spent</h3>
    <ol className="flex justify-between bg-gray-300 font-poppins rounded-t-xl border-b border-t border-gray-400">
    <div className="bg-gray-300 min-w-50 text-center "><li className="ml-5:">nom</li></div>
  <li className="bg-gray-300 min-w-50 text-center">montant</li>
  <li className="bg-gray-300 min-w-50 text-center">date</li>
  <li className="bg-gray-300 min-w-50 text-center">description</li>
  <li className="bg-gray-300 min-w-50 mr-5 text-center">mode de paiement</li>
  </ol>
  {/*list of company spent */}
  <div className="rounded-b-lg  bg-gray-200">
   {dat.map((compan,index)=>(
  <ol key={compan.id}   className={`flex justify-between text-center border-b border-gray-400 ${colors[index  % colors.length]}`}>
    <li className="min-w-50  border-b-0.5">{compan.name}</li>
  <li className=" min-w-50  border-b-0.5 ">HTG  {compan.amount}</li>
  <li className="min-w-50 border-b-0.5"><Time open={compan.date_time}/></li>
  <li className=" min-w-50  max-w-50  border-b-0.5">{compan.decribe_motive}</li>
  <li className="mr-5 min-w-50  border-b-0.5">{compan.pay_method}</li></ol>
))}</div>

<div className="text-center"> 0-10 <button>next</button></div>
</div>

</>
  )
}
