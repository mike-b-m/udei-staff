'use client'
import { useState, useEffect } from "react"
import { supabase } from "../db"

interface CodeProps {
  sequenceNumber: number
  faculty: string
  onCodeGenerated: (code: string) => void
}

export function Code({ sequenceNumber, faculty, onCodeGenerated }: CodeProps) {
  useEffect(() => {
    // Only generate when sequenceNumber is available
    if (sequenceNumber === 0) return

    // Generate code: F{FacultyFirstLetter}{FacultySecondChar}-{YearLastTwoDigits}-{SequentialNumber}
    // Faculty can be empty initially, just use default chars
    const facultyParts = faculty ? faculty.split(' ') : []
    const firstChar = facultyParts[0]?.[0] || 'X'
    const secondChar = facultyParts[1]?.[0] || facultyParts[0]?.[1] || 'X'

    const year = new Date().getFullYear()
    const yearLastTwo = year.toString().slice(-2)

    const generatedCode = `F${firstChar}${secondChar}-${yearLastTwo}-${sequenceNumber.toString().padStart(4, '0')}`
    onCodeGenerated(generatedCode)
  }, [sequenceNumber, faculty, onCodeGenerated])

  return null
}