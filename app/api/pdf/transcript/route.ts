import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getGradeInfo, calculateGPA, type GradeEntry } from '@/app/lib/gpa'

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get('student_id')
  if (!studentId) {
    return NextResponse.json({ error: 'student_id required' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const [studentRes, gradesRes, statusRes, programRes] = await Promise.all([
    supabase.from('student').select('*').eq('id', studentId).single(),
    supabase.from('exam').select('*').eq('student_id', studentId),
    supabase.from('student_status').select('*').eq('student_id', studentId),
    supabase.from('course_program').select('*'),
  ])

  if (studentRes.error || !studentRes.data) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const student = studentRes.data
  const grades = gradesRes.data || []
  const status = statusRes.data || []
  const programs = programRes.data || []

  // Calculate GPA from grades
  const gradeEntries: GradeEntry[] = grades.map((g: Record<string, unknown>) => {
    const finalScore = Number(g.final) || 0
    const course = programs.find((p: Record<string, unknown>) => p.course_name === g.matière)
    return { score: finalScore, credits: Number(course?.credits) || 3 }
  })
  const gpa = calculateGPA(gradeEntries)

  // Build transcript data with grade info
  const transcriptGrades = grades.map((g: Record<string, unknown>) => {
    const finalScore = Number(g.final) || 0
    const gradeInfo = getGradeInfo(finalScore)
    const course = programs.find((p: Record<string, unknown>) => p.course_name === g.matière)
    return {
      matiere: g.matière,
      intra: g.intra,
      final: g.final,
      reprise: g.reprise,
      session: g.session,
      year: g.year,
      letter: gradeInfo.letter,
      label: gradeInfo.label,
      status: gradeInfo.status,
      points: gradeInfo.points,
      credits: Number(course?.credits) || 3,
    }
  })

  // Return structured JSON transcript data
  // TODO: Replace with actual PDF generation using @react-pdf/renderer
  return NextResponse.json({
    student: {
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      student_code: student.student_code,
      faculty: student.faculty,
      date_birth: student.date_birth,
      place_of_birth: student.place_of_birth,
      email: student.email,
    },
    academic_status: status,
    grades: transcriptGrades,
    gpa,
    generated_at: new Date().toISOString(),
  })
}
