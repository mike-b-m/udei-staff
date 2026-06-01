'use client'

import { useState, useCallback, useRef } from 'react'
import { 
  AttendanceFilter,
  AttendanceSummary,
  AttendanceTable,
  AttendanceActions,
  CreateSeanceModal,
  useAttendance,
  type AttendanceFilters,
  type AttendanceStatus,
} from '@/app/component/attendance'

const DEFAULT_FILTERS: AttendanceFilters = {
  faculty: '',
  year_study: 1,
  session: 'intra',
  academic_year: '',
}

export default function AttendancePage() {
  const [filters, setFilters] = useState<AttendanceFilters>(DEFAULT_FILTERS)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const {
    seances,
    selectedSeance,
    setSelectedSeance,
    days,
    rows,
    stats,
    isLoading,
    isConfirming,
    error,
    updateAttendanceStatus,
    confirmAttendance,
    reload,           // ← triggers a fresh fetch of seances
  } = useAttendance(filters)

  const canModify = selectedSeance ? !selectedSeance.is_locked : false

  // Stable callback — empty dep array means no re-render loop
  const handleFilterChange = useCallback((newFilters: AttendanceFilters) => {
    setFilters(newFilters)
  }, [])

  const handleStatusChange = useCallback(
    (studentId: number, dayId: number, status: AttendanceStatus) => {
      updateAttendanceStatus(studentId, dayId, status)
    },
    [updateAttendanceStatus]
  )

  const handleConfirm = useCallback(() => {
    if (selectedSeance) confirmAttendance(selectedSeance.id)
  }, [selectedSeance, confirmAttendance])

  const handleSeanceCreated = useCallback(() => {
    reload()           // re-fetch seances after creation
  }, [reload])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">📋</span>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Attendance Management
              </h1>
            </div>
            <p className="text-slate-500 text-sm ml-12">
              Track student presence &amp; absence across seances and sessions
            </p>
          </div>

          {/* Create Seance button — always visible */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            New Seance
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-2xl mb-6 flex items-center gap-2 text-sm">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Filters */}
        <AttendanceFilter
          onFilterChange={handleFilterChange}
          initialFilters={DEFAULT_FILTERS}
        />

        {/* Seance Selector + Action Buttons */}
        <AttendanceActions
          seances={seances}
          selectedSeance={selectedSeance}
          onSeanceSelect={setSelectedSeance}
          onConfirm={handleConfirm}
          isConfirming={isConfirming}
          canModify={canModify}
          rows={rows}
          days={days}
          stats={stats}
          filters={filters}
        />

        {/* Content: seance selected */}
        {!isLoading && selectedSeance && (
          <>
            <AttendanceSummary stats={stats} isLoading={isLoading} />

            {/* Lock status */}
            <div
              className={`mb-5 px-5 py-3 rounded-2xl border-l-4 flex items-center gap-2 text-sm ${
                canModify
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : 'bg-slate-50 border-slate-400 text-slate-600'
              }`}
            >
              <span>{canModify ? '✏️' : '🔒'}</span>
              <span>
                {canModify
                  ? 'This seance is open for editing. Click status cells to toggle attendance.'
                  : 'This seance is locked and read-only.'}
              </span>
            </div>

            {/* Table heading */}
            <div className="mb-4" id="attendance-table">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedSeance.session.toUpperCase()} Session — Week {selectedSeance.week_number}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {filters.faculty || 'All Faculties'} · Year {filters.year_study} ·{' '}
                {filters.academic_year || 'All Academic Years'}
              </p>
            </div>

            <div className="mb-8">
              <AttendanceTable
                rows={rows}
                days={days}
                stats={stats}
                onStatusChange={handleStatusChange}
                canModify={canModify}
                isLoading={isLoading}
              />
            </div>

            {/* Legend */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-800 mb-8">
              <div className="font-semibold mb-2">ℹ️ How it works</div>
              <ul className="space-y-1 text-xs text-blue-700">
                <li>• <strong>P</strong> — Present &nbsp;|&nbsp; <strong>A</strong> — Absent &nbsp;|&nbsp; <strong>E</strong> — Excused</li>
                <li>• Past-date cells and confirmed records cannot be edited</li>
                <li>• Once confirmed, all records in the seance are permanently locked</li>
                <li>• Use the view toggle above the table to filter Present-only or Absent-only students</li>
              </ul>
            </div>
          </>
        )}

        {/* Loading shimmer */}
        {isLoading && <AttendanceSummary stats={stats} isLoading={true} />}

        {/* Empty state — now with Create button */}
        {!isLoading && !selectedSeance && seances.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No seances found for these filters
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              A seance defines which week you are tracking attendance for.
              Create one to get started.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors"
            >
              <span className="text-lg leading-none">+</span>
              Create Your First Seance
            </button>
          </div>
        )}

      </div>

      {/* Create Seance Modal */}
      {showCreateModal && (
        <CreateSeanceModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleSeanceCreated}
          defaultFaculty={filters.faculty}
          defaultYear={filters.year_study}
          defaultSession={filters.session}
          defaultAcademicYear={filters.academic_year}
        />
      )}

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          #attendance-table { break-before: page; }
        }
      `}</style>
    </div>
  )
}
