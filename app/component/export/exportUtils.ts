/**
 * Shared export utilities for PDF, Excel (CSV), and Print
 */

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
