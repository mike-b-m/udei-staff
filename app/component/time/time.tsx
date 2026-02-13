interface prop {
  open: string
  //onOpen:()=> void
}
export default function Time({open}:prop){
    {/*set time today */}
    const day_time = open.split("T") 
    const total = day_time[1] + "  " + day_time[0]
  return(
    <div>
        {total}
    </div>
  )
}