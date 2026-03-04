'use client'
import { supabase } from "../db";
import { useState, useEffect } from "react";
import Time from "../time/time";
const colors=[
 "bg-[#2DAE0D]/70",
 "bg-gray-200"
]
export default function SignUp(){
    const [email,setEmail]= useState('')
    const [password, setPassword]= useState('')
    const [phone,setPhone]= useState('')
    const [fullname, setFullname] = useState ('')
    const [role , setRole] =useState('')
   //program
   const [filter,setFilter] =useState<string[]>([])
   const [faculty,setFaculty] = useState('')
   const [session,setSession] = useState('')
   const [year,setYear] = useState('')
   const [read,setRead] =useState<any[]>([])
   //loading
   const [load,setLoad] = useState(false)
   const [save,setSave] = useState(false)
   const [error,setError] = useState('')

       useEffect(() => {
              const getData = async () => {            
           const { data:pr, error:theErr } = await supabase
    .from('profiles')
    .select('*');
          if (theErr) console.error(theErr.message)
          else setRead(pr)
  
              }; 
              getData()},[])

    const HandleCreate = async (e:any) => {
    e.preventDefault()
    setLoad(true)
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
  setLoad(false)
  setError(error.message)
  setTimeout(() => {setError('')  }, 2000);
} else {
  console.log('Saved:', data);
  setLoad(false)
  setSave(true)
  setTimeout(() => {setSave(false)   
            }, 2000);

    };}
return(
    <div >
      {/* set error message  */}
                    {error ? (<div className="fixed inset top-0 bg-red-100 p-7 text-red-500 flex border border-gray-500 rounded-lg">
                        Error: {error}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 
  9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06
   1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06
    12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
</svg>
        </div> ) : ''}
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

    <form onSubmit={HandleCreate} className="bg-gray-200 pl-20 mt-3 rounded-xl pb-5">
      <h2 className="text-center font-poppins font-medium m-2 text-[20px]">Créer un compte pour le personnel</h2>
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
        <option>admistration</option>
        <option>prof</option>
    </select>

    
    <button  className={`${load === false ? "bg-[#2DAE0D] rounded-4xl text-white text-[20px] hover:bg-green-700 w-20 h-10" 
             : "bg-gray-700 rounded-4xl text-white text-[20px] hover:bg-green-700 w-30 h-10"}`} disabled={load}>{load ? 'creating...' : 'create'}</button>
    </form>

    <div className="bg-gray-200 mt-3 rounded-xl">
      <h3 className="text-center">account created</h3>
      <div className="flex justify-between">
        <div className="w-50">Nom et Prénom</div>
        <div className="w-50">role</div>
        <div className="w-50">date</div>
      </div>
      {read.map((rea,index)=>
      <ol key={rea.full_name} className={`flex justify-between border-b-5 border-white ${colors[index % colors.length]}`}>
      <li className="w-50">{rea.full_name}</li>
      <li className="w-50">{rea.role}</li>
      <li className="pr-15"><Time open={rea.created_at}/></li>
      </ol>)}
    </div>
    </div>
    )
    }