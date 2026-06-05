'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../db'
import type { AttendanceFilters, SessionType } from './types'

interface Props {
  onFilterChange: (filters: AttendanceFilters) => void
  initialFilters: AttendanceFilters
}

export function AttendanceFilter({ onFilterChange, initialFilters }: Props) {
  const [faculties, setFaculties] = useState<string[]>([])
  const [academicYears, setAcademicYears] = useState<string[]>([])

  const [faculty, setFaculty] = useState(initialFilters.faculty)
  const [yearStudy, setYearStudy] = useState(initialFilters.year_study)
  const [session, setSession] = useState<SessionType>(initialFilters.session)
  const [academicYear, setAcademicYear] = useState(initialFilters.academic_year)

  // Use a ref to call onFilterChange so it never goes into the dep array
  const onFilterChangeRef = useRef(onFilterChange)
  onFilterChangeRef.current = onFilterChange

  // Fetch option lists once
  useEffect(() => {
    supabase
      .from('student')
      .select('faculty')
      .limit(1000)
      .then(({ data }) => {
        if (data) {
          setFaculties([...new Set(data.map((d: any) => d.faculty).filter(Boolean))] as string[])
        }
      })

    supabase
      .from('student_status')
      .select('academic_year')
      .limit(1000)
      .then(({ data }) => {
        if (data) {
          setAcademicYears(
            [...new Set(data.map((d: any) => d.academic_year).filter(Boolean))] as string[]
          )
        }
      })
  }, [])

  // Notify parent when any filter value changes
  // ⚠️  THE FIX: deps are plain primitives, not an object literal created each render
  useEffect(() => {
    onFilterChangeRef.current({
      faculty,
      year_study: yearStudy,
      session,
      academic_year: academicYear,
    })
  }, [faculty, yearStudy, session, academicYear])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">🎛️</span>
        <h3 className="text-base font-semibold text-slate-800">Filters</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Faculty */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Faculty
          </label>
          <select
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          >
            <option value="">All Faculties</option>
            {faculties.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Year of Study
          </label>
          <select
            value={yearStudy}
            onChange={(e) => setYearStudy(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          >
            {[1, 2, 3, 4, 5, 6].map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </div>

        {/* Session */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Session
          </label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value as SessionType)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          >
            <option value="intra">Intra</option>
            <option value="final">Final</option>
          </select>
        </div>

        {/* Academic Year */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Academic Year
          </label>
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          >
            <option value="">All Years</option>
            {academicYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

//export default AttendanceFilter
