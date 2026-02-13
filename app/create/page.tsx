import SignUp from "../component/sign_up/page";
import { Suspense } from "react";
export default function Create(){
    return (
        <>
        <Suspense fallback={<div>chargement..</div>}>
         <SignUp/>
         </Suspense>
        </>
    )
}