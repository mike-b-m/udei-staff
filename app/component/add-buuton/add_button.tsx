import { useState } from "react";
import Add_dept from "../add-dept/page";
export default function Add_botton(){
    const [open, setOpen]= useState(false)
    
    return(
        <>
        {open ? <div><Add_dept onOpen={()=>setOpen(false)}/></div> :
         <div className="text-right"><button className="bg-[#2DAE0D] rounded-2xl
             text-white text-[20px] hover:bg-green-700 w-25 h-8" onClick={(e)=>setOpen(true)}>add new</button></div>}
        </>
    )
}