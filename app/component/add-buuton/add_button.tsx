import { useState } from "react";
import Add_dept from "../add-dept/page";
import { supabase } from "../db";
import Input from "../input/input-comp";
interface add{
    id: number
    value: string
}
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
export function Update({id,value}:add){
    const [faculty,setFaculty] = useState(value)
    const [price, setPrice] = useState(Number)
    const [open,setOpen] = useState(false)
    const handleUpdate= async ()=> {
            const {error:status_error } =  await supabase.from('faculty_price')
             .update({faculty,price})
  .eq('id', id)
  .select()

                if (status_error) console.error(status_error.message)
                else {
            setOpen(!open)
            console.log('saved')}
        }
        const handleDelete= async ()=> {
            const {error:status_error } =  await supabase.from('faculty_price')
             .delete()
  .eq('id', id)
  .select()

                if (status_error) console.error(status_error.message)
                else {
            setOpen(!open)
            console.log('saved')}
        }
        return(
            <div className="static  ">
                {open ?
                <div className="absolute left-[50%] bg-gray-300 p-3 rounded-xl">
                    <Input int={faculty} type="text" text="faculté" 
                    out={(e)=>setFaculty(e.target.value)}/>

                    <Input int={price} type="number" text="prix (HTG)" 
                    out={(e:any)=>setPrice(e.target.value)}/>
                <button onClick={(e)=>setOpen(!open)}
               className="bg-gray-600 rounded-2xl
             text-white text-[16px]
              hover:bg-gray-700 w-20 h-6 ml-3 m-3" >cancel
             </button> 
                <button onClick={handleUpdate} className="bg-[#2DAE0D] rounded-2xl
             text-white text-[16px] hover:bg-green-700 w-20 h-6 ml-3" >save</button> 
                </div>
              : <div className="flex m-1">
                <button onClick={(e)=>setOpen(true)}
               className="bg-[#2DAE0D] rounded-2xl
             text-white text-[16px] hover:bg-green-700 w-full h-6 ml-3 flex pl-2 pr-2" >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 
  1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
</svg> modifier
             </button>
              {/*delete button */}
             <button onClick={handleDelete} className="bg-red-600 rounded-2xl
             text-white text-[16px] hover:bg-red-900 w-full h-6 ml-3 pl-3 pr-3 flex" >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
</svg>
delete</button> 
              </div> 
              }
            </div>
           
        )
}