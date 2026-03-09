import { LineChart,Line, XAxis, YAxis,Tooltip,ResponsiveContainer } from "recharts";

export default function ChartProgress({data}:{data:any[]}){
    return(
        <div className="w-[50%] h-80 bg-white rounded-xl p-4 shadow-lg">
            <ResponsiveContainer width={`${100}%`} height={`${100}%`}>
                <LineChart data={data}>
                    <XAxis dataKey={`date_time`} 
                    tickFormatter={(v)=> new Date(v).toLocaleString("default",{month: "short" })}/>
                    <YAxis/>
                    <Tooltip/>
                    <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3}/>
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}