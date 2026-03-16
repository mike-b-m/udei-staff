interface put{
    int: string | number
    out: string | number | boolean 
}
export default function Lecture({int, out}:put){
    return(
        <div className="mt-4 flex  justify-between text-[18px] text-[#484646]
         rounded-lg w-[99%] h-10 border-b border-gray-300 bg-gray-100 pl-5 pr-5 font-medium">
                  <span className="text-[20px]  font-bold" >{int}</span>{out}</div>
    )
}