'use client'
import { useState, useEffect } from "react"
import { supabase } from "@/app/component/db"

interface FacultyPrice {
  id: number
  faculty: string
  price: number
}

export function useFaculties() {
  const [faculties, setFaculties] = useState<FacultyPrice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('faculty_price').select('*').order('faculty')
      setFaculties(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const facultyNames = faculties.map(f => f.faculty)

  return { faculties, facultyNames, loading }
}
