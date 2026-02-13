'use client'
import { supabase } from "../db";
import { useState } from "react";

export default function SignUp(){
    const [email,setEmail]= useState('')
    const [password, setPassword]= useState('')
    const [phone,setPhone]= useState('')
    const [fullname, setFullname] = useState ('')
    const [role , setRole] =useState('')
   
    const HandleCreate = async (e:any) => {
    e.preventDefault()
            const {data, error} = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      full_name: fullname,
      role: role,
      phone: phone,
    }
  }
});
    if (error) {
  console.error('Error:', error.message);
} else {
  console.log('Saved:', data);

    };}
return(
    <>
    <form onSubmit={HandleCreate}>
      <h2>Créer un compte pour le personnel</h2>
        <input type="text" placeholder="fullname" 
        className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] bg-gray-300"
                  value={fullname} onChange={(e)=>setFullname(e.target.value)} />
        <input type="email" placeholder="email"  value={email} className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] bg-gray-300"
                   onChange={(e)=>setEmail(e.target.value)}/>
        <input type="password" placeholder="password" value={password} 
        className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] bg-gray-300" onChange={(e)=>setPassword(e.target.value)}/>
        <input type="text" placeholder="phone" className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] bg-gray-300"
                   value={phone} onChange={(e)=>setPhone(e.target.value)}/>
    
    {/*sectoin access of role */}
    <label htmlFor=""></label>
    <select className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] bg-gray-300" onChange={(e)=>setRole(e.target.value)}>
        <option>role</option>
        <option>admin</option>
        <option>editor</option>
    </select>
    <button className="bg-[#2DAE0D] rounded-2xl
             text-white text-[20px] hover:bg-green-700 w-25 h-8">create</button>
    </form>
    </>
    )
    }