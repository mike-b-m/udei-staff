interface put{
    int: string | number
    out: string | number
}
export default function Lecture({int, out}:put){
    return(
        <div className="m-2 flex flex-col text-[16px] text-center rounded-lg w-[90%] shadow-sm bg-gray-100 pl-5 pr-5">
                  <span className="text-[14px] border-b border-b-gray-500 font-medium " >{int}</span>{out}</div>
    )
}