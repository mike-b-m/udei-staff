import { useState} from "react"
import { supabase } from "../db"


interface int{
id: number
history: string
amount: number
price: number
}
export default function Pay({id,history,price,amount}:int){
    const [theAmount, setTheAmount] = useState(Number)
    //const [balance, setBalance] = useState('')
    const date = new Date() 
    const [array ,setArray] = useState<any>([])
       const newAmount = amount + theAmount;
 const balance = newAmount - price;
 
 const [h, setH] = useState({date: date,
amount: theAmount,
balance: `${balance}`})

const HandlePayment = async (e:any) => {
    e.preventDefault()
    setArray([history,h])
          const { data:comp, error } =  await supabase.from('student_payment')
          .update({amount: {newAmount}, balance, payment_history: {array}})
          .select('*')
          .eq('student_id', `${id}`);
        if (error) console.error(error.message)
        }
    return(
        <div>
           <form onSubmit={HandlePayment}>
             <input type="number" value={theAmount} onChange={(e:any)=>setTheAmount(e.target.value)}/>
             <button type="submit"></button>
           </form>
        </div>
    )
}