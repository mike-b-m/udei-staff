/**
 * Custom React hooks for student data fetching
 * Eliminates data fetching logic duplication between StudentInfos and StudentInfos2
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../db'
import { StudentData, StudentStatus, UserProfile, StudentPreview } from './types'

/**
 * Hook: Fetch complete student data (personal info + status + role)
 * Only re-fetches when studentCode changes
 */
export const useStudentData = (studentCode: string | null) => {
  const [student, setStudent] = useState<StudentData | null>(null)
  const [status, setStatus] = useState<StudentStatus | null>(null)
  const [userRole, setUserRole] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!studentCode) {
      setStudent(null)
      setStatus(null)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch student personal info
        const { data: studentData, error: studentError } = await supabase
          .from('student')
          .select('*')
          .eq('student_code', studentCode)
          .single()

        if (studentError) throw new Error('Étudiant non trouvé')
        if (!studentData) throw new Error('Pas de données disponibles')

        setStudent(studentData)

        // Fetch student academic status
        if (studentData?.id) {
          const { data: statusData, error: statusError } = await supabase
            .from('student_status')
            .select('*')
            .eq('student_id', studentData.id)
            .maybeSingle()

          if (!statusError && statusData) {
            setStatus(statusData)
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Une erreur est survenue'
        setError(message)
        console.error('Erreur de récupération données:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [studentCode])

  // Fetch user role only once on mount (optimization)
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw authError

        const { data: roleData, error: roleError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (!roleError && roleData) {
          setUserRole(roleData as UserProfile)
        }
      } catch (err) {
        console.error('Erreur récupération rôle:', err)
      }
    }

    fetchUserRole()
  }, []) // Empty dependency - only on mount

  return { student, status, userRole, loading, error }
}

/**
 * Hook: Search students by name
 * Used for search dropdown/autocomplete
 */
export const useStudentSearch = () => {
  const [searchResults, setSearchResults] = useState<StudentPreview[]>([])
  const [searching, setSearching] = useState(false)

  const search = async (firstName: string, lastName: string) => {
    if (!firstName && !lastName) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const { data, error } = await supabase
        .from('student')
        .select('id,first_name,last_name,faculty,student_code')
        .ilike('first_name', `%${firstName}%`)
        .ilike('last_name', `%${lastName}%`)
        .limit(10) // Limit to prevent too many results

      if (error) throw error
      setSearchResults(data || [])
    } catch (err) {
      console.error('Erreur de recherche:', err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  return { searchResults, searching, search }
}
