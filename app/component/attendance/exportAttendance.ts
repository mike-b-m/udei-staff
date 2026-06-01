/**
 * Attendance Export Utilities
 */

export interface AttendanceExportFilters {
  faculty?: string
  year_study?: number
  academic_year?: string
}

export interface AttendanceExportStats {
  total_students: number
  total_present: number
  total_absent: number
  total_excused: number
  percentage_present: number
}

export function generateAttendanceHTML(
  title: string,
  weekNumber: number,
  session: 'intra' | 'final',
  filters: AttendanceExportFilters,
  stats: AttendanceExportStats,
  tableHTML: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',sans-serif;padding:24px;background:#fff;color:#1e293b;line-height:1.5}
    .header{text-align:center;margin-bottom:28px;border-bottom:3px solid #3730a3;padding-bottom:14px}
    .header h1{color:#3730a3;font-size:26px;margin-bottom:4px}
    .header p{color:#64748b;font-size:13px}
    .filters{background:#f8fafc;padding:10px 14px;border-radius:6px;margin-bottom:18px;font-size:12px;border-left:4px solid #6366f1}
    .stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px}
    .stat{background:#f1f5f9;border-radius:8px;padding:12px;text-align:center}
    .stat-label{font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
    .stat-value{font-size:22px;font-weight:800;color:#3730a3;margin-top:4px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th{background:#3730a3;color:#fff;padding:9px 10px;text-align:left;font-weight:700;border:1px solid #312e81}
    td{border:1px solid #e2e8f0;padding:7px 10px}
    tr:nth-child(even){background:#f8fafc}
    .status-cell{text-align:center;font-weight:700}
    .present{background:#d1fae5;color:#065f46}
    .absent{background:#fee2e2;color:#991b1b}
    .excused{background:#fef3c7;color:#92400e}
    .footer{margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center}
    @media print{body{padding:0}table{page-break-inside:avoid}}
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Attendance Report</h1>
    <p><strong>${session.toUpperCase()} Session</strong> · <strong>Week ${weekNumber}</strong></p>
  </div>
  <div class="filters">
    <strong>Filters:</strong> Faculty: <strong>${filters.faculty || 'All'}</strong> |
    Year: <strong>${filters.year_study || 'All'}</strong> |
    Academic Year: <strong>${filters.academic_year || 'All'}</strong>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-label">Students</div><div class="stat-value">${stats.total_students}</div></div>
    <div class="stat"><div class="stat-label">Present</div><div class="stat-value" style="color:#065f46">${stats.total_present}</div></div>
    <div class="stat"><div class="stat-label">Absent</div><div class="stat-value" style="color:#991b1b">${stats.total_absent}</div></div>
    <div class="stat"><div class="stat-label">Excused</div><div class="stat-value" style="color:#92400e">${stats.total_excused}</div></div>
    <div class="stat"><div class="stat-label">% Present</div><div class="stat-value">${stats.percentage_present.toFixed(1)}%</div></div>
  </div>
  ${tableHTML}
  <div class="footer">
    Generated: ${new Date().toLocaleString()} · Confidential – authorized personnel only
  </div>
</body>
</html>`
}

export function generateAttendanceTableHTML(rows: any[], days: any[]): string {
  if (!rows.length) return '<p style="text-align:center;color:#94a3b8;padding:20px">No data</p>'

  const sym = (s: string) => s === 'present' ? '✓' : s === 'absent' ? '✗' : s === 'excused' ? '~' : '—'
  const cls = (s: string) => s === 'present' ? 'present' : s === 'absent' ? 'absent' : s === 'excused' ? 'excused' : ''

  const head = `<tr>
    <th>#</th><th>Student ID</th><th>Last Name</th><th>First Name</th><th>Faculty</th>
    ${days.map((d: any) => `<th>${d.day_name.slice(0,3)}<br><small>${d.date_day}</small></th>`).join('')}
  </tr>`

  const body = rows.map((row, i) => `<tr>
    <td>${i + 1}</td>
    <td><strong>${row.student_id}</strong></td>
    <td>${row.last_name}</td>
    <td>${row.first_name}</td>
    <td>${row.faculty}</td>
    ${days.map((d: any) => {
      const cell = row[`S${d.seance_id}D${d.day_of_week}`]
      const st = cell?.status || 'absent'
      return `<td class="status-cell ${cls(st)}">${sym(st)}</td>`
    }).join('')}
  </tr>`).join('')

  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`
}

export function downloadAttendanceAsCSV(rows: any[], filename = `attendance_${Date.now()}.csv`) {
  if (!rows.length) { alert('No data to export'); return }
  const headers = Object.keys(rows[0]).filter((k) => !k.startsWith('_'))
  const lines = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const v = row[h]
        if (typeof v === 'object' && v !== null) return `"${v.status ?? ''}"`
        return `"${String(v ?? '').replace(/"/g, '""')}"`
      }).join(',')
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.style.display = 'none'
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadAttendanceAsPDF(
  title: string,
  weekNumber: number,
  session: 'intra' | 'final',
  filters: AttendanceExportFilters,
  stats: AttendanceExportStats,
  tableHTML: string,
  _filename?: string
) {
  const html = generateAttendanceHTML(title, weekNumber, session, filters, stats, tableHTML)
  const win = window.open('', '', 'height=900,width=1400')
  if (!win) { alert('Allow pop-ups to export PDF'); return }
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 350)
}
