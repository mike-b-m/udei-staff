import { useEffect, useState} from "react"
import { supabase } from "../db"
import { Update } from "@/app/component/add-buuton/add_button";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Time from "../time/time";
import { Filter2 } from "../filter/filter";

interface int{
id: number
history: string
//amount: number
balance: number
}
type pric={
  id: number
  faculty: string
  price: number
}
type user = {
    id: number
    first_name: string
    last_name: string
    faculty: string
}
type pay = {
    id: number
    student_id: number
    payment_history: any
    amount: number
    balance: number
    faculty: string
    price: number
}
type st={
    balance: string
}
type ide={
    id: number
}
const colors=[
 "bg-[#2DAE0D]/70",
 "bg-gray-200"
]


export default function Pay({id,history,balance}:int){
    const [theAmount, setTheAmount] = useState(Number)
    const date = new Date()
    const price = balance - theAmount ;
    // const payment_history=[...history,{date: date,
    // amount: theAmount,
    // balance: prices}]


const HandlePayment = async () => {

    if (history === null)
        { 
        const payment_history=[{date: date,
    amount: theAmount,
    balance: price}]
    const { data, error } =  await supabase.from('student_payment')
          .update({balance: price, payment_history})
          .select('*')
          .eq('id', id);
        if (error) console.error(error.message) }

    else{
         const payment_history=[...history,{date: date,
    amount: theAmount,
    balance: price}]

    const { data, error } =  await supabase.from('student_payment')
          .update({balance: price, payment_history})
          .select('*')
          .eq('id', id);
        if (error) console.error(error.message)
    }
        //   const { data, error } =  await supabase.from('student_payment')
        //   .update({price, payment_history})
        //   .select('*')
        //   .eq('id', id);
        // if (error) console.error(error.message)
         }
    return(
        <div>
           <form onSubmit={HandlePayment}>
             <input type="number" value={theAmount} 
             className="border-2xl" 
             onChange={(e:any)=>setTheAmount(e.target.value)}/>
             {price}/{theAmount} <button type="submit" className='bg-[#2DAE0D] rounded-2xl text-white text-[16px] hover:bg-green-700 w-30 h-6 m-3 pl-2'>submit</button>
           </form>
        </div>
    )
}

export  function Price(){
    const [title ,setTitle] =useState<pric[]>([])
    const [faculty, setFaculty] = useState('')
    const [price,setPrice] =useState(Number)
    const [open,setOpen] = useState(false)

    const handleUpdate= async ()=> {
        const {error:status_error } =  await supabase.from('faculty_price')
        .insert([{faculty,price}])
        .select('*')
            if (status_error) console.error(status_error.message)
            else console.log('saved')
    }
   
     useEffect(() => {
            const getData = async () => {
              const { data:comp, error } =  await supabase.from('faculty_price')
              .select('*')
              ;
            if (error) console.error(error.message)
              else setTitle(comp)
            }; 
            getData()},[])
    return(
        <div className="m-1">
          {open ? <form action={handleUpdate} className="flex flex-col min-h-25 justify-between">
            <h4>ajouter la faculté et le prix</h4>
            <input type="text" placeholder="faculté" value={faculty} 
            className="border" onChange={(e)=>setFaculty(e.target.value)}/>

            <input type="number" placeholder="prix" value={price} 
            className="border" onChange={(e:any)=>setPrice(e.target.value)} />

           <div className="flex p-2">
             <button className="bg-gray-500 rounded-2xl
             text-white text-[16px] hover:bg-gray-700 w-20 h-6" onClick={(e)=>setOpen(false)}>Cancel</button>
             
             <button type="submit" className="bg-[#2DAE0D] rounded-2xl
             text-white text-[16px] hover:bg-green-700 w-20 h-6 ml-3" >save</button>
           </div>

          </form>
          : <button className="bg-[#2DAE0D] rounded-2xl
             text-white  text-[16px] hover:bg-green-700 w-30 h-6 m-6" onClick={(e)=>setOpen(true)}>ajouter le prix</button> }
        <div className="w-full flex p-1 mt-3 bg-gray-400 rounded-t-xl font-medium">
                 <div className="ml-2 pt-1 w-50">faculté</div>
                <div className="w-25 pt-1">Prix</div>
             </div>
       {title.map((tit:pric,index)=>
          <ol key={tit.id} className={` flex text-[16px] ${colors[index % colors.length]}`}>
            <li className="ml-2 pt-1 w-50">{tit.faculty}</li>
            <li className="w-25 pt-1">{tit.price} HTG</li>
            <Update value={tit.faculty} id={tit.id}/>
          </ol>)}
        </div>
    )
}
function Stu({id}:ide){
    const [du,setDu] =useState<st[] | any>()
     useEffect(() => {
            const getData = async () => {
              
          const { data, error:status_error } =  await supabase.from('student_payment').select('balance')
              .eq('student_id', id).single();
              
            if (status_error) console.error(status_error.message)
                else setDu(data)
            }; 
            getData()},[])
            return (
                <div>{du?.balance} HTG </div>
            )
 }

 export  function Student_pay(){
    const [student,setStudent] = useState<user[]>([])

     useEffect(() => {
            const getData = async () => {
              const { data:comp, error } =  await supabase.from('student').select('last_name,first_name,id,faculty')
              ;
            if (error) console.error(error.message)
              else {
              setStudent(comp)
            }
            }; 
            getData()},[])

    return(
        <div>
            <h4 className="text-center font-poppins font-medium m-2 text-[20px]">liste des étudiants et le solde disponible</h4>
            <div className="w-full flex justify-between p-1 mt-3 bg-gray-400 rounded-t-xl font-medium">
                <div className=" ml-2 w-50">nom et prénom</div>
                <div className="w-50">balance</div>
                 <div className="w-50">faculté</div>
                 <div className="w-50">niveau</div>
             </div>
           {student.map((stund,index)=>
        <ol key={stund.id} className={`${colors[index % colors.length]}`}>
            <Link href={`/payment?id=${stund.id}`} className="w-full flex justify-between p-1">
            <li className="ml-2 w-50">{stund.last_name} {stund.first_name} </li>
            <li className="w-50"><Stu id={stund.id}/></li>
            <li className="w-50">{stund.faculty}</li>
            <li className="w-50"><Filter2 id={stund.id} bool/></li></Link> 
        </ol>)}
        </div>
    )
}
//list payment
export function Payments(){
    const [payment, setPayment]= useState<pay[]>([])
    const [student, setStudent] = useState<user[] | any>([])
      const [open,setOpen] = useState(false)
    const searchpara = useSearchParams()
    const search =  searchpara.get('id')
   useEffect(() => {
        const getData = async () => {
          const { data:comp, error } =  await supabase.from('student_payment').select('*')
          .eq('student_id', search);
        if (error) console.error(error.message)
          else {
      const { data:com, error:status_error } =  await supabase.from('student').select('last_name, first_name,id')
          .eq('id', search);
          setPayment(comp)
        if (status_error) console.error(status_error.message)
        else setStudent(com) }
        }; 
        getData()},[])

   
    return(
        <div className="bg-gray-300 w-full pt-2 mb-5 p-2">
            {/*fullname section */}
           <div className=" flex justify-between max-w-50 bg-gray-100 m-1 p-2  rounded">
            fullname: 
            <span> {student[0]?.last_name} </span>
            <span>{student[0]?.first_name}</span>
           </div>
            {payment.map((pay)=>
            <ol key={pay.id} className="flex flex-col  justify-between">
           <div key={pay.id} className=" flex justify-between ">
             {/* <li className="bg-gray-200 w-[25%]">h{pay.payment_history}
            </li> */}
            <li className="bg-gray-100 w-[25%] m-1 p-2 rounded flex flex-col text-center"><span className="border-b border-gray-400">Balance</span>{pay.balance} HTG </li>
            <li className="bg-gray-100 w-[25%] m-1 p-2 rounded flex flex-col text-center"><span className="border-b border-gray-400">Faculty</span>{pay.faculty}</li>
             <li className="bg-gray-100 w-[25%] m-1 p-2 rounded flex flex-col text-center"><span className="border-b border-gray-400">Price/An</span><span>{pay.price} HTG</span></li>
           
            {open ? (<div><Pay id={pay.id} balance={pay.balance}  history={pay.payment_history}/>
            <button className={`bg-gray-500 rounded-2xl text-white text-[16px] hover:bg-gray-700 w-20 h-6 m-3 `} onClick={()=>{
                setOpen(false)}}>cancel</button></div>)
                : <button className={`bg-[#2DAE0D] rounded-2xl text-white text-[16px] hover:bg-green-700 w-30 h-6 m-3 pl-2 flex`} onClick={()=>{
                setOpen(true)}}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>
payment</button>}
           </div>
            </ol>)}
           <h6 className="text-center text-[20px] border-b-3 border-t-3
            border-gray-700 mt-2 rounded-xl"> history of payment</h6>
            <div className="w-full flex justify-between p-1 mt-3 bg-gray-400 rounded-t-xl font-medium">
                <span className="w-full">Montant</span> 
                <span className="w-full">Balance</span> 
                <span className="w-full">Date</span></div>
            {(payment[0]?.payment_history ?? []).map((pay:any,index:any)=>
                <ol key={index} className={`flex justify-between p-1 ${colors[index  % colors.length]}`}>
                <li className="w-full">{pay.amount} HTG </li>
                <li className="w-full">{pay.balance} HTG </li>
                <li className="w-full flex"><Time open={pay.date}/></li>
            </ol>)}
        </div>
    )
}