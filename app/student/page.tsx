'use client'
import { supabase } from "../component/db";
import { useState, useEffect } from "react";

export default function Student_dashboard(){
    return(
        <div className="bg-sky-300 w-full p-15">
            <h3>faculty:</h3>
            <div className="flex justify-between text-center">
                <div className="bg-gray-300  text-[20px] font-bold p-10 rounded-2xl">
                    <div>7</div>moyen</div>

                <div className="bg-gray-300  text-[20px] font-bold p-10 rounded-2xl">
                    <div>1</div>year</div>

                <div className="bg-gray-300  text-[20px] font-bold p-10 rounded-2xl">
                    <div>200 HTG</div>balance</div>

                <div className="bg-gray-300  text-[20px] font-bold p-10 rounded-2xl">
                    <div>2/10/20XX</div>exam date</div>
            </div>

            <div className="grid grid-cols-2">
                <div className="border border-gray-500 bg-gray-300 w-[90%] pl-5 rounded mt-5">1 semester</div>
                <div className="border border-gray-500 bg-gray-300 w-[90%] pl-5 rounded mt-5">2 semester</div>
                <div className="border border-gray-500 bg-gray-300 w-[90%] pl-5 rounded mt-5">devoir</div>
                <div className="border border-gray-500 bg-gray-300 w-[90%] pl-5 rounded mt-5">quiz</div>
                <div className="border border-gray-500 bg-gray-300 w-[90%] pl-5 rounded mt-5">horaire</div>
            </div>
        </div>
    )
}