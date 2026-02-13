import Student_input from "../component/student-input/page";
import { Suspense } from "react";
export default function Enroll(){
    return(
        <>
        <Suspense fallback={<div>chargement...</div>}>
        <Student_input/>
        </Suspense>
        </>
    )
}