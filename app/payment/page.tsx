'use client'
import { Price, Payments, Student_pay } from "@/app/component/add-payment/addpayment"
import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation";
export default function Pric(){
   const [open, setOpen] = useState(true)
   const [theOpen,setTheOpen] = useState(false)
   const [openpay,setOpenpay] = useState(false)

    return(
    <Suspense fallback={<div>chargement...</div>}>
 <div className="w-full min-h-120 pb-5 shadow-lg border border-gray-400 rounded-2xl bg-gray-200 mt-3">
         <div className="w-full border-b-3 border-white">
           <button className={`${open === true ?
             "text-[#2DAE0D] text-[18px]  border-b-2 w-20 h-8 hover:border-b-2 hover:text-green-800 m-3 transition duration-150 ease-in-out"
              : 'm-3 hover:border-b-2 hover:text-green-800 m-3 transition duration-150 ease-in-out' }`} onClick={()=>{
                setTheOpen(false)
                setOpen(true)
                setOpenpay(false)}}>Prix</button>

          <button  className={`${theOpen === true ?
             "text-[#2DAE0D] text-[18px]  border-b-2  w-50 h-8 m-3"
              : 'hover:border-b-2 hover:text-green-800 m-3 transition duration-150 ease-in-out' }`} onClick={()=>{
                setTheOpen(true)
                setOpen(false)
              setOpenpay(false)}}>étudiant et balance</button>

                <button  className={`${openpay === true ?
             "text-[#2DAE0D] text-[18px]  border-b-2  w-23 h-8 m-3"
              : 'm-3 hover:border-b-2 hover:text-green-800 m-3 transition duration-150 ease-in-out' }`} onClick={()=>{
                setTheOpen(false)
                setOpen(false)
              setOpenpay(true)}}>paiement</button>
         </div>
          {open ? <Price/>
            : theOpen ? <Student_pay/>
            : openpay ?  <Payments/> 
            : null}
        </div>
    </Suspense>   
    )
}