'use client'

import { useState, useEffect } from 'react'
import type { AttendanceSeance, AttendanceSummary, AttendanceTableRow, AttendanceStats } from './types'
import { generateAttendanceTableHTML, downloadAttendanceAsCSV, downloadAttendanceAsPDF } from './exportAttendance'

interface Props {
  seances: AttendanceSeance[]
  selectedSeance: AttendanceSeance | null
  onSeanceSelect: (s: AttendanceSeance) => void
  onConfirm: () => void
  isConfirming: boolean
  canModify: boolean
  rows: AttendanceTableRow[]
  days: AttendanceSummary[]
  stats: AttendanceStats
  filters: { faculty?: string; year_study?: number; academic_year?: string }
}

export function AttendanceActions({
  seances,
  selectedSeance,
  onSeanceSelect,
  onConfirm,
  isConfirming,
  canModify,
  rows,
  days,
  stats,
  filters,
}: Props) {
  const [showModal, setShowModal] = useState(false)
  const [confirmSeanceId, setConfirmSeanceId] = useState<number | ''>(
    selectedSeance?.id ?? ''
  )

  // Keep the modal's seance selection in sync with the parent's selected seance
  useEffect(() => {
    setConfirmSeanceId(selectedSeance?.id ?? '')
  }, [selectedSeance?.id])

  const handleExport = (format: 'pdf' | 'excel' | 'print') => {
    if (!rows.length || !days.length) {
      alert('No data to export')
      return
    }
    if (format === 'print') {
      window.print()
      return
    }
    if (format === 'excel') {
      downloadAttendanceAsCSV(rows, `attendance_week${selectedSeance?.week_number}.csv`)
      return
    }
    if (format === 'pdf') {
      const tableHTML = generateAttendanceTableHTML(rows, days)
      downloadAttendanceAsPDF(
        'Attendance Report',
        selectedSeance?.week_number ?? 1,
        selectedSeance?.session ?? 'intra',
        {
          faculty: filters.faculty,
          year_study: filters.year_study,
          academic_year: filters.academic_year,
        },
        stats,
        tableHTML,
        `attendance_week${selectedSeance?.week_number}.pdf`
      )
    }
  }

  const handleOpenModal = () => {
    setConfirmSeanceId(selectedSeance?.id ?? '')
    setShowModal(true)
  }

  const handleConfirmSubmit = () => {
    if (!confirmSeanceId) return
    // Find the seance to confirm matches selected (or modal selection)
    onConfirm()
    setShowModal(false)
  }

  return (
    <>
      {/* Seance Week Selector */}
      {seances.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Select Week
          </p>
          <div className="flex flex-wrap gap-2">
            {seances.map((seance) => {
              const active = selectedSeance?.id === seance.id
              return (
                <button
                  key={seance.id}
                  onClick={() => onSeanceSelect(seance)}
                  className={`flex flex-col items-center px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    active
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'border-slate-200 text-slate-600 hover:border-indigo-300 bg-white'
                  }`}
                >
                  <span>Week {seance.week_number}</span>
                  <span className={`text-[10px] font-normal capitalize mt-0.5 ${active ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {seance.session} {seance.is_locked ? '🔒' : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4 mb-5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Confirm + Skip */}
        <div className="flex gap-2">
          {canModify && (
            <>
              <button
                onClick={handleOpenModal}
                disabled={isConfirming || !selectedSeance}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                {isConfirming ? (
                  <><span className="animate-spin">⏳</span> Confirming…</>
                ) : (
                  <><span>✓</span> Confirm Presence</>
                )}
              </button>
              <button
                disabled={!selectedSeance}
                onClick={() => alert('Skip: revert to all-absent for this seance')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                ⊘ Skip
              </button>
            </>
          )}
        </div>

        {/* Right: Export */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-semibold transition-colors border border-red-200"
          >
            📄 PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold transition-colors border border-emerald-200"
          >
            📊 Excel
          </button>
          <button
            onClick={() => handleExport('print')}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold transition-colors border border-blue-200"
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl shrink-0">
                ✅
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Confirm Presence</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Select the seance to confirm and lock.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Seance
              </label>
              <select
                value={confirmSeanceId}
                onChange={(e) => setConfirmSeanceId(Number(e.target.value) || '')}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">-- Select a seance --</option>
                {seances.map((s) => (
                  <option key={s.id} value={s.id}>
                    Week {s.week_number} — {s.session.toUpperCase()}
                    {s.is_locked ? ' (already locked)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-800">
                ⚠️ <strong>Warning:</strong> Once confirmed, this seance cannot be modified.
                Make sure all attendance data is correct before proceeding.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={!confirmSeanceId}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Confirm & Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

//export default AttendanceActions
