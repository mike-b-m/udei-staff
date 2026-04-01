import { describe, it, expect } from 'vitest'
import {
  getGradeInfo,
  getLetterGrade,
  getGradePoint,
  calculateGPA,
  calculateCumulativeGPA,
  type GradeEntry,
} from '@/app/lib/gpa'

describe('getGradeInfo', () => {
  it('returns A for score 90-100', () => {
    const info = getGradeInfo(95)
    expect(info.letter).toBe('A')
    expect(info.label).toBe('Excellent')
    expect(info.status).toBe('Réussite')
    expect(info.points).toBe(4.0)
  })

  it('returns A for score exactly 90', () => {
    expect(getGradeInfo(90).letter).toBe('A')
  })

  it('returns B for score 80-89', () => {
    const info = getGradeInfo(85)
    expect(info.letter).toBe('B')
    expect(info.label).toBe('Très Bien')
    expect(info.points).toBe(3.0)
  })

  it('returns C for score 65-79', () => {
    const info = getGradeInfo(70)
    expect(info.letter).toBe('C')
    expect(info.label).toBe('Bien')
    expect(info.points).toBe(2.0)
  })

  it('returns D for score 50-64', () => {
    const info = getGradeInfo(55)
    expect(info.letter).toBe('D')
    expect(info.label).toBe('Passable')
    expect(info.status).toBe('Reprise')
    expect(info.points).toBe(1.0)
  })

  it('returns E for score below 50', () => {
    const info = getGradeInfo(30)
    expect(info.letter).toBe('E')
    expect(info.label).toBe('Insuffisant')
    expect(info.status).toBe('Échec')
    expect(info.points).toBe(0.0)
  })

  it('returns E for score 0', () => {
    expect(getGradeInfo(0).letter).toBe('E')
  })

  it('returns A for score 100', () => {
    expect(getGradeInfo(100).letter).toBe('A')
  })
})

describe('getLetterGrade', () => {
  it('returns correct letter for various scores', () => {
    expect(getLetterGrade(95)).toBe('A')
    expect(getLetterGrade(85)).toBe('B')
    expect(getLetterGrade(70)).toBe('C')
    expect(getLetterGrade(55)).toBe('D')
    expect(getLetterGrade(30)).toBe('E')
  })
})

describe('getGradePoint', () => {
  it('returns correct points for various scores', () => {
    expect(getGradePoint(95)).toBe(4.0)
    expect(getGradePoint(85)).toBe(3.0)
    expect(getGradePoint(70)).toBe(2.0)
    expect(getGradePoint(55)).toBe(1.0)
    expect(getGradePoint(30)).toBe(0.0)
  })
})

describe('calculateGPA', () => {
  it('calculates weighted GPA correctly', () => {
    const grades: GradeEntry[] = [
      { score: 95, credits: 3 }, // A, 4.0
      { score: 85, credits: 3 }, // B, 3.0
      { score: 70, credits: 3 }, // C, 2.0
    ]
    // (4*3 + 3*3 + 2*3) / 9 = 27/9 = 3.0
    expect(calculateGPA(grades)).toBe(3.0)
  })

  it('handles different credit weights', () => {
    const grades: GradeEntry[] = [
      { score: 95, credits: 4 }, // A, 4.0 -> 16
      { score: 30, credits: 1 }, // E, 0.0 -> 0
    ]
    // 16 / 5 = 3.2
    expect(calculateGPA(grades)).toBe(3.2)
  })

  it('returns 0 for empty grades', () => {
    expect(calculateGPA([])).toBe(0)
  })

  it('returns 4.0 for all perfect scores', () => {
    const grades: GradeEntry[] = [
      { score: 100, credits: 3 },
      { score: 92, credits: 3 },
    ]
    expect(calculateGPA(grades)).toBe(4.0)
  })

  it('returns 0 for all failing grades', () => {
    const grades: GradeEntry[] = [
      { score: 20, credits: 3 },
      { score: 10, credits: 3 },
    ]
    expect(calculateGPA(grades)).toBe(0)
  })
})

describe('calculateCumulativeGPA', () => {
  it('averages multiple semester GPAs weighted by credits', () => {
    const result = calculateCumulativeGPA([
      { gpa: 3.5, credits: 15 },
      { gpa: 3.0, credits: 15 },
      { gpa: 2.5, credits: 15 },
    ])
    expect(result).toBe(3.0)
  })

  it('returns 0 for empty array', () => {
    expect(calculateCumulativeGPA([])).toBe(0)
  })

  it('returns single GPA for one semester', () => {
    expect(calculateCumulativeGPA([{ gpa: 3.8, credits: 15 }])).toBe(3.8)
  })
})
