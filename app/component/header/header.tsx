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
    const [user,setUser]= useState<any>()
    const [profiles, setProfiles] = useState<prof[]>([])
    const [open, setOpen] = useState (false)
     const [ses, setSes] =useState <any>()
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
    .eq('id', user?.id).single();
    if (error) console.error(error.message)
    setProfiles(data)
        }
        if (!session && pathname !== '/login') redirect('/login')
        if (!session) console.error('not session find')      
        else if (error) console.error(error?.message);
        //else setUser(user)
        }; 
        getData()},[])

    return(
        <>
        <div className="flex justify-between  m-3 ml-10 ">
            <Link href="/"><Image
         src="/image/logo.png"
      width={150}
      height={150}
      alt="logo"/></Link>
      {/*profil section */}
        {ses ? <div className='static'>
       
           {open ? <div className="absolute bg-gray-100 text-center border rounded-2xl  p-1 border-gray-400">

             <div className="flex text-[16] pb-2"><Image
         src="/profil.png"
      width={30}
      height={30}
      className="m-1 size-8"
      alt="user profil"/>
      <div className="">{profiles?.full_name}
        <div className="text-[12px] ">{user?.email}</div>
      </div>
       <div className="justify-right w-full"><button onClick={()=>setOpen(!open)}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
        strokeWidth="1.5" stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
</svg>

</button></div>
       </div>

       <div className="text-[16px] pt-2 border-t  border-gray-400 ">Role: {profiles?.role}</div>
       <div className="text-[16px] pt-2 border-t  border-gray-400 "><button onClick={signOutall}>log out</button></div>
           </div>
      :
       <div className="flex border rounded-2xl w-20 justify-between p-1 border-gray-400"><Image
         src="/profil.png"
      width={30}
      height={40}
      alt="user profil"/>
      <button onClick={()=>setOpen(!open)}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
        viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg>
</button></div> 
}</div> : null}

        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 mr-10">
  <path fillRule="evenodd" d="M3 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 5.25Zm0 4.5A.75.75 0 0 1 3.75 9h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 9.75Zm0 4.5a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Zm0 4.5a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
</svg>

</div>
        </>
    )
}