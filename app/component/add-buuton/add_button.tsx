import { useState } from "react";
import Add_dept from "../add-dept/page";
import { supabase } from "../db";
import Input from "../input/input-comp";
interface add{
    id: number
    value: string
}
interface nam{
    value: string
    name: string
    id: number
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

export function Delete_button({id,value,name}:nam){
    const [open,setOpen] = useState(false)
    const [desable,setDisable]= useState(false)
    const [confirm,setConfirm] = useState('')
    const [cOpen,setCOpen] = useState(false)
    const [Error,setError] = useState('')
    const [opError,setOpError] = useState(false)
    const handleDelete= async ()=> {
        if(name === confirm){
            setDisable(true)
            const {error:status_error } =  await supabase.from(value)
             .delete()
  .eq('id', id)
  .select()

                if (status_error) console.error(status_error.message)
                else {
            console.log('saved')
            setOpen(!open)
            setTimeout(() => {setOpen(false)   
            }, 3000);
            setCOpen(false)
        }
        }
        else {
            setError(`vous n'avez pas confirmé la suppression`)
            setOpError(true)
            setTimeout(() => {setOpError(false) }, 2000);
            setCOpen(false)

        }
        }
    return(
        <div className="static">
            {/*error message */}
            {opError ? (<div className="fixed top-0 right-0 bg-red-100 p-7 text-red-600 flex border border-red-500 rounded-lg">
                        {Error}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 
  9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 
  0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 
  1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
</svg>
        </div> ) : ''}
            {/* set save  */}
                
                    {open ? (<div className="fixed top-0 right-0 bg-red-100 p-7 text-red-600 flex border border-red-500 rounded-lg">
                        supprimer avec succès
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 
  9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 
  0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 
  1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
</svg>

        </div> ) : ''}
            {/*delete button */}
             <button onClick={()=>setCOpen(true)} disabled={desable} className={`${desable ? "text-gray-500 text-[16px] size-10 pt-2 pl-2  text-center flex":"rounded-full text-red-500 text-[16px] hover:bg-red-900 hover:text-white size-10 pt-2 pl-2  text-center flex"}`} >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
</svg>
</button>
        {/* confirm section */}
        { cOpen ? <div className="fixed left-18 top-16 w-100 bg-gray-300 rounded-xl justify-items-center p-10 text-[20px]">
            <div className="mt-10 mb-2">
                Confirmer la suppression en écrivant ce nom <span className="font-bold">"{name}"</span>
            </div>
            <Input int={confirm} text="Confirmer"
                                 type="text" out={(e)=>setConfirm(e.target.value)} require={false}/>
             <button onClick={()=>setCOpen(false)} className="bg-gray-400 ml-5 rounded-2xl text-white text-[20px] hover:bg-gray-700 w-18.5 h-10">Cancel</button>
            <button onClick={handleDelete} className="bg-[#2DAE0D] ml-3 rounded-2xl text-white text-[20px] hover:bg-green-700 w-18.5 h-10">delete</button>
        </div>:null}
        </div>
    )
}
export function Update({id,value}:add){
    const [faculty,setFaculty] = useState(value)
    const [price, setPrice] = useState(Number)
    const [open,setOpen] = useState(false)
    const [load,setLoad] = useState (false)
    const [save,setSave]= useState(false)
//updade section
    const handleUpdate= async ()=> { 
        setLoad(true)
            const {error:status_error } =  await supabase.from('faculty_price')
             .update({faculty,price})
  .eq('id', id)
  .select()

                if (status_error) console.error(status_error.message)
                else {
            setSave(true)
            setTimeout(() => {setSave(false)
                
            }, 2000);
            console.log('saved')}
            setOpen(!open)
        }
        //delete section
        const handleDelete= async ()=> {
            const {error:status_error } =  await supabase.from('faculty_price')
             .delete()
  .eq('id', id)
  .select()

                if (status_error) console.error(status_error.message)
                else {
            console.log('saved')
            setOpen(!open)
        }
        }
        return(
            <div className="static  ">
                {/* set save  */}
                
                    {save ? (<div className="fixed inset bg-gray-100 p-7 text-green-600 flex border border-gray-500 rounded-lg">
                        save with succes
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                             className="size-6">
        <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 
        0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0
        0 1.15-.043l4.25-5.5Z" clipRule="evenodd" />
        </svg>
        </div> ) : ''}
                            
              

                {open ?
                <div className="absolute left-[50%] bg-gray-300 p-3 rounded-xl">
                    <Input int={faculty} type="text" text="faculté" 
                    out={(e)=>setFaculty(e.target.value)} require={false}/>

                    <Input int={price} type="number" text="prix (HTG)" 
                    out={(e:any)=>setPrice(e.target.value)} require={false}/>
                {/*button cancel and save*/}
                <button onClick={(e)=>setOpen(!open)}
               disabled={load} 
               className="bg-gray-600 rounded-2xl
             text-white text-[16px]
              hover:bg-gray-700 w-20 h-6 ml-3 m-3" >cancel
             </button> 
                <button onClick={handleUpdate}
                disabled={load} 
                className={`${load===false ? 'bg-[#2DAE0D] rounded-2xl text-white text-[16px] hover:bg-green-700' 
                :'bg-gray-700 rounded-2xl text-white' } w-20 h-6 ml-3`} >
                {load ? 'saving...' : 'save'}
                </button> 
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