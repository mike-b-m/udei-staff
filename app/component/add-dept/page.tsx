'use client'
import { useState} from "react";
import { supabase } from "../db";
import Input from "../input/input-comp";

interface prop {
  //open: boolean
  onOpen:()=> void
}
export default function Add_dept({onOpen}:prop){
     const [name, setName]= useState('')
  const [amount, setAmount]=useState('')
  const [decribe_motive, setDicribe_motive]= useState('')
  const [pay_method, setPay_method]= useState('')
  const [date_time, setDate_time]= useState('')

  {/*handle submit  */}
   const HandleSubmit = async (e:any) => {
    e.preventDefault()
            const {data, error} = await supabase.from('spent_in_company')
            .insert([{date_time, amount, name, pay_method, decribe_motive}]).select();
    if (error) {
  console.error('Error:', error.message);
} else {
  console.log('Saved:', data);
onOpen()
}}


return(
    <div>
  <form onSubmit={HandleSubmit} className="flex justify-between m-2">
    <div>
       <Input int={name} text="Nom"
                           type="text" out={(e)=>setName(e.target.value)}/>
         <Input int={amount} text="Montant (HTG)"
                             type="text" out={(e)=>setAmount(e.target.value)}/>
                  </div>
                  <textarea className="mt-2.5 py-2 px-4 focus:outline-none
                  rounded-xl placeholder:text w-[15%] bg-gray-300"
                  placeholder="Description" value={decribe_motive} onChange={(e)=> setDicribe_motive(e.target.value)} />

    {/*the date section */}
     <Input int={date_time} text="Date"
                         type="date" out={(e)=>setDate_time(e.target.value)}/>
          
    {/*select the method of payment */}
    <div>
      <label>Method</label>
    <select className="py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-full bg-gray-300"
                  value={pay_method} onChange={(e)=>setPay_method(e.target.value)}>
                    <option>Option</option>
                    <option>cash</option>
      <option>moncash</option>
      <option>bank tranfer</option>
      <option>natcash</option></select>
    </div>
      <button className="bg-gray-200 rounded-2xl
             text-gray-800 text-[20px] hover:bg-gray-300 w-25 h-8" onClick={onOpen}>cancel</button>
    <button type="submit" className="bg-[#2DAE0D] rounded-2xl
             text-white text-[20px] hover:bg-green-700 w-25 h-8">save</button>
  </form>
</div>
)
}