'use client'

import type { AttendanceStats } from './types'

interface Props {
  stats: AttendanceStats
  isLoading?: boolean
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string
  value: string | number
  sub?: string
  color: string
  icon: string
}) {
  return (
    <div className={`rounded-2xl p-5 border ${color} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
      {sub && <div className="text-xs opacity-60">{sub}</div>}
    </div>
  )
}

export function AttendanceSummary({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl h-28 bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  const pctColor =
    stats.percentage_present >= 80
      ? 'text-emerald-600'
      : stats.percentage_present >= 60
      ? 'text-amber-600'
      : 'text-red-600'

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <StatCard
        label="Total Students"
        value={stats.total_students}
        icon="👥"
        color="bg-slate-50 border-slate-200 text-slate-700"
      />
      <StatCard
        label="Present"
        value={stats.total_present}
        sub={`out of ${stats.total_students}`}
        icon="✅"
        color="bg-emerald-50 border-emerald-200 text-emerald-700"
      />
      <StatCard
        label="Absent"
        value={stats.total_absent}
        sub={`${stats.total_students - stats.total_present} not attending`}
        icon="❌"
        color="bg-red-50 border-red-200 text-red-700"
      />
      <StatCard
        label="Excused"
        value={stats.total_excused}
        icon="📋"
        color="bg-amber-50 border-amber-200 text-amber-700"
      />
      <div className={`rounded-2xl p-5 border bg-indigo-50 border-indigo-200 text-indigo-700 flex flex-col gap-2`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
            % Present
          </span>
          <span className="text-xl">📊</span>
        </div>
        <div className={`text-3xl font-bold ${pctColor}`}>
          {stats.percentage_present.toFixed(1)}%
        </div>
        {/* Mini progress bar */}
        <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              stats.percentage_present >= 80
                ? 'bg-emerald-500'
                : stats.percentage_present >= 60
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${stats.percentage_present}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default AttendanceSummary
