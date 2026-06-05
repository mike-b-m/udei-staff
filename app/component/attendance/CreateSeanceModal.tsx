'use client'

import { useState,useEffect } from 'react'
import { supabase } from '../db'
import type { SessionType } from './types'

interface Props {
  onClose: () => void
  onCreated: () => void          // tells the parent to reload seances
  defaultFaculty?: string
  defaultYear?: number
  defaultSession?: SessionType
  defaultAcademicYear?: string
}

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

// Returns Monday of the week that contains `date`
function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function CreateSeanceModal({
  onClose,
  onCreated,
  defaultFaculty = '',
  defaultYear = 1,
  defaultSession = 'intra',
  defaultAcademicYear = '',
}: Props) {
  const today = new Date()
  const monday = getMondayOf(today)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const [faculty, setFaculty] = useState(defaultFaculty)
  const [yearStudy, setYearStudy] = useState(defaultYear)
  const [session, setSession] = useState<SessionType>(defaultSession)
  const [academicYear, setAcademicYear] = useState(
    defaultAcademicYear ||
      `${today.getFullYear()}-${today.getFullYear() + 1}`
  )
  const [weekNumber, setWeekNumber] = useState(1)
  const [startDate, setStartDate] = useState(formatDateInput(monday))
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]) // Mon–Fri default
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [faculties, setFaculties] = useState<string[]>([])

  //fetch faculty
  useEffect(() => {
      supabase
        .from('student')
        .select('faculty')
        .limit(1000)
        .then(({ data }) => {
          if (data) {
            setFaculties([...new Set(data.map((d: any) => d.faculty).filter(Boolean))] as string[])
          }
        })}, [])
  // Derived: end date = start + 6 days
  const endDate = (() => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + 6)
    return formatDateInput(d)
  })()

  const toggleDay = (dow: number) => {
    setSelectedDays((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow].sort()
    )
  }

  // dow 1=Mon…7=Sun, get actual date from start
  const getDayDate = (dow: number): string => {
    const base = new Date(startDate)
    const baseDay = base.getDay() // 0=Sun
    // base is Monday (dow=1), so offset = dow - 1
    const d = new Date(base)
    d.setDate(base.getDate() + (dow - 1))
    return formatDateInput(d)
  }

  const handleSave = async () => {
    if (!faculty.trim()) { setError('Faculty is required'); return }
    if (!academicYear.trim()) { setError('Academic year is required'); return }
    if (selectedDays.length === 0) { setError('Select at least one day'); return }

    setSaving(true)
    setError(null)

    try {
      // 1. Insert the seance
      const { data: seanceData, error: seanceErr } = await supabase
        .from('attendance_seance')
        .insert({
          faculty: faculty.trim(),
          year_study: yearStudy,
          session,
          academic_year: academicYear.trim(),
          week_number: weekNumber,
          seance_type: 'seance',
          start_date: startDate,
          end_date: endDate,
          is_locked: false,
        })
        .select()
        .single()

      if (seanceErr) throw seanceErr

      // 2. Insert a day row for each selected day
      const dayRows = selectedDays.map((dow) => ({
        seance_id: seanceData.id,
        day_of_week: dow,
        date_day: getDayDate(dow),
        day_name: DAY_NAMES[dow - 1],
        is_completed: false,
      }))

      const { error: dayErr } = await supabase
        .from('attendance_day')
        .insert(dayRows)

      if (dayErr) throw dayErr

      onCreated()
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Failed to create seance')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Créer une nouvelle séance</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Une « séance » correspond à une semaine de suivi des présences
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          {/* Faculty + Year side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Faculté <span className="text-red-400">*</span>
              </label><select
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          >
            <option value="">Tout Facultés</option>
            {faculties.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Année d'étude
              </label>
              <select
                value={yearStudy}
                onChange={(e) => setYearStudy(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
              >
                {[1, 2, 3, 4, 5, 6].map((y) => (
                  <option key={y} value={y}>{y} Année</option>
                ))}
              </select>
            </div>
          </div>

          {/* Session + Academic Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Session
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value as SessionType)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
              >
                <option value="intra">Intra</option>
                <option value="final">Final</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Année académique <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 2024-2025"
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
              />
            </div>
          </div>

          {/* Week number + Start date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Nombre de semain (S1–S7)
              </label>
              <select
                value={weekNumber}
                onChange={(e) => setWeekNumber(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((w) => (
                  <option key={w} value={w}>S{w} — semain {w}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                début de semaine (Lundi)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
              />
            </div>
          </div>

          {/* Day selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              jours à suivre <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {DAY_NAMES.map((name, i) => {
                const dow = i + 1
                const active = selectedDays.includes(dow)
                const dateStr = getDayDate(dow)
                return (
                  <button
                    key={dow}
                    onClick={() => toggleDay(dow)}
                    className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                      active
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span>{name.slice(0, 3)}</span>
                    <span className={`text-[10px] font-normal mt-0.5 ${active ? 'text-indigo-400' : 'text-slate-300'}`}>
                      {dateStr.slice(5)}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-slate-400">
              Week runs {startDate} → {endDate} · {selectedDays.length} jour(s) sélectionné(s)
            </p>
          </div>

          {/* Info note */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
            ℹ️  Chaque jour sélectionné apparaît sous forme de colonne (D1–D7) dans le tableau des présences. Les étudiants de{' '}
            <strong>student_status</strong> correspondant à la faculté, à l'année et à l'année universitaire que vous avez saisies s'afficheront automatiquement.
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
          >
            annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {saving ? '⏳ Creating…' : '✓ Create Seance'}
          </button>
        </div>
      </div>
    </div>
  )
}

//export default CreateSeanceModal
