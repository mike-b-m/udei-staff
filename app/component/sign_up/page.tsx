'use client'
import { supabase } from "../db";
import { useState, useEffect } from "react";

export default function SignUp(){
    const [email,setEmail]= useState('')
    const [password, setPassword]= useState('')
    const [phone,setPhone]= useState('')
    const [fullname, setFullname] = useState ('')
    const [role , setRole] =useState('')
    const [matiere, setMatiere] = useState<any[]>([])
    const [program,setProgram] = useState<any[]>([])
   //program
   const [filter,setFilter] =useState<string[]>([])
   const [faculty,setFaculty] = useState('')
   const [session,setSession] = useState('')
   const [year,setYear] = useState('')

    const handleSelectChange = (event:any) => {
    const options = event.target.options;
    const value = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    setMatiere(value);
  };

  
       useEffect(() => {
              const getData = async () => {
                 //list cours in program
                 const { data:pro, error:theError } = await supabase
    .from('course_program')
    .select('*').eq('faculty', faculty).eq('session', session).eq('year', year);
          if (theError) console.error(theError.message)
          else setProgram(pro)
  
              }; 
              getData()},[])

    const HandleCreate = async (e:any) => {
    e.preventDefault()
            const {data, error} = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      full_name: fullname,
      role: role,
      phone: phone,
    }
  }
});
    if (error) {
  console.error('Error:', error.message);
} else {
  console.log('Saved:', data);

    };}
return(
    <>
    <form onSubmit={HandleCreate} className="bg-gray-200 pl-20">
      <h2 className="text-center font-poppins font-medium m-2 text-[20px]">Créer un compte pour le personnel</h2>
        <input type="text" placeholder="fullname" 
        className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] bg-gray-300"
                  value={fullname} onChange={(e)=>setFullname(e.target.value)} />
        <input type="email" placeholder="email"  value={email} className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] bg-gray-300"
                   onChange={(e)=>setEmail(e.target.value)}/>
        <input type="password" placeholder="password" value={password} 
        className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] bg-gray-300" onChange={(e)=>setPassword(e.target.value)}/>
        <input type="text" placeholder="phone" className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] bg-gray-300"
                   value={phone} onChange={(e)=>setPhone(e.target.value)}/>
    
    {/*sectoin access of role */}
    <label htmlFor=""></label>
    <select className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] bg-gray-300" onChange={(e)=>setRole(e.target.value)}>
        <option>role</option>
        <option>admin</option>
        <option>editor</option>
        <option>prof</option>
    </select>

    {/*select prof */}
    {role === 'prof' ? <div>
      {/*matiere, year, */}
      {matiere}
      {/*filter section */}
      <div className="flex p-5">
        <label>faculté</label>
    <select value={faculty} className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] bg-gray-300" onChange={(e)=>setFaculty(e.target.value)}>
        <option>option</option>
                    <option>Génie Civil</option>
                    <option>Médecine Générale</option>
                    <option>Odontologie</option>
                    <option>Sciences Infirmières</option>
                    <option> Sciences Administratives</option>
                    <option>Sciences Comptables</option>
                    <option>Gestion des affaires</option>
                    <option>Sciences Agronomiques</option>
                    <option> Sciences Economiques</option>
                    <option>Sciences de l'Education</option>
                    <option>Sciences Juridiques</option>
                    <option>Pharmacologies</option>
                    <option>Médecine vétérinaire</option>
                    <option> Laboratoire medicale</option>
                    <option>Physiothérapie</option>
                    <option>Jardinières d'enfants</option>
    </select>

      <label>session</label>
    <select value={session} className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] bg-gray-300" onChange={(e)=>setSession(e.target.value)}>
        <option>option</option>
                    <option>1</option>
                    <option>2</option>
    </select>

      <label>year</label>
    <select value={year} className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] bg-gray-300" onChange={(e)=>setYear(e.target.value)}>
        <option>option</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5</option>
    </select>
      </div>


      <label htmlFor=""></label>
    
    <select multiple value={matiere} className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[25%] bg-gray-300" onChange={handleSelectChange}>
       {program.map((pro)=>
        <ol key={pro.id}><li><option>{pro.courses}</option></li></ol>
        )}
    </select>
    </div>: null}
    <button className="bg-[#2DAE0D] rounded-2xl
             text-white text-[20px] hover:bg-green-700 w-25 h-8">create</button>
    </form>
    </>
    )
    }