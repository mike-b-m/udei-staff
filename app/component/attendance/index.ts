/**
 * Attendance Module - Barrel Export
 * Re-exports all attendance-related components, hooks, and utilities
 */

// Components
// export { AttendanceFilter } from './AttendanceFilter'
// export { AttendanceSummary } from './AttendanceSummary'
// export { AttendanceTable } from './AttendanceTable'
// export { AttendanceActions } from './AttendanceActions'
// export { CreateSeanceModal } from './CreateSeanceModal'

// Hooks
export { useAttendance } from './useAttendance'

// Types
export type {
  AttendanceStatus,
  SessionType,
  ViewMode,
  AttendanceSeance,
  AttendanceDay,
  AttendanceRecord,
  AttendanceFilters,
  AttendanceTableRow,
  DayStats,
  AttendanceStats,
} from './types'

// Utilities
export {
  getDayName,
  getDayOfWeekFromDate,
  formatDate,
  fetchSeances,
  fetchDaysForSeance,
  fetchAttendanceRecords,
  fetchStudentsForSeance,
  calculateStats,
  buildStudentTableRow,
  generateAttendancePDFContent,
  isSeanceLocked,
  canModifyAttendance,
} from './utils'

// Export utilities
export {
  generateAttendanceHTML,
  generateAttendanceTableHTML,
  downloadAttendanceAsCSV,
  downloadAttendanceAsPDF,
} from './exportAttendance'
export type {
  AttendanceExportFilters,
  AttendanceExportStats,
} from './exportAttendance'
