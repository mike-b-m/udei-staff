'use client'
import { supabase } from "../db";
import { useState, useEffect } from "react";
import Input from "../input/input-comp";
import { Code } from "../code/code";
import Image from "next/image";
 
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
    const [code,setCode]=useState('')
    const [seen_by,setSeen_by]= useState('')
    const [agreement, setAgreement] =useState(Boolean)
    {/*student photo*/}
    const [photo, setPhoto] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    
    {/*save succes or error */}
    const [load,setLoad] = useState (false)
    const [save,setSave]= useState(false)

    {/*handle photo selection*/}
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      setPhoto(file)
      if (file) {
        setPhotoPreview(URL.createObjectURL(file))
      } else {
        setPhotoPreview(null)
      }
    }

    {/*Submit fonstion */}
    const HandleSubmit = async (e:any) => {
       setLoad(true)
    e.preventDefault()

    let photo_url: string | null = null

    {/* Upload photo to Supabase storage */}
    if (photo) {
      const fileExt = photo.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('student_photo')
        .upload(fileName, photo, { contentType: photo.type })

      if (uploadError) {
        console.error('Photo upload error:', uploadError.message)
        setLoad(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('student_photo')
        .getPublicUrl(fileName)
      photo_url = urlData.publicUrl
    }

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
                seen_by,
              student_code: code,
              photo_url}]).select();
    if (error) {
  console.error('Error:', error.message);
  setLoad(false)
} else {
  console.log('Saved:', data);
  setSave(true)
            setTimeout(() => {setSave(false)   
            }, 2000);
            
              setTimeout(() => {window.location.reload()   
            }, 2000);
    ;

}}
  
    return (
        <div className=" grid grid- col-2 border-t-2 border-b-2 
        border-gray-600 mt-4 w-full h-full bg-gray-200 rounded-xl static">
         {/* set save  */}
                
                    {save ? (<div className="fixed inset bg-gray-100 p-7 text-green-600 flex border border-gray-500 rounded-lg">
                        save with succes
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                             className="size-6">
        <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 
        0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0
        0 1.15-.043l4.25-5.5Z" clipRule="evenodd" />
        </svg>
        </div> ) : ''}
                       
              <h6 className="text-center text-[20px] mt-4">formulaire d'inscription</h6>
            <form onSubmit={HandleSubmit} className="grid grid-cols-1 pl-[15%] pr-[15%] pb-3">
                {/* Student Photo Upload */}
                <div className="flex flex-col items-center mb-4">
                  <label className="font-poppins mb-2">Photo de l&apos;étudiant</label>
                  <div className="w-32 h-32 rounded-full border-2 border-gray-400 overflow-hidden bg-gray-300 flex items-center justify-center mb-2">
                    {photoPreview ? (
                      <Image src={photoPreview} alt="Preview" width={128} height={128} className="w-full h-full object-cover" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    )}
                  </div>
                  <input type="file" accept="image/*"
                    onChange={handlePhotoChange}
                    className="py-1 px-2 text-sm file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer" />
                </div>
                 <div className="flex justify-between">
                    <Input int={last_name} text="Nom"
                    type="text" out={(e)=>setLast_name(e.target.value)} require={true}/>
                     <Input int={first_name} text="Prénom"
                     type="text" out={(e)=>setFirst_name(e.target.value)} require={true}/>
                    </div>

                <div className="flex justify-between">
                  <Input int={date_birth} text="date de naissance"
                     type="date" out={(e)=>setDate_birth(e.target.value)} require={true}/>
                    
                <Input int={place_of_birth} text="lieu de naissance"
                     type="text" out={(e)=>setPlace_of_birth(e.target.value)} require={true}/>
                    </div>

                <div className="">
                  <Input int={nif_cin} text="NIF/CIN"
                     type="number" out={(e)=>setNif_cin(e.target.value)} require={true}/>
                    </div>

                {/*matrimonial status*/}
                <div className="flex justify-between">
                  <span><label >statut matrimonial</label>
                <select value={marital_status} onChange={(e)=>setMarital_status(e.target.value)}
                    className="py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-[50%] h-10 bg-gray-300 border border-gray-400 " required>
                    <option value="">option</option>
                    <option>Marié</option>
                    <option>Célibataire</option>
                    <option>divorcé</option>
                </select></span>
                
                <Input int={adress} text="Adresse"
                     type="text" out={(e)=>setAdress(e.target.value)} require={true}/>    
                </div>

                <div className="flex justify-between">
                  <Input int={phone_number} text="Téléphone"
                     type="text" out={(e)=>setPhone_number(e.target.value)} require/>
                     
                  <Input int={email} text="email"
                     type="email" out={(e)=>setEmail(e.target.value)} require/>
                 </div>

                {/*faculty part */}
                <div className="flex justify-between">
                <span><label>Faculté:</label>
                <select value={faculty} onChange={(e)=>setFaculty(e.target.value)}
                    className=" mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-full bg-gray-300" required>
                    <option value="">option</option>
                    <option>Génie Civil</option>
                    <option>Médecine Générale</option>
                    <option>Odontologie</option>
                    <option>Sciences Infirmières</option>
                    <option> Sciences Administratives</option>
                    <option>Sciences Comptables</option>
                    <option>Science Informatique</option>
                    <option>Gestion Des Affaires</option>
                    <option>Sciences Agronomiques</option>
                    <option> Sciences Economiques</option>
                    <option>Sciences De L'Education</option>
                    <option>Sciences Juridiques</option>
                    <option>Pharmacologies</option>
                    <option>Médecine Vétérinaire</option>
                    <option> Laboratoire Médicale</option>
                    <option>Physiothérapie</option>
                    <option>Jardinières D'enfants</option>
                </select></span>

                <span><label>sexe</label>
                <select value={sex} onChange={(e)=>setSex(e.target.value)}
                    className="mr-[15%] mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text w-full bg-gray-300" required>
                    <option value="">options</option>
                    <option>Masculin</option>
                    <option>féminin</option>
                </select></span>
                </div>

            {/*section parent */}
            <div className="border-t-2 border-gray-600 mt-4">
              <div className="flex justify-between">
                <Input int={mother_name} text="Mère"
                     type="text" out={(e)=>setMother_name(e.target.value)} require={false}/>       
                 <Input int={mother_birth} text="lieu de naissance"
                     type="text" out={(e)=>setMother_birth(e.target.value)} require={false}/>
                   </div>           
            <div className="flex justify-between">
              <Input int={mother_residence} text="Domicile"
                     type="text" out={(e)=>setMother_residence(e.target.value)} require={false}/>
              <Input int={mother_phone} text="Téléphone"
                     type="text" out={(e)=>setMother_phone(e.target.value)} require={false}/>
            </div> 
             <Input int={mother_profesion} text="Profesion"
                     type="text" out={(e)=>setMother_profesion(e.target.value)} require={false}/>
            </div>
            {/*father section */}
            <div className="border-t-2 border-gray-600 mt-4">
            <div className="flex justify-between">
              <Input int={father_name} text="Père"
                     type="text" out={(e)=>setFather_name(e.target.value)} require={false}/>
              <Input int={father_birth} text="Lieu de naissance"
                     type="text" out={(e)=>setFather_birth(e.target.value)} require={false}/>
           </div>
            
            <div className="flex justify-between">
              <Input int={father_residence} text="Domicile"
                     type="text" out={(e)=>setFather_residence(e.target.value)} require={false}/>
                <Input int={father_phone} text="Téléphone"
                     type="text" out={(e)=>setFather_phone(e.target.value)} require={false}/>
           </div>
            
            <Input int={father_profesion} text="Prefession"
                     type="text" out={(e)=>setFather_profesion(e.target.value)} require={false}/>
          
            </div>
              <Input int={seen_by} text="Vue par"
                     type="text" out={(e)=>setSeen_by(e.target.value)} require={false}/>
                    
            <div className="">
              <div className="border border-gray-400 rounded-lg p-2 m-1 text-center">
                <h2>Code</h2>
           {code}
          <Code one={code} third={faculty} out={(value)=>setCode(value)}/>
         </div>
               <input type="checkbox" value={father_profesion}
            className=" mt-2.5 py-2 px-4 focus:outline-none
                  rounded-4xl placeholder:text mr-1 bg-gray-300"
                   onChange={(e)=>setAgreement(true)} required/>
            {/*button submit */}je m'engage a respecter les principes de l'UDEI.
            </div>
            <button type="submit" disabled={load}
             className={`${load === false ? "bg-[#2DAE0D] rounded-2xl text-white text-[20px] hover:bg-green-700 w-18.5 h-10" 
             : ""}`}>{load ? 'submiting' : 'submit'}</button>
            </form>
        </div>
    )
}