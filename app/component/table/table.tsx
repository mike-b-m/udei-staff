interface tab {
    int: any
    faculty: string | null
    year: number
    session: number

}
export default function TheTable({int,year,faculty,session}:tab){
    const into= int.filter((item:any)=> item.year === year && item.session===session)
    return(
        <>
        {into ? <div className="m-5 text-[14px]">
            
            <ol className=" flex ">
                <li className="m-2">Faculté: {faculty}</li>
                <li className="m-2">Année: {year}</li>
                <li className="m-2">session: {session}</li>
            </ol>
             <ol className="flex text-center ">
                <li className="border min-w-50 bg-gray-400/80">Cours</li>
                <li className="border min-w-[15%] bg-gray-400/80">Crédit</li>
                <li className="border max-w-[15%] min-w-[5%] bg-gray-400/80">Nombres séances/heures</li>
                <li className="border max-w-[15%] min-w-[5%] bg-gray-400/80">nombres heures/séances</li>
                <li className="border max-w-[15%] min-w-[5%] bg-gray-400/80">Nombres d'heures totals</li></ol> 
             {into.map((pro:any)=>
            <ol key={pro.id} className="flex text-center">
                <li className="border min-w-50">{pro.courses}</li>
                <li className="border min-w-[15%]">{pro.credit}</li>
                <li className="border min-w-[15%]">{pro.session_subjet}</li>
                <li className="border min-w-[15%]">{pro.hour_session}</li>
                <li className="border min-w-[15%]">{pro.total_hour}</li>
                </ol>
            )}
        </div> : null}
        </>
    )
}