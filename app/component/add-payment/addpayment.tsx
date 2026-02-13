import { useEffect, useState} from "react"
import { supabase } from "../db"


interface int{
id: number
history: string
//amount: number
prices: number
}
export default function Pay({id,history,prices}:int){
    const [theAmount, setTheAmount] = useState(Number)
    const date = new Date()
    const price = prices - theAmount ;
 
    const h =[...history,{date: date,
    amount: theAmount,
    balance: `${prices}`}]

const HandlePayment = async () => {
          const { data, error } =  await supabase.from('student_payment')
          .update({price, payment_history: {h}})
          .select('*')
          .eq('student_id', `${id}`);
        if (error) console.error(error.message)
        }
    return(
        <div>
           <form onSubmit={HandlePayment}>
             <input type="number" value={theAmount} 
             className="border-2xl" 
             onChange={(e:any)=>setTheAmount(e.target.value)}/>
             {price}/{theAmount}<button type="submit">submit</button>
           </form>
        </div>
    )
}