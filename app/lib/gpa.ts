/**
 * Grade scale for UDEI:
 *   A = 90-100 (4.0) — Excellent
 *   B = 80-89  (3.0) — Très Bien
 *   C = 65-79  (2.0) — Bien
 *   D = 50-64  (1.0) — Reprise
 *   E = 0-49   (0.0) — Échec
 */

export interface GradeEntry {
  score: number
  credits: number
}

const GRADE_SCALE = [
  { min: 90, letter: 'A', label: 'Excellent', points: 4.0, status: 'Réussite' },
  { min: 80, letter: 'B', label: 'Très Bien', points: 3.0, status: 'Réussite' },
  { min: 65, letter: 'C', label: 'Bien',      points: 2.0, status: 'Réussite' },
  { min: 50, letter: 'D', label: 'Passable',  points: 1.0, status: 'Reprise' },
  { min: 0,  letter: 'E', label: 'Insuffisant', points: 0.0, status: 'Échec' },
] as const

export function getGradeInfo(score: number) {
  const clamped = Math.max(0, Math.min(100, score))
  const grade = GRADE_SCALE.find(g => clamped >= g.min)!
  return grade
}

export function getLetterGrade(score: number): string {
  return getGradeInfo(score).letter
}

export function getGradePoint(score: number): number {
  return getGradeInfo(score).points
}

export function calculateGPA(grades: GradeEntry[]): number {
  if (grades.length === 0) return 0
  const totalPoints = grades.reduce((sum, g) => sum + getGradePoint(g.score) * g.credits, 0)
  const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0)
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0
}

export function calculateCumulativeGPA(semesterGPAs: { gpa: number; credits: number }[]): number {
  const totalPoints = semesterGPAs.reduce((sum, s) => sum + s.gpa * s.credits, 0)
  const totalCredits = semesterGPAs.reduce((sum, s) => sum + s.credits, 0)
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0
}
