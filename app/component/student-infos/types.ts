/**
 * Centralized TypeScript types for student-related features
 * Replaces scattered interface/type definitions
 */

export type UserRole = 'admin' | 'editor' | 'administration' | 'prof'

export interface UserProfile {
  id: string
  role: UserRole
}

export interface StudentData {
  id: number
  first_name: string
  last_name: string
  faculty: string
  date_birth: string
  place_of_birth: string
  nif_cin: string
  sex: string
  email: string
  phone_number: string
  marital_status: string
  adress: string
  student_code: string
  mother_name: string
  mother_birth: string
  mother_residence: string
  mother_phone: string
  mother_profesion: string
  father_name: string
  father_birth: string
  father_residence: string
  father_phone: string
  father_profesion: string
  diploma: string
  enrol_date: string
  seen_by: string
  photo_url: string
  academy: string
}

export interface StudentStatus {
  id: number
  student_id: number
  enroll_year: string
  year_study: number
  faculty_completion: boolean
  faculty: string
  year_completed: number
}

export interface StudentPreview {
  id: number
  first_name: string
  last_name: string
  faculty: string
  student_code: string
}

export interface StudentSearchProps {
  studentCode?: string
  displayMode?: 'full-page' | 'modal'
  studentName?: string
  onClose?: () => void
  showSearchInputs?: boolean
}
