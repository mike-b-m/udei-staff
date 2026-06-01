'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../db'
import type {
  AttendanceSeance,
  AttendanceDay,
  AttendanceRecord,
  AttendanceFilters,
  AttendanceStats,
  AttendanceStatus,
  AttendanceTableRow,
} from './types'

// ─── helpers ────────────────────────────────────────────────────────────────

function buildRows(
  students: any[],
  records: any[],
  days: AttendanceDay[]
): AttendanceTableRow[] {
  if (students.length === 0) {
    console.warn('[Attendance] buildRows: no students passed in. Check student_status and student tables.')
  }
  return students
    .filter((ss) => ss.student != null)
    .map((ss) => {
      const student = ss.student
      const row: AttendanceTableRow = {
        student_id: student.id,
        last_name:  student.last_name  ?? '',
        first_name: student.first_name ?? '',
        student_code: student.student_code ?? '',
        faculty:    student.faculty ?? ss.faculty ?? '',
        year_study: ss.year_study,
      }
      days.forEach((day) => {
        const rec = records.find(
          (r) => r.student_id === student.id && r.day_id === day.id
        )
        const key = `S${day.seance_id}D${day.day_of_week}`
        row[key] = {
          status:    rec?.status    ?? 'absent',
          confirmed: rec?.confirmed ?? false,
          dayId:     day.id,
          date:      day.date_day,
        }
      })
      return row
    })
}

function calcStats(
  rows: AttendanceTableRow[],
  days: AttendanceDay[]
): AttendanceStats {
  const stats: AttendanceStats = {
    total_students: rows.length,
    total_present: 0,
    total_absent: 0,
    total_excused: 0,
    percentage_present: 0,
    by_day: {},
  }

  days.forEach((day) => {
    const key = `S${day.seance_id}D${day.day_of_week}`
    const dayKey = String(day.id)
    stats.by_day[dayKey] = { present: 0, absent: 0, excused: 0 }
    rows.forEach((row) => {
      const cell = row[key]
      const status: AttendanceStatus = cell?.status ?? 'absent'
      stats.by_day[dayKey][status]++
      stats[`total_${status}` as 'total_present' | 'total_absent' | 'total_excused']++
    })
  })

  const total = stats.total_present + stats.total_absent + stats.total_excused
  stats.percentage_present = total > 0 ? (stats.total_present / total) * 100 : 0

  return stats
}

// ─── hook ────────────────────────────────────────────────────────────────────

export function useAttendance(filters: AttendanceFilters) {
  const [reloadTick, setReloadTick] = useState(0)   // bump to force seance refetch
  const [seances, setSeances] = useState<AttendanceSeance[]>([])
  const [selectedSeance, setSelectedSeance] = useState<AttendanceSeance | null>(null)
  const [days, setDays] = useState<AttendanceDay[]>([])
  const [rows, setRows] = useState<AttendanceTableRow[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    total_students: 0,
    total_present: 0,
    total_absent: 0,
    total_excused: 0,
    percentage_present: 0,
    by_day: {},
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep a stable ref so callbacks can read latest selectedSeance without
  // being in the dependency array (avoids the infinite-loop bug).
  const selectedSeanceRef = useRef<AttendanceSeance | null>(null)
  selectedSeanceRef.current = selectedSeance

  // ── 1. Fetch seances when filters change ──────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        let q = supabase.from('attendance_seance').select('*')
        if (filters.faculty) q = q.eq('faculty', filters.faculty)
        if (filters.year_study) q = q.eq('year_study', filters.year_study)
        //if (filters.session) q = q.eq('session', filters.session)
        if (filters.academic_year) q = q.eq('academic_year', filters.academic_year)
        q = q.order('week_number', { ascending: true })

        const { data, error: err } = await q
        if (cancelled) return
        if (err) throw err

        const list = (data ?? []) as AttendanceSeance[]
        setSeances(list)
        // Auto-select first seance; reset if filters changed
        setSelectedSeance((prev) => {
          if (!prev) return list[0] ?? null
          // Keep selection if it still exists in the new list
          const still = list.find((s) => s.id === prev.id)
          return still ?? list[0] ?? null
        })
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Failed to load seances')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  // Only primitive filter values as deps — avoids object-reference churn
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.faculty, filters.year_study, filters.session, filters.academic_year, reloadTick])

  // ── 2. Fetch days + attendance when seance changes ────────────────────────
  useEffect(() => {
    if (!selectedSeance) {
      setDays([])
      setRows([])
      setStats({
        total_students: 0, total_present: 0, total_absent: 0,
        total_excused: 0, percentage_present: 0, by_day: {},
      })
      return
    }

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const seance = selectedSeance!

        // Days
        const { data: daysData, error: dErr } = await supabase
          .from('attendance_day')
          .select('*')
          .eq('seance_id', seance.id)
          .order('day_of_week', { ascending: true })
        if (cancelled) return
        if (dErr) throw dErr
        const dList = (daysData ?? []) as AttendanceDay[]

        // Records for those days
        const dayIds = dList.map((d) => d.id)
        let records: AttendanceRecord[] = []
        if (dayIds.length) {
          const { data: rData, error: rErr } = await supabase
            .from('attendance_record')
            .select('*')
            .in('day_id', dayIds)
          if (cancelled) return
          if (rErr) throw rErr
          records = (rData ?? []) as AttendanceRecord[]
        }

        // ── Step A: fetch student_status rows matching the filters ──────────
        // We do NOT use the nested FK syntax `student(...)` because it requires
        // a foreign key constraint in Supabase. Instead we do two plain queries.
        const targetFaculty      = filters.faculty      || seance.faculty
        const targetYear         = filters.year_study   || seance.year_study
        const targetAcademicYear = filters.academic_year || seance.academic_year

        let ssQuery = supabase
          .from('student_status')
          .select('id, student_id, year_study, faculty, academic_year')

        if (targetFaculty)      ssQuery = ssQuery.eq('faculty',       targetFaculty)
        if (targetYear)         ssQuery = ssQuery.eq('year_study',     targetYear)
        if (targetAcademicYear) ssQuery = ssQuery.eq('academic_year',  targetAcademicYear)

        const { data: ssData, error: ssErr } = await ssQuery
        if (cancelled) return
        if (ssErr) throw ssErr

        const statusRows = ssData ?? []

        // ── Step B: fetch student details for those student_ids ──────────────
        const studentIds = [...new Set(statusRows.map((s: any) => s.student_id))]

        let studentRows: any[] = []
        if (studentIds.length > 0) {
          const { data: stData, error: stErr } = await supabase
            .from('student')
            .select('id, first_name, last_name, faculty, student_code')
            .in('id', studentIds)
          if (cancelled) return
          if (stErr) throw stErr
          studentRows = stData ?? []
        }

        // ── Step C: merge them — student_status + student ────────────────────
        const studentMap = new Map(studentRows.map((s: any) => [s.id, s]))
        const mergedData = statusRows
          .map((ss: any) => ({ ...ss, student: studentMap.get(ss.student_id) }))
          .filter((ss: any) => ss.student != null)   // skip orphan status rows

        // 🔍 DEBUG — open browser console (F12) to see these
        console.group('[Attendance] Data loaded')
        console.log('Filters used:', { targetFaculty, targetYear, targetAcademicYear })
        console.log('student_status rows:', statusRows.length, statusRows)
        console.log('student rows:', studentRows.length, studentRows)
        console.log('merged (student+status):', mergedData.length, mergedData)
        console.log('attendance_day rows:', dList.length, dList)
        console.log('attendance_record rows:', records.length)
        console.groupEnd()

        const tableRows = buildRows(mergedData, records, dList)
        const tableStats = calcStats(tableRows, dList)

        if (!cancelled) {
          setDays(dList)
          setRows(tableRows)
          setStats(tableStats)
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Failed to load attendance data')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedSeance?.id,
    filters.faculty,
    filters.year_study,
    filters.academic_year,
  ])

  // ── 3. Update a single cell ───────────────────────────────────────────────
  const updateAttendanceStatus = useCallback(
    async (studentId: number, dayId: number, status: AttendanceStatus) => {
      // Optimistic update
      setRows((prev) =>
        prev.map((row) => {
          if (row.student_id !== studentId) return row
          const updated = { ...row }
          // Find the matching key
          for (const key of Object.keys(updated)) {
            if (updated[key]?.dayId === dayId) {
              updated[key] = { ...updated[key], status }
            }
          }
          return updated
        })
      )

      try {
        const { data: existing } = await supabase
          .from('attendance_record')
          .select('id')
          .eq('student_id', studentId)
          .eq('day_id', dayId)
          .maybeSingle()

        if (existing?.id) {
          const { error } = await supabase
            .from('attendance_record')
            .update({ status })
            .eq('id', existing.id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('attendance_record')
            .insert({ student_id: studentId, day_id: dayId, status })
          if (error) throw error
        }

        // Recompute stats from the updated rows
        setRows((prev) => {
          setStats(calcStats(prev, days))
          return prev
        })
      } catch (e: any) {
        setError(e.message ?? 'Failed to update attendance')
        // Rollback: refetch
        if (selectedSeanceRef.current) {
          setSelectedSeance({ ...selectedSeanceRef.current })
        }
      }
    },
    [days]
  )

  // ── 4. Confirm / lock a seance ────────────────────────────────────────────
  const confirmAttendance = useCallback(async (seanceId: number) => {
    setIsConfirming(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('attendance_seance')
        .update({ is_locked: true })
        .eq('id', seanceId)
      if (error) throw error

      setSeances((prev) =>
        prev.map((s) => (s.id === seanceId ? { ...s, is_locked: true } : s))
      )
      setSelectedSeance((prev) =>
        prev?.id === seanceId ? { ...prev, is_locked: true } : prev
      )
    } catch (e: any) {
      setError(e.message ?? 'Failed to confirm attendance')
    } finally {
      setIsConfirming(false)
    }
  }, [])

  // Call this after creating a new seance so the list refreshes
  const reload = useCallback(() => {
    setReloadTick((t) => t + 1)
  }, [])

  return {
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
    reload,
  }
}

//export default useAttendance
