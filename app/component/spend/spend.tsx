'use client'

import { supabase } from "../db";
import { useState,useEffect } from "react";
import Add_botton from "../add-buuton/add_button";
import Time from "../time/time";
import ChartProgress from "../chart components/chartComponent";

type company ={
  id: number
  name: string
  date_time: string
  amount: string
  pay_method: string
  decribe_motive: string
}
const colors=[
  "bg-[#CAF0F8]/25 font-medium",
  "bg-[#90C3C8]/70 font-medium"
]
export default function Spend() {
  const [dat, setDat]= useState<company[]>([])
  const [year, setYear] =useState('2026-01-01 00:00:00')
  const [chart,setchart] = useState<company[]>([])
  const [interval,setInterval] = useState<any[]>([])

  const date= Date().split(' ')

  useEffect(() => {
    const getData = async () => {
      const { data:comp, error } =  await supabase.from('spent_in_company').select('*')
      .gte('date_time', year)
      .order('date_time', { ascending: false });
    if (error) console.error(error)
      else setDat(comp)
    
    const { data:com, error:Error } =  await supabase.from('spent_in_company').select('*')
      .gte('date_time', year)
      .order('date_time', { ascending: true });
    if (Error) console.error(Error)
      else setchart(com)
   
    const { data:co, error:Erro } =  await supabase.from('spent_in_company').select('amount,id')
      .gte('date_time', `${date[3]}-01-01`).lte('date_time', `${date[3]}-12-31`)
      .order('date_time',  { ascending: true });
    if (Erro) console.error(Erro.message)
      else setInterval(co)
    }; 
    getData()},[])
 
 
  return (
<>
<div className="w-full justify-center">
    <div className="flex justify-center bg-gray-200 p-4 mb-4 rounded-sm">
       <ChartProgress data={chart}/>
      <div className="w-60 h-30 text-center bg-gray-100/50 m-10 p-3 shadow-lg outline
       outline-[#2DAE0D] rounded-sm text-[16px] font-bold text-gray-800 flex flex-col">
        <div className="font-medium text-[20px] pt-3">HTG {interval.reduce((accumulator : number, currentItem) => accumulator + Number(currentItem.amount), 0)} </div>
        dépenser pour cette année</div>
    </div>
   {/* filter query*/}
  <div className="bg-gray-200 p-4 rounded-sm mb-2">
    <select onChange={(e)=>setYear(e.target.value)} disabled>
      <option value="2027-01-01 00:00:00">2027</option>
      <option value="2026-01-01 00:00:00">2026</option>
      <option value="2025-01-01 00:00:00">2025</option>
      <option value="2024-01-01 00:00:00">2024</option>
      <option value="2023-01-01 00:00:00">2023</option>
    </select>
  </div>
  <Add_botton/>
  <div className="rounded-xl border-4 pb-0.1 mt-3 border-gray-500 bg-gray-200">
    {/* header for the list of spent */}
   <h3 className="text-center text-[20px]">Argent dépensé</h3>
    <ol className="flex justify-between bg-gray-300 font-poppins border-b border-t border-gray-400">
    <div className="bg-gray-300 min-w-50 text-center "><li className="ml-5:">nom</li></div>
  <li className="bg-gray-300 min-w-50 text-center">montant</li>
  <li className="bg-gray-300 min-w-50 text-center">date</li>
  <li className="bg-gray-300 min-w-50 text-center">description</li>
  <li className="bg-gray-300 min-w-50 mr-5 text-center">mode de paiement</li>
  </ol>
  {/*list of company spent */}
  <div className="rounded-b-lg  bg-gray-200">
   {dat.map((compan,index)=>(
  <ol key={compan.id}   className={`flex justify-between text-center w-full  border-b-2 border-gray-400 ${colors[index  % colors.length]}`}>
    <li className={`min-w-50  border-b-0.5`}>{compan.name}</li>
  <li className={`min-w-50  border-b-0.5`}>HTG  {compan.amount}</li>
  <li className={`min-w-50 border-b-0.5`}><Time open={compan.date_time}/></li>
  <li className={`min-w-50  max-w-50  border-b-0.5`}>{compan.decribe_motive}</li>
  <li className={`mr-5 min-w-50  border-b-0.5`}>{compan.pay_method}</li></ol>
))}</div>
  </div>
</div>

</>
  )
}
