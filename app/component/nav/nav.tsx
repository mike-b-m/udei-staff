'use client'
import { useState, useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "../db";
import Image from "next/image";

export default function Nav(){
    const [ses, setSes] =useState<any>()
    const [role,setRole] = useState<any>([])
    const [hover,setHover] = useState(false)
     const pathname = usePathname()
      useEffect(() => {
             const getData = async () => {
               const { data:{session}, error } =   await supabase.auth.getSession();
             if (session)setSes(session)

                //user role
                const { data:{user}, error:theError } =   await supabase.auth.getUser();
          if (theError) console.log('Error',theError.message);
          
          else {
           const { data,} = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id).maybeSingle();
    if (error) console.error(error.message)
    else setRole(data)
          }
             }; 
             getData()},[])
    return(
        <>
        <Suspense fallback={<div>chargement...</div>}>
            
        {/*link for site */}
         {ses ? <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} 
         className={`border-r-2 ${hover ? 'xl:w-50':null} border-b-2 bg-white border-gray-300 top-0 left-0 text-[20px] text-center
         xl:min-w-[75px] xl:min-h-100`}>
    <ul className=" h-[80%] ">
        {/* home section nav */}
       {role.role ==='admin' ? 

       <Link className="pl-3 " href="/"><li className={`m-2 ${hover ? 'w-[90%]':null} text-center rounded-2xl pl-3 
         flex ${pathname === '/' ? 'bg-[#2DAE0D] border-b-[4px] font-bold border-[#137737] text-white rounded-[8px]'
         :'hover:bg-[#137737] hover:text-white rounded-[8px]'} w-14`}>
           <svg xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`size-8 ${hover ? 'mr-2':null}`}>
  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 
  1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 
  1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
</svg>
{hover ? 'home' :null}</li></Link> :null}
            
       {role.role === 'admin' || role.role === 'editor' ?    <Link className="pl-3" href="/inscription">
        <li className={`m-2 ${hover ? 'w-[90%]':null} text-center rounded-2xl flex
             ${pathname === '/inscription' ? 'bg-[#2DAE0D] border-b-[4px] font-bold border-[#137737] text-white rounded-[8px]'
             :'hover:bg-[#137737] hover:text-white rounded-[8px]'} w-13`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
            strokeWidth={1.5} stroke="currentColor" className={`size-8 pl-2 ${hover ? 'mr-2':null}`}>
  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897
   1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 
   18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
</svg>
{hover ? 'Inscription' : null}</li></Link> : null}
        
       {role.role === 'admin' || role.role === 'editor' ?   <Link className="pl-3" href="search">
       <li className={`m-2 ${hover ? 'w-[90%]':null} text-center rounded-2xl flex ${pathname === '/search' ? 'bg-[#2DAE0D] border-b-[4px] font-bold border-[#137737] text-white rounded-[8px]':'hover:bg-[#137737] hover:text-white rounded-[8px]'} `}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`size-8 pl-2 ${hover ? 'mr-2':null}`}>
  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
</svg> {hover ? 'Search' : null} </li></Link> :null}
       
        {/*search section */}
        {role.role === 'admin' || role.role === 'admistration' ? <Link className="pl-3" href="/spend">
        <li className={` m-2 ${hover ? 'w-[90%]':null}  text-center rounded-2xl flex ${pathname === '/spend' ? 'bg-[#2DAE0D] border-b-[4px] font-bold border-[#137737] text-white rounded-[8px]':'hover:bg-[#137737] hover:text-white rounded-[8px]'} `}> 
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`size-8 pl-2 ${hover ? 'mr-2':null}`}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
</svg>
       
{hover ? 'spend' : null} </li></Link>: null}

      {role.role === 'admin' ?   <Link className="pl-3" href='/create'>
      <li className={`m-2 ${hover ? 'w-[90%]':null}  text-center rounded-2xl flex 
            ${pathname === '/create' ? 'bg-[#2DAE0D] border-b-[4px] font-bold border-[#137737] text-white rounded-[8px]':'hover:bg-[#137737] hover:text-white rounded-[8px]'} `}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`size-8 pl-2 ${hover ? 'mr-2':null}`}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 
  0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
</svg>
{hover ? 'Create' : null}</li> </Link> : null}

       {role.role === 'admin' || role.role === 'editor' ?  <Link className="pl-3" href='/program'>
       <li className={`m-2 ${hover ? 'w-[90%]':null}  text-center rounded-2xl flex ${pathname === '/program' ? 'bg-[#2DAE0D] border-b-[4px] font-bold border-[#137737] text-white rounded-[8px]':'hover:bg-[#137737] hover:text-white rounded-[8px]'} `}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`size-8 pl-2 ${hover ? 'mr-2':null}`}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 
  2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0
   0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973
    8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 
    12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
</svg>
{hover ? 'program' : null}</li></Link>:null}

     {role.role === 'admin' || role.role === 'admistration' ?   <Link className="pl-3" href='/payment'>
     <li className={`m-2 ${hover ? 'w-[90%]':null}  text-center rounded-2xl flex
         ${pathname === '/payment' ? 'bg-[#2DAE0D] border-b-[4px] font-bold border-[#137737] text-white rounded-[8px]':'hover:bg-[#137737] hover:text-white rounded-[8px]'} `}>
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`size-8 pl-2 ${hover ? 'mr-2':null}`}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75
   0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 
   .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0
    0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 
    0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
</svg> {hover ? 'Payment' : null}</li> </Link>: null}
    
      {role.role === 'admin' || role.role === 'editor' || role.role === 'prof' ? <Link className="pl-3" href='/teacher'>
      <li className={`m-2 ${hover ? 'w-[90%]':null}  text-center rounded-2xl flex
         ${pathname === '/teacher' ? 'bg-[#2DAE0D] border-b-[4px] font-bold border-[#137737] text-white rounded-[8px]':'hover:bg-[#137737] hover:text-white rounded-[8px]'} `}>
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`size-8 pl-2 ${hover ? 'mr-2':null}`}>
  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498
   0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" 
   clipRule="evenodd" />
</svg> {hover ? 'teacher':null} </li></Link> : null}
    </ul>
</div>: null}
        </Suspense>
        </>
    )
}