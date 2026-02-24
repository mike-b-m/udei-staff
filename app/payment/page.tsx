'use client'
import { Price, Payments, Student_pay } from "@/app/component/add-payment/addpayment"
import { Suspense, useState } from "react"
export default function Pric(){
   const [open, setOpen] = useState(true)
   const [theOpen,setTheOpen] = useState(false)
   const [openpay,setOpenpay] = useState(false)

    return(
    <Suspense fallback={<div>chargement...</div>}>
 <div className="w-full shadow-lg border border-gray-400 rounded-2xl bg-gray-200">
         <div className="w-full border-b-3 border-white">
           <button className={`${open === true ?
             "bg-[#2DAE0D] rounded-2xl text-white text-[16px] hover:bg-green-700 w-20 h-6 m-3"
              : 'm-3' }`} onClick={()=>{
                setTheOpen(false)
                setOpen(true)
                setOpenpay(false)}}>price</button>

          <button  className={`${theOpen === true ?
             "bg-[#2DAE0D] rounded-2xl text-white text-[16px] hover:bg-green-700 w-50 h-6 m-3"
              : '' }`} onClick={()=>{
                setTheOpen(true)
                setOpen(false)
              setOpenpay(false)}}>student and balance</button>

                <button  className={`${openpay === true ?
             "bg-[#2DAE0D] rounded-2xl text-white text-[16px] hover:bg-green-700 w-50 h-6 m-3"
              : 'm-3' }`} onClick={()=>{
                setTheOpen(false)
                setOpen(false)
              setOpenpay(true)}}>payment</button>
         </div>
          {open ? <Price/>
            : theOpen ? <Student_pay/>
            : openpay ?  <Payments/> 
            : null}
        </div>
    </Suspense>   
    )
}