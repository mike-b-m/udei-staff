'use client'
import { useState} from "react";
import { supabase } from "../component/db";
import Input from "../component/input/input-comp";
import Image from "next/image";

export default function Login(){
    const [email, setEmail]= useState('')
    const [password, setPassword] = useState('')
    const [load,setLoad] = useState(false)
    const [error, setError] =useState(true)
    const [mess,setMess] = useState('')

    const sign = async (e:any)=> {
       e.preventDefault()
       setError(false)
       setLoad(true)
      const {error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  })
  if (error) {
    console.error(error.message) 
    setError(true)
    setMess(error.message)
    setLoad(false)
  }
  else window.location.href = '/'
}        
return(
    <div className=" flex border-2 rounded-4xl border-gray-300  bg-gray-200 shadow-lg">
      <div className="rounded-full">
        <Image
               src="/04 - Copy.bmp"
            width={100}
            height={100}
            className="size-100 rounded-br-[50%] shadow-lg rounded-l-4xl border-2 border-gray-100"
            alt="user profil"/>
      </div>
    <form onSubmit={sign} className="flex flex-col pr-4 rounded-2xl  justify-items-center  mt-10">
      <div className="flex justify-center">
        <Image
               src="/logos.svg"
            width={100}
            height={100}
            className="m-1 size-25"
            alt="user profil"/>
      </div>
      <div className="ml-6">
      {error ? (<div className="text-red-600 text-[14px] flex">
                        {mess}
        </div> ) : ''}
      </div>
      <Input out={(e)=>setEmail(e.target.value)} int={email} type="text" text="email" require={false}/>
      <Input out={(e)=>setPassword(e.target.value)} int={password} type="password" text="password" require={false}/>
        <div className="text-center mt-4"> <button type="submit" 
         className={`${load ? 'bg-gray-600 rounded-2xl text-white text-[20px] w-40 h-8'
          : 'bg-[#2DAE0D] rounded-2xl text-white text-[20px] hover:bg-green-700 w-40 h-8' }`}
           disabled={load}>{load ? 'connexion...' : 'connecter' }
           </button></div>
    </form>
    <div>
    </div>
    </div>
)}