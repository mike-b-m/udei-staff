/**
 * Attendance Module - Barrel Export
 * Re-exports all attendance-related components, hooks, and utilities
 */

// Components
export { AttendanceFilter } from './AttendanceFilter'
export { AttendanceSummary } from './AttendanceSummary'
export { AttendanceTable } from './AttendanceTable'
export { AttendanceActions } from './AttendanceActions'

// Hooks
export { useAttendance } from './useAttendance'

// Types
export type {
  AttendanceStatus,
  SessionType,
  AttendanceSeance,
  AttendanceDay,
  AttendanceRecord,
  AttendanceSummary,
  AttendanceFilters,
  StudentAttendanceView,
  AttendanceTableRow,
  AttendanceStats,
  AttendanceExportData,
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
  printAttendanceReport,
  downloadAttendanceAsCSV,
  downloadAttendanceAsPDF,
  generateAttendanceTableHTML,
} from './exportAttendance'
export type {
  AttendanceExportFilters,
  AttendanceExportStats,
} from './exportAttendance'
