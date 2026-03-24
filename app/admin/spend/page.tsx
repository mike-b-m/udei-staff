'use client'
import { Suspense } from "react";
import Spend from "@/app/component/spend/spend";
export default function Add_botton(){
    return(
        <>
         <Suspense fallback={<div>chargement</div>}>
            <Spend/>
         </Suspense>
        </>
    )
}