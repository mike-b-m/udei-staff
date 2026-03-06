interface put{
    int: string | number
    out: string | number | boolean 
}
export default function Lecture({int, out}:put){
    return(
        <div className="mt-4 static flex flex-col text-[16px] text-center 
         rounded-lg w-[99%] h-15 shadow-sm bg-gray-100 pl-5 pr-5 ">
                  <span className="text-[18px]  font-medium relative top-[-14]" >{int}</span>{out}</div>
    )
}