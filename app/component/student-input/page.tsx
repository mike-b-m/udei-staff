'use client'
import { supabase } from "../db";
import { useState } from "react";
import Input from "../input/input-comp";
 
export default function Student_input(){
    const[first_name, setFirst_name]= useState('')
    const [ last_name, setLast_name]= useState('')
    const[date_birth, setDate_birth]= useState('')
    const [place_of_birth, setPlace_of_birth]= useState('')
    const [nif_cin, setNif_cin]= useState('')
    const [marital_status, setMarital_status]= useState('')
    const [adress, setAdress]= useState('')
    const [phone_number, setPhone_number]=useState('')
    const [email, setEmail]=useState('')
    const[sex, setSex]= useState('')
    const [faculty, setFaculty]= useState('')

    {/*mom input*/}
    const [mother_name, setMother_name]=useState('')
    const [mother_birth, setMother_birth]=useState('')
    const [ mother_residence, setMother_residence]= useState('')
    const [ mother_phone, setMother_phone]= useState('')
    const [mother_profesion, setMother_profesion]= useState('')
    {/*mom input*/}
    const [father_name, setFather_name]=useState('')
    const [father_birth, setFather_birth]=useState('')
    const [ father_residence, setFather_residence]= useState('')
    const [ father_phone, setFather_phone]= useState('')
    const [father_profesion, setFather_profesion]= useState('')
    {/*cert/diploma and agreement */}
    const [diploma, setDiploma]=useState([])
    //const [profil_url, setProfil_url]= useState('')
    const [seen_by,setSeen_by]= useState('barry')
    const [agreement, setAgreement] =useState(Boolean)
    {/*Submit fonstion */}
    const HandleSubmit = async (e:any) => {
    e.preventDefault()
            const {data, error} = await supabase.from('student')
            .insert([{first_name,
              last_name,
              faculty,
              date_birth,
                place_of_birth,
                nif_cin,sex,email,
                phone_number,
                marital_status,
                adress,
                mother_name,
                mother_birth,
            mother_residence,
            mother_phone,
            mother_profesion,
            father_name,
            father_birth,
                father_residence,
                father_phone,
                father_profesion, 
                agreement,
                diploma,
                seen_by}]).select();
    if (error) {
  console.error('Error:', error.message);
} else {
  console.log('Saved:', data);
}}
    return (
        <div className=" ml-[15%] mr-[15%] grid grid- col-2 border-t-2 border-gray-600 mt-4">
         
            <form onSubmit={HandleSubmit} className="grid grid-cols-1">
                 <div className="flex justify-between">
                    <Input int={last_name} text="Nom"
                    type="text" out={(e)=>setLast_name(e.target.value)}/>
                     <Input int={first_name} text="Pronom"
                     type="text" out={(e)=>setFirst_name(e.target.value)}/>
                    </div>

                <div className="flex justify-between">
                  <Input int={date_birth} text="date de naissance"
                     type="date" out={(e)=>setDate_birth(e.target.value)}/>
                    
                <Input int={place_of_birth} text="lieu de naissance"
                     type="text" out={(e)=>setPlace_of_birth(e.target.value)}/>
                    </div>

                <div className="">
                  <Input int={nif_cin} text="NIF/CIN"
                     type="number" out={(e)=>setNif_cin(e.target.value)}/>
                    </div>

                {/*matrimonial status*/}
                <div className="flex justify-between">
                  <span><label >statut matrimonial</label>
                <select value={marital_status} onChange={(e)=>setMarital_status(e.target.value)}
                    className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-full bg-gray-300">
                    <option>option</option>
                    <option>Marié</option>
                    <option>Célibataire</option>
                    <option>divorcé</option>
                </select></span>
                
                <Input int={adress} text="Adresse"
                     type="text" out={(e)=>setAdress(e.target.value)}/>    
                </div>

                <div className="flex justify-between">
                  <Input int={phone_number} text="Téléphone"
                     type="text" out={(e)=>setPhone_number(e.target.value)}/>
                     
                  <Input int={email} text="email"
                     type="email" out={(e)=>setEmail(e.target.value)}/>
                 </div>

                {/*faculty part */}
                <div className="flex justify-between">
                <span><label>Faculté:</label>
                <select value={faculty} onChange={(e)=>setFaculty(e.target.value)}
                    className=" mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-full bg-gray-300">
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
                </select></span>

                <span><label>sexe</label>
                <select value={sex} onChange={(e)=>setSex(e.target.value)}
                    className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-full bg-gray-300">
                    <option >options</option>
                    <option>Masculin</option>
                    <option>féminin</option>
                </select></span>
                </div>

            {/*section parent */}
            <div className="border-t-2 border-gray-600 mt-4">
              <div className="flex justify-between">
                <Input int={mother_name} text="Mère"
                     type="text" out={(e)=>setMother_name(e.target.value)}/>       
                 <Input int={mother_birth} text="lieu de naissance"
                     type="text" out={(e)=>setMother_birth(e.target.value)}/>
                   </div>           
            <div className="flex justify-between">
              <Input int={mother_residence} text="Domicile"
                     type="text" out={(e)=>setMother_residence(e.target.value)}/>
              <Input int={mother_phone} text="Téléphone"
                     type="text" out={(e)=>setMother_phone(e.target.value)}/>
            </div> 
             <Input int={mother_profesion} text="Profesion"
                     type="text" out={(e)=>setMother_profesion(e.target.value)}/>
            </div>
            {/*father section */}
            <div className="border-t-2 border-gray-600 mt-4">
            <div className="flex justify-between">
              <Input int={father_name} text="Père"
                     type="text" out={(e)=>setFather_name(e.target.value)}/>
              <Input int={father_birth} text="Lieu de naissance"
                     type="text" out={(e)=>setFather_birth(e.target.value)}/>
           </div>
            
            <div className="flex justify-between">
              <Input int={father_residence} text="Domicile"
                     type="text" out={(e)=>setFather_residence(e.target.value)}/>
                <Input int={father_phone} text="Téléphone"
                     type="text" out={(e)=>setFather_phone(e.target.value)}/>
           </div>
            
            <Input int={father_profesion} text="Prefession"
                     type="text" out={(e)=>setFather_profesion(e.target.value)}/>
          
            </div>

            <div>
               <input type="checkbox" value={father_profesion}
            className=" mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text mr-1 bg-gray-300"
                   onChange={(e)=>setAgreement(true)} required/>
            {/*button submit */}je m'engage a respecter les principes de l'UDEI.
            </div>
            <button type="submit" className="bg-[#2DAE0D] rounded-2xl
             text-white text-[20px] hover:bg-green-700 w-18.5 h-10">submit</button>
            </form>
        </div>
    )
}