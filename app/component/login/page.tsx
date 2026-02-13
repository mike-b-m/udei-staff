'use client'
import {useState,useEffect} from "react";
import {supabase} from "../db"
export default function LogIn(){
  const [user, setUser] = useState<any>([])

   const signOutall = async () => {
  
            const {error} = await supabase.auth.signOut()}
     useEffect(() => {
        const getData = async () => {
          const { data:{session}, error } =   await supabase.auth.getSession();
        if (session){
          const { data:{user}, error } =   await supabase.auth.getUser();
          if (error) console.log('Error',error.message);
          
          else setUser(user)
        }
        if (!session) console.error('not session find')      
        else if (error) console.error(error?.message);
        //else setUser(user)
        }; 
        getData()},[])

        return (
            <>{user.email}
            {user.id}
            <button onClick={signOutall}>log out</button>
           {/*{user ? user.map((use:any)=>
    <ol key={use.id}>
        <li>{use}</li>
    </ol>):<div>null</div> }*/}
            </>
        )
}