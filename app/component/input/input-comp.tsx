
interface prop {
  type: string 
  int: string | number
  text: string
  require: boolean | undefined 
  out:(e:any)=> void
}
export default function Input({int,type, out,text,require}:prop){
    return(
        <div className="flex flex-col justify-between relative mb-8 m-3 focus-within:text-[#2DAE0D]">
          
                   <span className="font-poppins  absolute border-gray-300 
                   border-2 top-0 border-b w-12 left-5 bg-gray-300 pl-1 pr-1"></span>
                    <span className="font-poppins font-semibold absolute top-[-14] left-5  pl-1 pr-1">{text}</span>
                    <input type={type} value={int} 
                onChange={(e)=>out(e)}
                //placeholder={text}
                className="py-2 px-4 focus:outline-none focus:border-[#2DAE0D] focus:border-2
                  rounded-lg text-gray-800 w-45.7 h-8 border border-gray-400 " required={require}/>
                  </div>
    )
}