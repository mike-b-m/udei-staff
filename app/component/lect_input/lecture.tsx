interface put{
    int: string | number
    out: string | number
}
export default function Lecture({int, out}:put){
    return(
        <div className="m-2 flex flex-col text-[20px] rounded-lg w-[90%] shadow-sm bg-gray-100 pl-5 pr-5">
                  <span className="text-[16px] border-b-2 border-b-gray-500 " >{int}</span>{out}</div>
    )
}