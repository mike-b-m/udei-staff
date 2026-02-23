import StudentInfos from "../component/student-infos/studeninfos";
import { Suspense } from "react";

export default function Infos(){
    return(
        <Suspense fallback={<div>chargement...</div>}>
            <StudentInfos/>
        </Suspense>
    )
}