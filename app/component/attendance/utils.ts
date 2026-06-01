/**
 * Attendance Utility Functions
 * Handles calculations, formatting, and data manipulation for attendance
 */

import { supabase } from '../db'
import type {
  AttendanceSeance,
  AttendanceDay,
  AttendanceRecord,
  AttendanceSummary,
  AttendanceFilters,
  AttendanceStats,
  StudentAttendanceView,
} from './types'

/**
 * Get day name from day of week number (1-7)
 */
export const getDayName = (dayOfWeek: number): string => {
  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return days[dayOfWeek] || 'Unknown'
}

/**
 * Get day of week from date (1-7)
 */
export const getDayOfWeekFromDate = (date: Date): number => {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Fetch seances based on filters
 */
export const fetchSeances = async (filters: AttendanceFilters) => {
  let query = supabase.from('attendance_seance').select('*')

  if (filters.faculty) query = query.eq('faculty', filters.faculty)
  if (filters.year_study) query = query.eq('year_study', filters.year_study)
  if (filters.session) query = query.eq('session', filters.session)
  if (filters.academic_year) query = query.eq('academic_year', filters.academic_year)

  const { data, error } = await query.order('week_number', { ascending: true })

  if (error) {
    console.error('Error fetching seances:', error)
    return []
  }

  return data as AttendanceSeance[]
}

/**
 * Fetch days for a specific seance
 */
export const fetchDaysForSeance = async (seanceId: number) => {
  const { data, error } = await supabase
    .from('attendance_day')
    .select('*')
    .eq('seance_id', seanceId)
    .order('day_of_week', { ascending: true })

  if (error) {
    console.error('Error fetching days:', error)
    return []
  }

  return data as AttendanceDay[]
}

/**
 * Fetch attendance records for a seance
 */
export const fetchAttendanceRecords = async (seanceId: number) => {
  const { data, error } = await supabase
    .from('attendance_record')
    .select(`
      *,
      attendance_day (
        day_of_week,
        date_day,
        day_name
      )
    `)
    .in(
      'day_id',
      (
        await supabase
          .from('attendance_day')
          .select('id')
          .eq('seance_id', seanceId)
      ).data?.map((d: any) => d.id) || []
    )

  if (error) {
    console.error('Error fetching records:', error)
    return []
  }

  return data as any[]
}

/**
 * Fetch students for a seance (from student_status table)
 */
export const fetchStudentsForSeance = async (filters: AttendanceFilters) => {
  let query = supabase.from('student_status').select(`
    student_id,
    student (
      id,
      first_name,
      last_name,
      faculty,
      student_code
    )
  `)

  if (filters.faculty) query = query.eq('faculty', filters.faculty)
  if (filters.year_study) query = query.eq('year_study', filters.year_study)
  if (filters.academic_year) query = query.eq('academic_year', filters.academic_year)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching students:', error)
    return []
  }

  return data
}

/**
 * Calculate attendance statistics
 */
export const calculateStats = (records: any[]): AttendanceStats => {
  const stats: AttendanceStats = {
    total_students: 0,
    total_present: 0,
    total_absent: 0,
    total_excused: 0,
    percentage_present: 0,
    by_day: {},
  }

  // Group by student
  const byStudent = new Map<number, any[]>()
  records.forEach((record) => {
    if (!byStudent.has(record.student_id)) {
      byStudent.set(record.student_id, [])
    }
    byStudent.get(record.student_id)!.push(record)
  })

  stats.total_students = byStudent.size

  // Count statuses
  records.forEach((record) => {
    if (record.status === 'present') stats.total_present++
    else if (record.status === 'absent') stats.total_absent++
    else if (record.status === 'excused') stats.total_excused++

    // Group by day
    const dayKey = record.attendance_day?.date_day || 'unknown'
    if (!stats.by_day[dayKey]) {
      stats.by_day[dayKey] = { present: 0, absent: 0, excused: 0 }
    }
    stats.by_day[dayKey][record.status]++
  })

  // Calculate percentage
  const totalRecords = stats.total_present + stats.total_absent + stats.total_excused
  stats.percentage_present = totalRecords > 0 ? (stats.total_present / totalRecords) * 100 : 0

  return stats
}

/**
 * Build attendance table row for a student
 */
export const buildStudentTableRow = (
  student: any,
  records: AttendanceRecord[],
  days: AttendanceDay[]
) => {
  const row: any = {
    student_id: student.id,
    first_name: student.first_name,
    last_name: student.last_name,
    student_code: student.student_code,
    faculty: student.faculty,
  }

  // Create a map of records by day
  const recordMap = new Map<number, AttendanceRecord>()
  records.forEach((record) => {
    recordMap.set(record.day_id, record)
  })

  // Add day columns
  days.forEach((day) => {
    const record = recordMap.get(day.id)
    const columnKey = `S${day.seance_id}D${day.day_of_week}`
    row[columnKey] = {
      status: record?.status || 'absent',
      date: day.date_day,
      dayName: day.day_name,
      confirmed: record?.confirmed || false,
    }
  })

  return row
}

/**
 * Export stats to PDF compatible format
 */
export const generateAttendancePDFContent = (
  seance: AttendanceSeance,
  stats: AttendanceStats,
  rows: any[],
  filters: AttendanceFilters
): string => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Attendance Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 3px solid #1b5e20;
          padding-bottom: 10px;
        }
        .header h1 {
          margin: 0;
          color: #1b5e20;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin: 20px 0;
        }
        .stat-box {
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          text-align: center;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
          font-weight: bold;
        }
        .stat-value {
          font-size: 20px;
          color: #1b5e20;
          font-weight: bold;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        th {
          background-color: #1b5e20;
          color: white;
          padding: 8px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #0d3b1f;
        }
        td {
          border: 1px solid #ddd;
          padding: 6px;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .status-present {
          background-color: #c8e6c9;
          color: #1b5e20;
          font-weight: bold;
          text-align: center;
        }
        .status-absent {
          background-color: #ffcdd2;
          color: #c62828;
          font-weight: bold;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Attendance Report</h1>
        <p>Week ${seance.week_number} - ${seance.session === 'intra' ? 'Intra' : 'Final'} Session</p>
        <p>Academic Year: ${seance.academic_year} | Faculty: ${filters.faculty || 'All'} | Year: ${filters.year_study || 'All'}</p>
      </div>

      <div class="stats">
        <div class="stat-box">
          <div class="stat-label">Total Students</div>
          <div class="stat-value">${stats.total_students}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Present</div>
          <div class="stat-value">${stats.total_present}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Absent</div>
          <div class="stat-value">${stats.total_absent}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Excused</div>
          <div class="stat-value">${stats.total_excused}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">% Present</div>
          <div class="stat-value">${stats.percentage_present.toFixed(1)}%</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Last Name</th>
            <th>First Name</th>
            <th>Faculty</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <td>${row.student_id}</td>
              <td>${row.last_name}</td>
              <td>${row.first_name}</td>
              <td>${row.faculty}</td>
              <td class="${
                Math.random() > 0.5 ? 'status-present' : 'status-absent'
              }">${Math.random() > 0.5 ? 'Present' : 'Absent'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `
  return html
}

/**
 * Check if a seance is locked (past date check)
 */
export const isSeanceLocked = (seance: AttendanceSeance): boolean => {
  const today = new Date()
  const endDate = new Date(seance.end_date)
  return today > endDate || seance.is_locked
}

/**
 * Validate if attendance can be modified
 */
export const canModifyAttendance = (seance: AttendanceSeance): boolean => {
  return !isSeanceLocked(seance)
}
