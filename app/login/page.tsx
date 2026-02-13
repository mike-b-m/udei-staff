'use client'
import { useState} from "react";
import { supabase } from "../component/db";
import Input from "../component/input/input-comp";
import Image from "next/image";

export default function Login(){
    const [email, setEmail]= useState('')
    const [password, setPassword] = useState('')
    const sign = async (e:any)=> { e.preventDefault()
      const {error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  })
  if (error) console.error(error.message) 
  else window.location.href = '/'
}        
return(
    <>
    <form onSubmit={sign} className="flex flex-col bg-gray-200 p-10 rounded-2xl justify-items-center ">
      <div className="flex justify-center">
        <Image
               src="/logos.svg"
            width={100}
            height={100}
            className="m-1 size-25"
            alt="user profil"/>
      </div>
      <Input out={(e)=>setEmail(e.target.value)} int={email} type="text" text="email"/>
      <Input out={(e)=>setPassword(e.target.value)} int={password} type="password" text="password"/>
        <div className="text-center mt-4"> <button type="submit" 
         className="bg-[#2DAE0D] rounded-2xl
             text-white text-[20px] hover:bg-green-700 w-25 h-8">connect</button></div>
    </form>
    <div>
    </div>
    </>
)}