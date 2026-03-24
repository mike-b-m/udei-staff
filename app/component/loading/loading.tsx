export default function Loading(){
    return(
        <div className="w-[345px] rounded-xl  ">
            <div className="bg-gray-300 p-2  rounded-xl m-2 animate-pulse flex">
             <div className="bg-gray-500 size-25 rounded-xl m-1 pt-3"></div>
            <div >
                <div className="bg-gray-500 h-6 w-50 rounded-xl m-1 "></div>
                <div className="bg-gray-500 h-3 rounded-xl m-1 mt-3"></div>
            <div className="bg-gray-500 h-3 rounded-xl m-1 "></div>
            <div className="bg-gray-500 h-3 rounded-xl m-1"></div>
            <div  className="flex">
                <div className="bg-gray-500 size-10  rounded-full m-1"></div>
            <div className="bg-gray-500 size-10  rounded-full m-1"></div>
            </div>
            </div>
        </div>
        </div>
    )
}

export function Loading2(){
    return(
        <div className="justify-items-center-safe  ">
            <div className=" rounded-xl m-2 animate-pulse ">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
              stroke="currentColor" className="size-30 animate-spin">
  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
</svg>

        </div>
        </div>
    )
}