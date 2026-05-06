// ============ Bulletin Template Helper ============
export function generateBulletinHTML(studentName: string, faculty: string, studentCode: string, academicYear: string, tableHTML: string, title: string = 'BULLETIN',studyyear: string | number) {
  const year = studyyear=== 1 ? '1ère année' : studyyear === 2 ? '2ème année' : studyyear === 3 ? '3ème année' : studyyear === 4 ? '4ème année' : studyyear === 5 ? '5ème année' : studyyear
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 0px;
          border-bottom: 3px solid #d32f2f;
          padding-bottom: 1px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .logo {
          width: 60%;
          height: auto;
          margin-right: 15px;
        }
        .university-name {
          text-align: center;
        }
        .university-name h1 {
          margin: 0;
          color: #1b5e20;
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        .university-name h2 {
          margin: 3px 0 0 0;
          color: #000;
          font-size: 18px;
          font-weight: bold;
        }
        .red-bar {
          background-color: #d32f2f;
          height: 6px;
          margin: 8px 0;
        }
        .title {
          font-size: 20px;
          font-weight: bold;
          color: #000;
          margin: 15px 0 5px 0;
          text-align: center;
        }
        .faculty {
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: #1b5e20;
          margin-bottom: 15px;
        }
        .student-info {
          background-color: #f0f4f8;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 12px 15px;
          margin-bottom: 15px;
          font-size: 13px;
        }
        .student-info p {
          margin: 4px 0;
        }
        .info-label {
          font-weight: 600;
          color: #1f2937;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
        }
        th {
          background-color: #1b5e20;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: bold;
          font-size: 12px;
          border: 1px solid #0d3b1f;
        }
        td {
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          font-size: 12px;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .total-row {
          font-weight: bold;
          background-color: #e8f5e9 !important;
          border-top: 2px solid #1b5e20;
        }
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #cbd5e1;
          font-size: 10px;
          color: #64748b;
          text-align: center;
        }
        @media print {
          body { margin: 0; padding: 10px; }
          .red-bar { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="logo-section">
          <img src="/image/h.png" alt="UDEI Logo" class="logo">
        </div>
        <div class="red-bar"></div>
      </div>

      <!-- Title -->
      <div class="title">${title}</div>
      <div class="faculty">${faculty}</div>

      <!-- Student Information -->
      <div class="student-info">
      <p>Le Vice-rectorat de l’Université d’Études Internationales atteste 
      que l’étudiant(e) <span class="info-label">${studentName}</span>, identifié(e) sous le numéro ID :
       <span class="info-label"> ${studentCode}</span>,
       régulièrement inscrit(e) aux registres de l’université au cours de la période académique <span class="info-label">${academicYear}</span>, 
       a suivi les enseignements de <span class="info-label">${year}</span> à la faculté de <span class="info-label">${faculty}</span> et a satisfait aux examens réglementaires,
      </div>

      <!-- Notes Table -->
      ${tableHTML}

      <!-- Footer -->
      <div class="footer">
      <p> Note minimale requise : <span class="info-label">70</span> (matières de base) et <span class="info-label">65</span> (autres matières).
       Les notes en gras indiquent les matières validées en session de reprise.</p>
         <p>Ce bulletin a été généré par le Système de Gestion Académique de l'UDEI</p>
        <p>Tél: 48-809-772 | Email: udelformationuniversitaire@gmail.com</p>
      </div>
    </body>
    </html>
  `
}

// ============ CSV/Excel Export ============
export function exportToCSV(headers: string[], rows: string[][], filename: string) {
  const BOM = '\uFEFF'
  const csvContent = BOM + [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ============ Print / PDF via browser ============
export function printHTML(title: string, bodyHTML: string) {
  const printWindow = window.open('', '', 'height=700,width=900')
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #1f2937; }
          h2 { color: #0077B6; margin-bottom: 8px; }
          .info { margin-bottom: 15px; font-size: 14px; }
          .info p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background-color: #0077B6; color: white; padding: 10px; text-align: left; font-weight: bold; font-size: 13px; }
          td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .section-title { font-size: 16px; font-weight: bold; color: #1e40af; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; }
          .total-row { font-weight: bold; background-color: #dbeafe !important; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>${bodyHTML}</body>
    </html>
  `)
  printWindow.document.close()
  setTimeout(() => printWindow.print(), 300)
}

// ============ Export Buttons Component (reusable) ============
// This is just a utility file — the UI buttons are inlined in each component.
