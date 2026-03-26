'use client'
import {useState, useEffect} from "react";
import Link from "next/link";
import {supabase} from "../db";
import { UUID } from "crypto";
import { redirect, usePathname } from "next/navigation";

type prof = {
  id: UUID
  full_name: string
  role: string
}

export default function Header(){
    const [user, setUser] = useState<any | null>(null)
    const [profiles, setProfiles] = useState<any | null>(null)
    const [open, setOpen] = useState(false)
    const [ses, setSes] = useState<any>()
    const [tOpen, setTOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const pathname = usePathname()

    const signOutall = async () => {
        setIsLoggingOut(true)
        const {error} = await supabase.auth.signOut()
        if (!error) window.location.reload()
    }

    useEffect(() => {
        const getData = async () => {
            const { data:{session}, error } = await supabase.auth.refreshSession()
            if (session){
                const { data:{user}, error } = await supabase.auth.getUser()
                if (error) console.log('Error', error.message)
                else {
                    setUser(user)
                    setTOpen(true)
                    setSes(session)
                }
                
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user?.id)
                    .maybeSingle()
                
                if (data?.role === 'prof' && pathname !== '/teacher') redirect('/teacher')
                if (data?.role === 'admistration' && pathname !== '/spend') redirect('/spend')
                if (error) console.error(error.message)
                else setProfiles(data)
            }
            
            if (session && pathname === '/login') redirect('/admin')
            if (!session) {
                console.error('not session find')
            } else if (error) console.error(error?.message)
            else setUser(user)
        }
        getData()
    }, [])

    return(
        <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-4 md:px-6 h-16 md:h-20">
                {/* Logo Section */}
                <div className="flex items-center">
                    <Link href="/" className="flex items-center gap-2 group">
                        <img 
                            src="/image/logo.png"
                            width={120}
                            height={40}
                            alt="logo"
                            className="h-10 w-auto"
                        />
                    </Link>
                </div>

                {/* Profile Section */}
                <div className="relative">
                    {tOpen ? (
                        <>
                            <button
                                onClick={() => setOpen(!open)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            >
                                {/* Avatar */}
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                                        {profiles?.full_name}
                                    </span>
                                    <span className="text-xs text-gray-500 capitalize">
                                        {profiles?.role}
                                    </span>
                                </div>
                                <div className="shrink-0">
                                    <img
                                        src="/profil.png"
                                        width={40}
                                        height={40}
                                        alt="user profile"
                                        className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-100"
                                    />
                                </div>

                                {/* Dropdown Icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {open && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                                    {/* Profile Info Card */}
                                    <div className="p-4 bg-linear-to-r from-blue-50 to-blue-100 border-b border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src="/profil.png"
                                                width={48}
                                                height={48}
                                                alt="profile"
                                                className="h-12 w-12 rounded-full object-cover ring-3 ring-white"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-gray-900 truncate">
                                                    {profiles?.full_name}
                                                </h3>
                                                <p className="text-xs text-gray-600 truncate">
                                                    {user?.email}
                                                </p>
                                                <div className="mt-1.5 inline-flex items-center px-2.5 py-1 rounded-full bg-blue-500 text-white">
                                                    <span className="text-xs font-semibold capitalize">
                                                        {profiles?.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => {
                                                setOpen(false)
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0M3.75 18H7.5" />
                                            </svg>
                                            <span>Paramètres</span>
                                        </button>

                                        <div className="h-px bg-gray-200 my-1"></div>

                                        <button
                                            onClick={signOutall}
                                            disabled={isLoggingOut}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                                            </svg>
                                            <span>{isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : tOpen ? null : null}
                </div>
            </div>
        </header>
    )
}