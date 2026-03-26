import { useState } from "react";
import Add_dept from "../add-dept/page";
import { supabase } from "../db";
import Input from "../input/input-comp";
interface add{
    id: number
    value: string
}
interface nam{
    value: string
    name: string
    id: number
}
export default function Add_botton(){
    const [open, setOpen]= useState(false)
    
    return(
        <>
        {open ? <div><Add_dept onOpen={()=>setOpen(false)}/></div> :
         <div className="text-right"><button className="bg-[#2DAE0D] rounded-2xl
             text-white text-[20px] hover:bg-green-700 w-25 h-8" onClick={(e)=>setOpen(true)}>add new</button></div>}
        </>
    )
}

export function Delete_button({id,value,name}:nam){
    const [open,setOpen] = useState(false)
    const [desable,setDisable]= useState(false)
    const [confirm,setConfirm] = useState('')
    const [cOpen,setCOpen] = useState(false)
    const [Error,setError] = useState('')
    const [opError,setOpError] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')
    
    const handleDelete= async ()=> {
        if(name === confirm){
            setDisable(true)
            const {error:status_error } =  await supabase.from(value)
             .delete()
             .eq('id', id)
             .select()

            if (status_error) {
                console.error(status_error.message)
                setError('Erreur lors de la suppression')
                setOpError(true)
                setTimeout(() => {setOpError(false)}, 3000);
            } else {
                setSuccessMsg('Supprimé avec succès')
                setOpen(true)
                setTimeout(() => {
                    setOpen(false)
                    setConfirm('')
                    setCOpen(false)
                }, 2500);
            }
            setDisable(false)
        } else {
            setError(`Confirmation incorrecte - Veuillez entrer "${name}"`)
            setOpError(true)
            setTimeout(() => {setOpError(false) }, 3000);
        }
    }

    return(
        <div className="relative">
            {/* Success Notification */}
            {open && (
                <div className="fixed top-6 right-6 bg-linear-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-slide-down">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M8.603 3.799A4.823 4.823 0 0 0 5.29 6.21a4.823 4.823 0 0 0 3.712 8.465 4.986 4.986 0 0 0 3.138-1.126 4.823 4.823 0 0 0 3.134-3.134 4.823 4.823 0 0 0-8.86-2.05zM15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{successMsg}</span>
                </div>
            )}

            {/* Error Notification */}
            {opError && (
                <div className="fixed top-6 right-6 bg-linear-to-r from-red-500 to-rose-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-slide-down">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{Error}</span>
                </div>
            )}

            {/* Confirmation Modal */}
            {cOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                        {/* Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmer la suppression</h2>
                            <div className="h-1 w-16 bg-linear-to-r from-red-500 to-rose-500 rounded-full"></div>
                        </div>

                        {/* Warning Message */}
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-800 font-medium">
                                Cette action est irréversible. Tapez <span className="font-bold text-red-600">"{name}"</span> pour confirmer.
                            </p>
                        </div>

                        {/* Input Field */}
                        <div className="mb-6">
                            <Input
                                label="Confirmation"
                                type="text"
                                value={confirm}
                                onChange={(e)=>setConfirm(e.target.value)}
                                required={true}
                                error={''}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button 
                                onClick={()=>{setCOpen(false); setConfirm('')}}
                                disabled={desable}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleDelete}
                                disabled={desable || confirm !== name}
                                className={`flex-1 px-4 py-3 font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
                                    confirm === name && !desable 
                                        ? 'bg-linear-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {desable ? (
                                    <>
                                        <span className="inline-block animate-spin">⟳</span>
                                        Suppression...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                            <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478m-3.622.986a48.678 48.678 0 0 0-1.122-.313m0 0a3 3 0 0 0-3 3v7.5M5.25 6.375a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v7.5m-15-6h16.5m-1.5 16.5H7.5a3 3 0 0 1-3-3V15m19.5 0a3 3 0 0 0-3-3H5.25a3 3 0 0 0-3 3v4.5a3 3 0 0 0 3 3h13.5a3 3 0 0 0 3-3v-4.5z" clipRule="evenodd" />
                                        </svg>
                                        Supprimer
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Button */}
            <button 
                onClick={()=>setCOpen(true)} 
                disabled={desable}
                className={`p-2 rounded-full transition duration-300 ${
                    desable 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-red-500 hover:bg-red-100 hover:text-red-700'
                }`}
                title="Supprimer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
            </button>
        </div>
    )
}
export function Update({id,value}:add){
    const [faculty,setFaculty] = useState(value)
    const [price, setPrice] = useState<number | string>('')
    const [open,setOpen] = useState(false)
    const [load,setLoad] = useState(false)
    const [save,setSave]= useState(false)
    const [error, setError] = useState('')
    const [showError, setShowError] = useState(false)

    const handleUpdate= async ()=> { 
        if(!faculty || !price) {
            setError('Veuillez remplir tous les champs')
            setShowError(true)
            setTimeout(() => setShowError(false), 3000)
            return
        }

        setLoad(true)
        const {error:status_error } =  await supabase.from('faculty_price')
            .update({faculty, price: Number(price)})
            .eq('id', id)
            .select()

        if (status_error) {
            console.error(status_error.message)
            setError('Erreur lors de la mise à jour')
            setShowError(true)
            setTimeout(() => setShowError(false), 3000)
        } else {
            setSave(true)
            setTimeout(() => {
                setSave(false)
                setOpen(false)
            }, 2500);
        }
        setLoad(false)
    }

    return(
        <div className="relative">
            {/* Success Notification */}
            {save && (
                <div className="fixed top-6 right-6 bg-linear-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Mise à jour réussie</span>
                </div>
            )}

            {/* Error Notification */}
            {showError && (
                <div className="fixed top-6 right-6 bg-linear-to-r from-red-500 to-rose-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Edit Modal */}
            {open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                        {/* Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Modifier la faculté</h2>
                            <div className="h-1 w-16 bg-linear-to-r from-blue-600 to-blue-500 rounded-full"></div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4 mb-6">
                            <div>
                                <Input
                                    label="Faculté"
                                    type="text"
                                    value={faculty}
                                    onChange={(e)=>setFaculty(e.target.value)}
                                    required={true}
                                    error={''}
                                />
                            </div>
                            <div>
                                <Input
                                    label="Prix (HTG)"
                                    type="number"
                                    value={price}
                                    onChange={(e)=>setPrice(e.target.value)}
                                    required={true}
                                    error={''}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button 
                                onClick={()=>{setOpen(false); setError('')}}
                                disabled={load}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleUpdate}
                                disabled={load}
                                className="flex-1 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition disabled:from-gray-400 disabled:to-gray-400 flex items-center justify-center gap-2"
                            >
                                {load ? (
                                    <>
                                        <span className="inline-block animate-spin">⟳</span>
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                        Enregistrer
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit & Delete Buttons */}
            <div className="flex gap-2">
                <button 
                    onClick={()=>setOpen(true)}
                    className="flex-1 px-4 py-2 bg-linear-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                    Modifier
                </button>
                <Delete_button name={value} id={id} value="faculty_price"/>
            </div>
        </div>
    )
}