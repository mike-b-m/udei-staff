
interface prop {
  type: string 
  int: string | number
  text: string
  out:(e:any)=> void
}
export default function Input({int,type, out,text}:prop){
    return(
        <div className="flex flex-col justify-between">
                   
                    <span className="ml-3 font-poppins">{text}</span><input type={type} value={int} 
                onChange={(e)=>out(e)}
                placeholder={text}
                className="py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-full h-8 bg-gray-300 border border-gray-400 "/>
                  </div>
    )
}