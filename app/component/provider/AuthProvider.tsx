"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {supabase} from "../db";
import Link from "next/link";
import {Loading2} from "@/app/component/loading/loading";

type AuthContextType = {
  user: any
  role: string | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser()

      setUser(data.user)
      if (error) console.error(error.message)
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single()

        setRole(profile?.role ?? null)
      }

      setLoading(false)
    }

    getUser()
  }, [])

  return (<div>
    <AuthContext.Provider value={{ user, role, loading }}>
      {children} 
    </AuthContext.Provider>
    </div>
  )
}

export const useAuth = () => useContext(AuthContext)