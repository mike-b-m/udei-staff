'use client'
import {useState, useEffect} from "react";
import Image from "next/image";
import Link from "next/link";
import {supabase} from "../db";
import { UUID } from "crypto";
import { redirect, usePathname } from "next/navigation";

type prof = {
  id: UUID
  full_name: string
  role: string

}

export default function Header(){
    const [user,setUser]= useState<any | null>(null)
    const [profiles, setProfiles] = useState<any| null>(null)
    const [open, setOpen] = useState (false)
     const [ses, setSes] =useState <any>()
     const [tOpen,setTOpen] = useState (true)
    const pathname = usePathname()
    const signOutall = async () => {
  
            const {error} = await supabase.auth.signOut()
          if (!error)  window.location.reload();}
     useEffect(() => {
        const getData = async () => {
          const { data:{session}, error } =   await supabase.auth.getSession();
        if (session){
          const { data:{user}, error } =   await supabase.auth.getUser();
          if (error) console.log('Error',error.message);
          
          else {
            setUser(user)
            setSes(session)
          }
           const { data,} = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id).maybeSingle();
    if (error) console.error(error.message)
    setProfiles(data)
        }
        if (!session && pathname !== '/login') redirect('/login')
        if (!session) 
          {
            setTOpen(false)
            console.error('not session find')
          }
        else if (error) console.error(error?.message);
        //else setUser(user)
        }; 
        getData()},[])

    return(
        <div className="flex justify-between">
        <div className="flex justify-between  m-3 ml-10 static">
            <Link href="/"><Image
         src="/image/logo.png"
      width={150}
      height={150}
      alt="logo"/></Link></div>
      {/*profil section */}
       
       
           {open ? (<div className="absolute bg-gray-100 text-center border rounded-2xl top-2 inset-x-135  p-1 border-gray-400">

             <div className="text-[16] pb-2">
              <div className="flex justify-between">
                <Image
         src="/profil.png"
      width={30}
      height={30}
      className="m-1 top-0 left-0 size-8"
      alt="user profil"/>
      <div><div className="text-[14px] ">{profiles?.full_name}</div>
      <div className="text-[12px] ">{user?.email}</div>
        </div>
        {/*button */}
             <button onClick={()=>setOpen(!open)}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
        strokeWidth="1.5" stroke="currentColor" className="size-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
    </svg>

  </button>  </div>
        <div className="text-[16px] pt-2 border-t  border-gray-400 ">
        Role: {profiles?.role}
       <div className="text-[16px] pt-2 border-t  border-gray-400 ">
        <button onClick={signOutall}>log out</button></div>
           </div>
       </div>
        </div>)
       
      : tOpen ?
       (<div className="flex border rounded-2xl max-w-25 min-w-20 max-h-10 mt-2 justify-between p-1 border-gray-400"><Image
         src="/profil.png"
      width={30}
      height={40}
      alt="user profil"/>
      <button onClick={()=>setOpen(!open)}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
        viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg>
</button></div>) 
         :
null}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 mr-10">
  <path fillRule="evenodd" d="M3 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 5.25Zm0 4.5A.75.75 0 0 1 3.75 9h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 9.75Zm0 4.5a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Zm0 4.5a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
</svg>
      </div>)
}