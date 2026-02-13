'use client'
import StudentInfos from "../component/student-infos/page";
import { useSearchParams } from "next/navigation";

type user = {
    id: number
    first_name: string
    last_name: string
    faculty: string
    date_birth: string
    place_of_birth: string
    nif_cin: string
    sex: string
    email: string
    phone_number: string
    marital_status: string
    adress: string
    
    mother_name: string
    mother_birth:string
    mother_residence: string
    mother_phone: string
    mother_profesion: string

     father_name: string
    father_birth:string
    father_residence: string
    father_phone: string
    father_profesion: string

    diploma: string
    enrol_date: string
    seen_by: string
}
export default function Infos(){
     const searchpara = useSearchParams();
        const search = searchpara.get('nom') || '';
        const search2 = searchpara.get('prenom') || '';
    
    return(
        <>
        <StudentInfos nom={search} prenom={search2}/></>
    )
}