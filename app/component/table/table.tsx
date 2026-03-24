interface tab {
    int: any
    faculty: string | null
    year: number
    session: number

}
const colors=[
  "bg-[#CAF0F8]/25 font-medium",
  "bg-[#90C3C8]/70 font-medium"
]
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
                <li className="border-r min-w-50 bg-[#0077B6] text-white text-[16px] text-center pt-1 border-gray-800">Cours</li>
                <li className="border-r min-w-[15%] bg-[#0077B6] text-white text-[16px] text-center pt-1 border-gray-800">Crédit</li>
                <li className="border-r max-w-[15%] min-w-[5%] bg-[#0077B6] text-white text-[16px] text-center pt-1 border-gray-800">Nombres séances/heures</li>
                <li className="border-r max-w-[15%] min-w-[5%] bg-[#0077B6] text-white text-[16px] text-center pt-1 border-gray-800">nombres heures/séances</li>
                <li className="borde max-w-[15%] min-w-[5%] bg-[#0077B6] text-white text-[16px] text-center pt-1 border-gray-800">Nombres d'heures totals</li>
                </ol> 
             {into.map((pro:any,index:any)=>
            <ol key={pro.id} className={`flex text-center`}>
                <li className={`border-r min-w-50 ${colors[index % colors.length]}`}>{pro.courses}</li>
                <li className={`border-r min-w-[15%] font-bold ${colors[index % colors.length]}`}>{pro.credit}</li>
                <li className={`border-r min-w-[15%] font-bold ${colors[index % colors.length]}`}>{pro.session_subjet}</li>
                <li className={`border-r min-w-[15%] font-bold ${colors[index % colors.length]}`}>{pro.hour_session}</li>
                <li className={`border-r min-w-[15%] font-bold ${colors[index % colors.length]}`}>{pro.total_hour}</li>
                </ol>
            )}
            <ol className="flex text-center">
                <li className="border-r  min-w-50 font-bold">Totals</li>
                <li className="border-r border-b min-w-[15%] font-bold">
                    {into?.reduce((accumulator : number, currentItem:any) => accumulator + Number(currentItem.credit), 0)}</li>
                <li className="border-r border-b min-w-[15%] font-bold">
                    {into?.reduce((accumulator : number, currentItem:any) => accumulator + Number(currentItem.session_subjet), 0)}</li>
                <li className="border-r border-b min-w-[15%] font-bold">
                    {into?.reduce((accumulator : number, currentItem:any) => accumulator + Number(currentItem.hour_session), 0)}</li>
                <li className="border-r border-b min-w-[15%] font-bold">
                    {into?.reduce((accumulator : number, currentItem:any) => accumulator + Number(currentItem.total_hour), 0)}</li>
                </ol>
        </div> : null}
        </>
    )
}

export function TheTable2({int,year,faculty,session}:tab){
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
                <li className=" min-w-50 bg-[#0077B6] text-white text-[16px] text-center pt-1 border-gray-800">Cours</li>
                </ol> 
             {into.map((pro:any,index:any)=>
            <ol key={pro.id} className={`flex text-center`}>
                <li className={` min-w-50 ${colors[index % colors.length]}`}>{pro.courses}</li>
                </ol>
            )}
        </div> : null}
        </>
    )
}