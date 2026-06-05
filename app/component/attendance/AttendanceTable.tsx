'use client'

import { useState } from 'react'
import type {
  AttendanceTableRow,
  AttendanceSummary,
  AttendanceStatus,
  AttendanceStats,
  ViewMode,
} from './types'

interface Props {
  rows: AttendanceTableRow[]
  days: AttendanceSummary[]
  stats: AttendanceStats
  onStatusChange?: (studentId: number, dayId: number, status: AttendanceStatus) => void
  canModify: boolean
  isLoading: boolean
}

const STATUS_CYCLE: Record<AttendanceStatus, AttendanceStatus> = {
  absent: 'present',
  present: 'excused',
  excused: 'absent',
}

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: 'P',
  absent: 'A',
  excused: 'E',
}

const STATUS_CLASSES: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  absent: 'bg-red-100 text-red-700 ring-red-300',
  excused: 'bg-amber-100 text-amber-700 ring-amber-300',
}

export function AttendanceTable({
  rows,
  days,
  stats,
  onStatusChange,
  canModify,
  isLoading,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('all')

  const filteredRows = rows.filter((row) => {
    if (viewMode === 'all') return true
    // Check if student has at least one present/absent across all days
    const statuses = days.map((day) => {
      const key = `S${day.seance_id}D${day.day_of_week}`
      return row[key]?.status as AttendanceStatus
    })
    if (viewMode === 'present') return statuses.some((s) => s === 'present')
    if (viewMode === 'absent') return statuses.every((s) => s !== 'present')
    return true
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm">Chargement des données de présence…</span>
          </div>
        </div>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
        <div className="text-5xl mb-3">📭</div>
        <p className="text-slate-500">Aucun étudiant ne correspond aux critères sélectionnés.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* View Mode Toggle */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-700">
          Showing <span className="text-indigo-600">{filteredRows.length}</span> of {rows.length} students
        </div>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {(['all', 'present', 'absent'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                viewMode === mode
                  ? 'bg-white shadow text-indigo-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {mode === 'all' ? '👁 All' : mode === 'present' ? '✅ Present' : '❌ Absent'}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex gap-4 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 h-5 rounded bg-emerald-100 text-emerald-800 text-center leading-5 font-bold text-xs">P</span>
          Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 h-5 rounded bg-red-100 text-red-700 text-center leading-5 font-bold text-xs">A</span>
          Absent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 h-5 rounded bg-amber-100 text-amber-700 text-center leading-5 font-bold text-xs">E</span>
          Excused
        </span>
        {canModify && (
          <span className="ml-auto text-indigo-500 font-medium">
            ✏️ Cliquez sur une cellule pour basculer : A → P → E
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-indigo-700 text-white">
              <th className="sticky left-0 z-20 bg-indigo-700 px-4 py-3 text-left font-semibold w-8 text-xs">#</th>
              <th className="sticky left-8 z-20 bg-indigo-700 px-4 py-3 text-left font-semibold min-w-22.5 text-xs">ID</th>
              <th className="px-4 py-3 text-left font-semibold min-w-30 text-xs">Nom</th>
              <th className="px-4 py-3 text-left font-semibold min-w-25 text-xs">Prénom</th>
              <th className="px-4 py-3 text-left font-semibold min-w-20 text-xs">Faculté</th>
              {days.map((day) => (
                <th
                  key={day.id}
                  className="px-2 py-3 text-center font-semibold min-w-13.5 text-xs"
                  title={`${day.day_name} ${day.date_day}`}
                >
                  <div className="font-bold">{day.day_name.slice(0, 3)}</div>
                  <div className="text-indigo-300 text-[10px] font-normal">
                    {day.date_day.slice(5)}
                  </div>
                </th>
              ))}
            </tr>

            {/* Per-day stats */}
            <tr className="bg-indigo-50 text-xs border-b border-indigo-100">
              <td colSpan={5} className="sticky left-0 bg-indigo-50 px-4 py-2 text-indigo-600 font-semibold">
                Totaux quotidiens
              </td>
              {days.map((day) => {
                const d = stats.by_day[String(day.id)]
                return (
                  <td key={day.id} className="px-1 py-2 text-center">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-emerald-600 font-bold">{d?.present ?? 0}</span>
                      <span className="text-red-500">{d?.absent ?? 0}</span>
                    </div>
                  </td>
                )
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((row, idx) => (
              <tr key={row.student_id} className="hover:bg-slate-50 transition-colors">
                <td className="sticky left-0 z-10 bg-white px-4 py-2.5 text-slate-400 text-xs font-medium hover:bg-slate-50">
                  {idx + 1}
                </td>
                <td className="sticky left-8 z-10 bg-white px-4 py-2.5 font-mono text-xs text-slate-700 hover:bg-slate-50">
                  {row.student_id}
                </td>
                <td className="px-4 py-2.5 font-medium text-slate-800">{row.last_name}</td>
                <td className="px-4 py-2.5 text-slate-600">{row.first_name}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{row.faculty}</td>

                {days.map((day) => {
                  const key = `S${day.seance_id}D${day.day_of_week}`
                  const cell = row[key] ?? { status: 'absent', confirmed: false, dayId: day.id }
                  const status = cell.status as AttendanceStatus
                  const editable = canModify && !cell.confirmed
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const cellDate = new Date(day.date_day.replace(/-/g, '/'))
                  cellDate.setHours(0, 0, 0, 0)
                  const isPast = cellDate < today

                  return (
                    <td key={day.id} className="px-2 py-2.5 text-center">
                      <button
                        onClick={() => {
                          if (!editable || isPast) return
                          onStatusChange?.(row.student_id, cell.dayId, STATUS_CYCLE[status])
                        }}
                        disabled={!editable || isPast}
                        title={
                          isPast && !cell.confirmed
                            ? 'Past date – cannot edit'
                            : cell.confirmed
                            ? 'Confirmed – locked'
                            : `Click to change (${status})`
                        }
                        className={`
                          w-8 h-8 rounded-lg font-bold text-xs transition-all ring-1
                          ${STATUS_CLASSES[status]}
                          ${editable && !isPast
                            ? 'hover:ring-2 hover:scale-110 cursor-pointer active:scale-95'
                            : 'opacity-70 cursor-default'
                          }
                          ${cell.confirmed ? 'ring-2 ring-indigo-400' : ''}
                        `}
                      >
                        {STATUS_LABEL[status]}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
        💡 Faites défiler vers la droite pour voir tous les jours. Anneau bleu = enregistrement confirmé (verrouillé).
      </div>
    </div>
  )
}

//export default AttendanceTable
