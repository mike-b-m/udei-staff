'use client'
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "../db";
export default function Nav(){
    const [ses, setSes] =useState<any>()
     const pathname = usePathname()
      useEffect(() => {
             const getData = async () => {
               const { data:{session}, error } =   await supabase.auth.getSession();
             if (session)setSes(session)
             }; 
             getData()},[])
    return(
        <>
        {/*link for site */}
         {ses ? <div className=" bg-gray-200 rounded-2xl w-[25%] text-[20px] m-3 text-center min-w-65 max-w-65  min-h-85 max-h-85">
    <ul className=" h-[80%]">
        <li className="p-1 m-2  text-center rounded-2xl ">
            <Link className={`link ${pathname === '/' ? 'bg-[#2DAE0D] border-2 border-green-600  text-white rounded-2xl p-1 pl-15 pr-15':''}`} href="/">Home</Link></li>
            <li className="p-1 m-2  text-center rounded-2xl ">
            <Link className={`link ${pathname === '/inscription' ? 'bg-[#2DAE0D] border-2 border-green-600  text-white rounded-2xl p-1 pl-15 pr-15':''}`} href="/inscription">Inscription</Link></li>
        <li className="p-1 m-2  text-center rounded-2xl "><Link className={`link ${pathname === '/search' ? 'bg-[#2DAE0D] border-2 border-green-600 text-white rounded-2xl p-1 pl-15 pr-15':''}`} href="search">Search</Link></li>
        <li className="p-1 m-2  text-center rounded-2xl "><Link className={`link ${pathname === '/spend' ? 'bg-[#2DAE0D] border-2 border-green-600 text-white rounded-2xl p-1 pl-15 pr-15':''}`} href="/spend">spend</Link></li>
        <li className="p-1 m-2  text-center rounded-2xl "><Link className={`link ${pathname === '/create' ? 'bg-[#2DAE0D] border-2 border-green-600 text-white rounded-2xl p-1 pl-15 pr-15':''}`} href='/create'>Create</Link></li>
        <li className="p-1 m-2  text-center rounded-2xl "><Link className={`link ${pathname === '/program' ? 'bg-[#2DAE0D] border-2 border-green-600 text-white rounded-2xl p-1 pl-15 pr-15':''}`} href='/program'>program</Link></li>
    
    </ul>
</div>: null}
        </>
    )
}