interface prop {
  open: string
  //onOpen:()=> void
}
export default function Time({open}:prop){
    {/*set time today */}
    const day_time = open.split("T") 
    const day_time1 = day_time[1].split(".") 
    const total = day_time1[0] + " " + day_time[0]
  return(
    <div className="ml-2">
        {total}
    </div>
  )
}