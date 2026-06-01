// /**
//  * Attendance System Types
//  */

// export type AttendanceStatus = 'present' | 'absent' | 'excused'
// export type SessionType = 'intra' | 'final'
// export type ViewMode = 'all' | 'present' | 'absent'

// export interface AttendanceSeance {
//   id: number
//   faculty: string
//   year_study: number
//   session: SessionType
//   academic_year: string
//   week_number: number
//   seance_type: 'seance' | 'exam'
//   start_date: string
//   end_date: string
//   is_locked: boolean
//   created_at: string
//   updated_at: string
//   created_by?: string
// }

// export interface AttendanceSummary {
//   id: number
//   seance_id: number
//   day_of_week: number   // 1=Mon ... 7=Sun
//   date_day: string
//   day_name: string
//   is_completed: boolean
//   created_at: string
//   updated_at: string
// }

// export interface AttendanceRecord {
//   id: number
//   day_id: number
//   student_id: number
//   status: AttendanceStatus
//   notes?: string
//   confirmed: boolean
//   confirmed_at?: string
//   confirmed_by?: string
//   created_at: string
//   updated_at: string
// }

// export interface AttendanceFilters {
//   faculty: string
//   year_study: number
//   session: SessionType
//   academic_year: string
// }

// // A row in the main table: student info + one cell per day
// export interface AttendanceTableRow {
//   student_id: number
//   last_name: string
//   first_name: string
//   student_code: string
//   faculty: string
//   year_study: number
//   // dynamic: key = `S{seance_id}D{day_of_week}` → { status, confirmed, dayId }
//   [key: string]: any
// }

// export interface DayStats {
//   present: number
//   absent: number
//   excused: number
// }

// export interface AttendanceStats {
//   total_students: number
//   total_present: number
//   total_absent: number
//   total_excused: number
//   percentage_present: number
//   by_day: Record<string, DayStats>   // key = day.id stringified
// }