'use client'
import { supabase } from "@/app/component/db"
import { useState, useEffect, useCallback } from "react"
import { useFaculties } from "@/app/component/student-infos/useFaculties"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import jsPDF from 'jspdf'

interface FacultyStats {
  faculty: string
  students: number
  paid: number
  unpaid: number
  revenue: number
}

interface PaymentReportRow {
  id: number
  created_at: string
  amount: number | string | null
  balance: number | string | null
  level: number | string | null
  student_id: number | null
  insert_by: string | null
  studentName: string
  faculty: string
  insertedBy: string
}

type ReportPeriod = 'day' | 'week' | 'month'

const toLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const getPeriodBounds = (dateValue: string, period: ReportPeriod) => {
  const start = toLocalDate(dateValue)
  if (period === 'week') {
    const dayOffset = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - dayOffset)
  } else if (period === 'month') {
    start.setDate(1)
  }

  const end = new Date(start)
  if (period === 'day') end.setDate(end.getDate() + 1)
  if (period === 'week') end.setDate(end.getDate() + 7)
  if (period === 'month') end.setMonth(end.getMonth() + 1)
  return { start, end }
}

const localDateValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ReportsPage() {
  const { facultyNames } = useFaculties()
  const [facultyStats, setFacultyStats] = useState<FacultyStats[]>([])
  const [paymentRows, setPaymentRows] = useState<PaymentReportRow[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalSpend, setTotalSpend] = useState(0)
  const [loading, setLoading] = useState(true)
  const [reportError, setReportError] = useState('')
  const [period, setPeriod] = useState<ReportPeriod>('day')
  const [selectedDate, setSelectedDate] = useState(() => localDateValue(new Date()))
  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [activeChart, setActiveChart] = useState<'enrollment' | 'revenue' | 'balance'>('enrollment')

  const fetchReportData = useCallback(async () => {
    const [studentsRes, paymentsRes, spendRes, statusRes] = await Promise.all([
      supabase.from('student').select('id, first_name, last_name, faculty'),
      supabase.from('payment_history').select('id, created_at, amount, balance, student_id, insert_by, level').order('created_at', { ascending: false }),
      supabase.from('spent_in_company').select('amount'),
      supabase.from('student_status').select('student_id, year_study'),
    ])

    if (studentsRes.error || paymentsRes.error || spendRes.error || statusRes.error) {
      setReportError(studentsRes.error?.message || paymentsRes.error?.message || spendRes.error?.message || statusRes.error?.message || 'Erreur de chargement des rapports')
      setLoading(false)
      return
    }

    const students = studentsRes.data || []
    const payments = paymentsRes.data || []
    const spends = spendRes.data || []
    const levelByStudentId = new Map((statusRes.data || []).map(status => [status.student_id, status.year_study]))
    const profileIds = [...new Set(payments.map(payment => payment.insert_by).filter((id): id is string => Boolean(id)))]
    const { data: profiles, error: profilesError } = profileIds.length
      ? await supabase.from('profiles').select('id, full_name, email').in('id', profileIds)
      : { data: [], error: null }

    if (profilesError) {
      setReportError(profilesError.message)
      setLoading(false)
      return
    }

    setReportError('')
    const studentById = new Map(students.map(student => [student.id, student]))
    const profileById = new Map((profiles || []).map(profile => [profile.id, profile]))
    const reportRows: PaymentReportRow[] = payments.map(payment => {
      const student = studentById.get(payment.student_id)
      const profile = payment.insert_by ? profileById.get(payment.insert_by) : null
      return {
        ...payment,
        level: payment.level ?? levelByStudentId.get(payment.student_id) ?? null,
        studentName: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() || `Étudiant #${student.id}` : `Étudiant #${payment.student_id ?? 'inconnu'}`,
        faculty: student?.faculty || 'Non renseignée',
        insertedBy: profile?.full_name || profile?.email || 'Non renseigné',
      }
    })
    setPaymentRows(reportRows)

    setTotalStudents(students.length)

    const totalRev = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
    setTotalRevenue(totalRev)

    const totalSp = spends.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
    setTotalSpend(totalSp)

    // Build per-faculty stats
    const faculties = [...new Set(students.map(student => student.faculty).filter((faculty): faculty is string => Boolean(faculty)))]
    const stats: FacultyStats[] = faculties.map(faculty => {
      const facultyStudents = students.filter(s => s.faculty === faculty)
      const studentIds = new Set(facultyStudents.map(s => s.id))
      const facultyPayments = payments.filter(p => studentIds.has(p.student_id))
      const paidStudentIds = new Set(facultyPayments.map(p => p.student_id))
      const revenue = facultyPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

      return {
        faculty,
        students: facultyStudents.length,
        paid: paidStudentIds.size,
        unpaid: facultyStudents.length - paidStudentIds.size,
        revenue,
      }
    }).filter(s => s.students > 0)

    setFacultyStats(stats)
    setLoading(false)
  }, [])

  useEffect(() => {
    void Promise.resolve().then(fetchReportData)
  }, [fetchReportData])

  const { start: periodStart, end: periodEnd } = getPeriodBounds(selectedDate, period)
  const periodPayments = paymentRows.filter(payment => {
    const paymentDate = new Date(payment.created_at)
    return paymentDate >= periodStart && paymentDate < periodEnd && (!selectedFaculty || payment.faculty === selectedFaculty)
  })
  const periodTotal = periodPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
  const periodLabel = period === 'day' ? 'Jour' : period === 'week' ? 'Semaine' : 'Mois'
  const periodDateLabel = period === 'month'
    ? periodStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : `${periodStart.toLocaleDateString('fr-FR')} - ${new Date(periodEnd.getTime() - 1).toLocaleDateString('fr-FR')}`

  const dailyTotals = periodPayments.reduce((totals, payment) => {
    const date = localDateValue(new Date(payment.created_at))
    totals.set(date, (totals.get(date) || 0) + (Number(payment.amount) || 0))
    return totals
  }, new Map<string, number>())
  const chartDates = period === 'day'
    ? [localDateValue(periodStart)]
    : Array.from({ length: Math.round((periodEnd.getTime() - periodStart.getTime()) / 86400000) }, (_, index) => {
      const date = new Date(periodStart)
      date.setDate(date.getDate() + index)
      return localDateValue(date)
    })
  const chartValues = chartDates.map(date => ({ date, amount: dailyTotals.get(date) || 0 }))
  const reportTitle = `Rapport des paiements - ${periodDateLabel}`
  const reportFaculty = selectedFaculty || 'Toutes les facultés'
  const safeFilename = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const downloadPaymentPDF = () => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 12

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.text('Rapport des paiements', margin, 16)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(`Periode: ${periodLabel} | ${periodDateLabel}`, margin, 23)
    pdf.text(`Faculte: ${reportFaculty}`, margin, 29)
    pdf.text(`Total paye: $${periodTotal.toLocaleString()} HT | Transactions: ${periodPayments.length}`, margin, 35)

    const chartTop = 42
    const chartHeight = 32
    const chartWidth = pageWidth - margin * 2
    const slotWidth = chartWidth / Math.max(chartValues.length, 1)
    const maxAmount = Math.max(...chartValues.map(item => item.amount), 1)
    chartValues.forEach((item, index) => {
      const barHeight = item.amount > 0 ? (item.amount / maxAmount) * chartHeight : 0
      const barWidth = Math.max(1, Math.min(12, slotWidth * 0.58))
      const x = margin + index * slotWidth + (slotWidth - barWidth) / 2
      const y = chartTop + chartHeight - barHeight
      if (barHeight > 0) {
        pdf.setFillColor(5, 150, 105)
        pdf.rect(x, y, barWidth, barHeight, 'F')
      }
      if (chartValues.length <= 10 || index % 3 === 0 || index === chartValues.length - 1) {
        pdf.setFontSize(7)
        pdf.setTextColor(75, 85, 99)
        pdf.text(new Date(`${item.date}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), x + barWidth / 2, chartTop + chartHeight + 4, { align: 'center' })
      }
    })
    pdf.setDrawColor(209, 213, 219)
    pdf.line(margin, chartTop + chartHeight, pageWidth - margin, chartTop + chartHeight)

    const columns = [
      { label: 'Date', x: margin, width: 30 },
      { label: 'Etudiant', x: margin + 30, width: 46 },
      { label: 'Faculte', x: margin + 76, width: 38 },
      { label: 'Niveau', x: margin + 114, width: 18 },
      { label: 'Montant paye', x: margin + 132, width: 30 },
      { label: 'Solde apres', x: margin + 162, width: 30 },
      { label: 'Enregistre par', x: margin + 192, width: 69 },
    ]
    let y = 84
    const drawTableHeader = () => {
      pdf.setFillColor(243, 244, 246)
      pdf.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.setTextColor(31, 41, 55)
      columns.forEach(column => pdf.text(column.label, column.x + 1, y))
      y += 5
    }

    drawTableHeader()
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    periodPayments.forEach(payment => {
      if (y > pageHeight - 12) {
        pdf.addPage()
        y = 16
        drawTableHeader()
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
      }
      const values = [
        new Date(payment.created_at).toLocaleString('fr-FR'),
        payment.studentName,
        payment.faculty,
        payment.level == null ? '-' : String(payment.level),
        `$${(Number(payment.amount) || 0).toLocaleString()} HT`,
        `$${(Number(payment.balance) || 0).toLocaleString()} HT`,
        payment.insertedBy,
      ]
      values.forEach((value, index) => {
        const column = columns[index]
        const lines = pdf.splitTextToSize(value, column.width - 2) as string[]
        pdf.text(lines[0] || '', column.x + 1, y)
      })
      pdf.setDrawColor(229, 231, 235)
      pdf.line(margin, y + 2, pageWidth - margin, y + 2)
      y += 8
    })

    pdf.save(`rapport-paiements-${period}-${localDateValue(periodStart)}-${safeFilename(reportFaculty)}.pdf`)
  }

  const printPaymentReport = () => {
    const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character] || character)
    const chartWidth = Math.max(chartValues.length * 28, 560)
    const maxAmount = Math.max(...chartValues.map(item => item.amount), 1)
    const bars = chartValues.map((item, index) => {
      const barHeight = item.amount > 0 ? (item.amount / maxAmount) * 130 : 0
      const x = index * 28 + 8
      return `<g><rect x="${x}" y="${150 - barHeight}" width="16" height="${barHeight}" fill="#059669" rx="2"/><text x="${x + 8}" y="168" text-anchor="middle">${escapeHtml(new Date(`${item.date}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }))}</text></g>`
    }).join('')
    const tableRows = periodPayments.map(payment => `<tr><td>${escapeHtml(new Date(payment.created_at).toLocaleString('fr-FR'))}</td><td>${escapeHtml(payment.studentName)}</td><td>${escapeHtml(payment.faculty)}</td><td>${escapeHtml(payment.level ?? '-')}</td><td class="number">$${(Number(payment.amount) || 0).toLocaleString()} HT</td><td class="number">$${(Number(payment.balance) || 0).toLocaleString()} HT</td><td>${escapeHtml(payment.insertedBy)}</td></tr>`).join('')
    const printWindow = window.open('', '_blank', 'width=1100,height=800')
    if (!printWindow) return
    printWindow.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(reportTitle)}</title><style>
      *{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#1f2937;margin:24px}h1{font-size:22px;margin:0 0 8px}p{margin:4px 0}.summary{display:flex;gap:24px;margin:16px 0}.chart{width:100%;overflow:hidden;margin:16px 0 26px}.chart svg{display:block;max-width:100%;height:auto}.chart text{font:9px Arial,sans-serif;fill:#4b5563}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#065f46;color:#fff;text-align:left}th,td{border:1px solid #d1d5db;padding:7px}.number{text-align:right;white-space:nowrap}tbody tr:nth-child(even){background:#f9fafb}@page{size:landscape;margin:12mm}@media print{body{margin:0}.chart{break-inside:avoid}thead{display:table-header-group}tr{break-inside:avoid}}
      </style></head><body><h1>Rapport des paiements</h1><p><strong>Période :</strong> ${escapeHtml(periodLabel)} | ${escapeHtml(periodDateLabel)}</p><p><strong>Faculté :</strong> ${escapeHtml(reportFaculty)}</p><div class="summary"><p><strong>Total payé :</strong> $${periodTotal.toLocaleString()} HT</p><p><strong>Transactions :</strong> ${periodPayments.length}</p></div><div class="chart"><svg viewBox="0 0 ${chartWidth} 180" role="img" aria-label="Paiements par jour"><line x1="0" y1="150" x2="${chartWidth}" y2="150" stroke="#d1d5db"/>${bars}</svg></div><table><thead><tr><th>Date</th><th>Étudiant</th><th>Faculté</th><th>Niveau / Année</th><th>Montant payé</th><th>Solde après paiement</th><th>Enregistré par</th></tr></thead><tbody>${tableRows || '<tr><td colspan="7">Aucun paiement pour cette sélection</td></tr>'}</tbody></table><script>window.addEventListener('load',()=>window.print())</script></body></html>`)
    printWindow.document.close()
  }

  const downloadPaymentReport = () => {
    const escapeCsv = (value: unknown) => {
      const text = String(value ?? '')
      const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text
      return `"${safeText.replace(/"/g, '""')}"`
    }
    const csvRows = [
      ['Période', periodLabel, periodDateLabel],
      ['Faculté', selectedFaculty || 'Toutes les facultés'],
      ['Total payé', periodTotal],
      [],
      ['Date', 'Étudiant', 'Faculté', 'Niveau / Année', 'Montant payé', 'Solde après paiement', 'Enregistré par'],
      ...periodPayments.map(payment => [
        new Date(payment.created_at).toLocaleString('fr-FR'),
        payment.studentName,
        payment.faculty,
        payment.level ?? '-',
        Number(payment.amount) || 0,
        Number(payment.balance) || 0,
        payment.insertedBy,
      ]),
    ]
    const csvContent = `\uFEFF${csvRows.map(row => row.map(escapeCsv).join(';')).join('\r\n')}`
    const fileUrl = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    const facultyFilename = (selectedFaculty || 'toutes-les-facultes')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    link.href = fileUrl
    link.download = `rapport-paiements-${period}-${localDateValue(periodStart)}-${facultyFilename}.csv`
    link.click()
    URL.revokeObjectURL(fileUrl)
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']

  const pieData = facultyStats.map(s => ({
    name: s.faculty.length > 15 ? s.faculty.substring(0, 15) + '...' : s.faculty,
    value: s.students
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 py-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Chargement des rapports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rapports & Statistiques</h1>
        <p className="text-gray-600">Vue d&apos;ensemble des données de l&apos;université</p>
      </div>

      {reportError && (
        <div role="alert" className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Impossible de charger les rapports : {reportError}
        </div>
      )}

      <section className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" aria-labelledby="payment-report-title">
        <div className="border-b border-gray-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 id="payment-report-title" className="text-xl font-bold text-gray-900">Rapport des paiements</h2>
              <p className="mt-1 text-sm text-gray-600">Transactions enregistrées par période et par faculté</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="text-sm font-medium text-gray-700">
                Période
                <select value={period} onChange={event => setPeriod(event.target.value as ReportPeriod)} className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900">
                  <option value="day">Jour</option>
                  <option value="week">Semaine</option>
                  <option value="month">Mois</option>
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">
                {period === 'month' ? 'Mois' : period === 'week' ? 'Date de la semaine' : 'Date'}
                <input type={period === 'month' ? 'month' : 'date'} value={period === 'month' ? selectedDate.slice(0, 7) : selectedDate} onChange={event => setSelectedDate(period === 'month' ? `${event.target.value}-01` : event.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900" />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Faculté
                <select value={selectedFaculty} onChange={event => setSelectedFaculty(event.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900">
                  <option value="">Toutes les facultés</option>
                  {facultyNames.map(faculty => <option key={faculty} value={faculty}>{faculty}</option>)}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-gray-200 sm:grid-cols-3">
          <div className="bg-white px-5 py-4 sm:px-6">
            <p className="text-sm font-medium text-gray-600">Total payé · {periodLabel}</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">${periodTotal.toLocaleString()} HT</p>
          </div>
          <div className="bg-white px-5 py-4 sm:px-6">
            <p className="text-sm font-medium text-gray-600">Transactions</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{periodPayments.length}</p>
          </div>
          <div className="bg-white px-5 py-4 sm:px-6">
            <p className="text-sm font-medium text-gray-600">Période sélectionnée</p>
            <p className="mt-1 text-base font-semibold text-gray-900">{periodDateLabel}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h3 className="font-semibold text-gray-900">Exporter le rapport</h3>
            <p className="mt-1 text-sm text-gray-600">CSV, PDF et impression incluent le graphique journalier et {periodPayments.length} transaction{periodPayments.length === 1 ? '' : 's'}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadPaymentReport}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M7 10l5 5m0 0l5-5m-5 5V4" />
              </svg>
              CSV
            </button>
            <button
              type="button"
              onClick={downloadPaymentPDF}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H5.625A1.125 1.125 0 004.5 3.375v17.25a1.125 1.125 0 001.125 1.125h12.75a1.125 1.125 0 001.125-1.125V14.25z" />
              </svg>
              PDF
            </button>
            <button
              type="button"
              onClick={printPaymentReport}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-12-4h12v8H6v-8z" />
              </svg>
              Imprimer
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Étudiant</th>
                <th className="px-5 py-3 font-semibold">Faculté</th>
                <th className="px-5 py-3 text-center font-semibold">Niveau / Année</th>
                <th className="px-5 py-3 text-right font-semibold">Montant payé</th>
                <th className="px-5 py-3 text-right font-semibold">Solde après paiement</th>
                <th className="px-5 py-3 font-semibold">Enregistré par</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {periodPayments.map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-5 py-3 text-gray-600">{new Date(payment.created_at).toLocaleString('fr-FR')}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{payment.studentName}</td>
                  <td className="px-5 py-3 text-gray-700">{payment.faculty}</td>
                  <td className="px-5 py-3 text-center text-gray-700">{payment.level ?? '-'}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-emerald-700">${(Number(payment.amount) || 0).toLocaleString()} HT</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-gray-700">${(Number(payment.balance) || 0).toLocaleString()} HT</td>
                  <td className="px-5 py-3 text-gray-700">{payment.insertedBy}</td>
                </tr>
              ))}
              {periodPayments.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-500">Aucun paiement pour cette sélection</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-80 font-semibold">Total Étudiants</p>
          <p className="text-3xl font-bold mt-1">{totalStudents}</p>
        </div>
        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-80 font-semibold">Revenus</p>
          <p className="text-3xl font-bold mt-1">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-linear-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-80 font-semibold">Dépenses</p>
          <p className="text-3xl font-bold mt-1">${totalSpend.toLocaleString()}</p>
        </div>
        <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-80 font-semibold">Solde Net</p>
          <p className="text-3xl font-bold mt-1">${(totalRevenue - totalSpend).toLocaleString()}</p>
        </div>
      </div>

      {/* Chart Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'enrollment', label: 'Inscriptions' },
          { key: 'revenue', label: 'Revenus' },
          { key: 'balance', label: 'Distribution' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveChart(tab.key as typeof activeChart)}
            className={`px-5 py-2 rounded-lg font-semibold transition-all text-sm ${
              activeChart === tab.key
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        {activeChart === 'enrollment' && (
          <>
            <h3 className="font-bold text-gray-900 mb-4">Étudiants par Faculté</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={facultyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="faculty" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#3B82F6" name="Étudiants" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {activeChart === 'revenue' && (
          <>
            <h3 className="font-bold text-gray-900 mb-4">Revenus par Faculté ($)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={facultyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="faculty" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={value => `$${Number(value).toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#10B981" name="Revenus" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {activeChart === 'balance' && (
          <>
            <h3 className="font-bold text-gray-900 mb-4">Distribution des Étudiants</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={150} dataKey="value" label>
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Faculty Detail Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Détail par Faculté</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Faculté</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Étudiants</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Payés</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Non Payés</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Revenus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {facultyStats.map(stat => (
                <tr key={stat.faculty} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 text-sm">{stat.faculty}</td>
                  <td className="px-6 py-4 text-center text-sm">{stat.students}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">{stat.paid}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">{stat.unpaid}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-sm">${stat.revenue.toLocaleString()}</td>
                </tr>
              ))}
              {facultyStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Aucune donnée disponible</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
