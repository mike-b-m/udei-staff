'use client'
import { useMemo, useState, useCallback } from 'react'
import { supabase } from '@/app/component/db'

interface CourseProgram {
  id: number
  courses: string
  credit: number
  session_subjet: number
  hour_session: number
  total_hour: number
  year: number
  session: number
  created_at?: string
}

interface TableProps {
  int: CourseProgram[]
  faculty: string | null
  year: number
  session: number
  onUpdateData?: (updatedData: CourseProgram[]) => void
}

interface EditFormRow {
  id: number
  courses: string
  credit: string
  session_subjet: string
  hour_session: string
  total_hour: string
}

interface FormErrors {
  [key: string]: string
}

const TABLE_COLUMNS = [
  { key: 'courses', label: 'Cours', width: 'w-1/4' },
  { key: 'credit', label: 'Crédit', width: 'w-1/6' },
  { key: 'session_subjet', label: 'Séances/Mois', width: 'w-1/6' },
  { key: 'hour_session', label: 'H/Séance', width: 'w-1/6' },
  { key: 'total_hour', label: 'Total Heures', width: 'w-1/6' }
]

// Export functions
const exportToCSV = (data: CourseProgram[], fileName: string) => {
  const headers = TABLE_COLUMNS.map(col => col.label).join(',')
  const rows = data.map(item =>
    TABLE_COLUMNS.map(col => {
      const value = item[col.key as keyof CourseProgram]
      return typeof value === 'string' ? `"${value}"` : value
    }).join(',')
  )

  const totals = TABLE_COLUMNS.map((col, idx) => {
    if (idx === 0) return '"TOTAL"'
    return data.reduce((sum, item) => sum + Number(item[col.key as keyof CourseProgram]), 0)
  }).join(',')

  const csv = [headers, ...rows, totals].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${fileName}.csv`
  link.click()
}

const exportToJSON = (data: CourseProgram[], fileName: string) => {
  const totals = {
    credit: data.reduce((sum, item) => sum + item.credit, 0),
    session_subjet: data.reduce((sum, item) => sum + item.session_subjet, 0),
    hour_session: data.reduce((sum, item) => sum + item.hour_session, 0),
    total_hour: data.reduce((sum, item) => sum + item.total_hour, 0)
  }

  const json = JSON.stringify({ data, totals }, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${fileName}.json`
  link.click()
}

const exportToExcel = (data: CourseProgram[], fileName: string) => {
  const headers = TABLE_COLUMNS.map(col => col.label)
  
  let html = '<table border="1">'
  html += '<tr><th>' + headers.join('</th><th>') + '</th></tr>'
  
  data.forEach(item => {
    html += '<tr>'
    TABLE_COLUMNS.forEach(col => {
      html += '<td>' + item[col.key as keyof CourseProgram] + '</td>'
    })
    html += '</tr>'
  })

  html += '<tr style="font-weight: bold; background-color: #f0f0f0;"><td>TOTAL</td>'
  TABLE_COLUMNS.slice(1).forEach(col => {
    const total = data.reduce((sum, item) => sum + Number(item[col.key as keyof CourseProgram]), 0)
    html += '<td>' + total + '</td>'
  })
  html += '</tr></table>'

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${fileName}.xls`
  link.click()
}

const printTable = (data: CourseProgram[], faculty: string | null, year: number, session: number) => {
  const printWindow = window.open('', '', 'height=600,width=900')
  if (!printWindow) return

  let html = `
    <html>
      <head>
        <title>Programme ${faculty} - Année ${year} Sesion ${session}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h2 { color: #0077B6; margin-bottom: 20px; }
          .info { margin-bottom: 15px; font-size: 14px; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #0077B6;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .total-row {
            font-weight: bold;
            background-color: #e3f2fd;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <h2>Programme des Cours</h2>
        <div class="info">
          <p><strong>Faculté:</strong> ${faculty}</p>
          <p><strong>Année:</strong> ${year}</p>
          <p><strong>Session:</strong> ${session}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${TABLE_COLUMNS.map(col => `<th>${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                ${TABLE_COLUMNS.map(col => `<td>${item[col.key as keyof CourseProgram]}</td>`).join('')}
              </tr>
            `).join('')}
            <tr class="total-row">
              <td>TOTAL</td>
              ${TABLE_COLUMNS.slice(1).map(col => {
                const total = data.reduce((sum, item) => sum + Number(item[col.key as keyof CourseProgram]), 0)
                return `<td>${total}</td>`
              }).join('')}
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  setTimeout(() => printWindow.print(), 250)
}

export default function TheTable({ int, year, faculty, session, onUpdateData }: TableProps) {
  const [sortBy, setSortBy] = useState<keyof CourseProgram | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editMode, setEditMode] = useState<'single' | 'bulk' | null>(null)
  const [editingRows, setEditingRows] = useState<EditFormRow[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [deleteConfirm, setDeleteConfirm] = useState<number | 'all' | null>(null)
  const [deleting, setDeleting] = useState(false)
  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = int.filter(
      (item: CourseProgram) => item.year === year && item.session === session
    )

    if (sortBy) {
      filtered = filtered.sort((a, b) => {
        const aVal = a[sortBy]
        const bVal = b[sortBy]

        if (typeof aVal === 'string') {
          return sortOrder === 'asc'
            ? aVal.localeCompare(bVal as string)
            : (bVal as string).localeCompare(aVal)
        }

        return sortOrder === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number)
      })
    }

    return filtered
  }, [int, year, session, sortBy, sortOrder])
  

  // Calculate totals
  const totals = useMemo(() => ({
    credit: filteredData.reduce((sum, item) => sum + item.credit, 0),
    session_subjet: filteredData.reduce((sum, item) => sum + item.session_subjet, 0),
    hour_session: filteredData.reduce((sum, item) => sum + item.hour_session, 0),
    total_hour: filteredData.reduce((sum, item) => sum + item.total_hour, 0)
  }), [filteredData])

  const handleSort = (key: keyof CourseProgram) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  const openEditModal = useCallback((rowId?: number) => {
    if (rowId) {
      // Edit single row
      const rowToEdit = filteredData.find(item => item.id === rowId)
      if (rowToEdit) {
        setEditingRows([{
          id: rowToEdit.id,
          courses: rowToEdit.courses,
          credit: rowToEdit.credit.toString(),
          session_subjet: rowToEdit.session_subjet.toString(),
          hour_session: rowToEdit.hour_session.toString(),
          total_hour: rowToEdit.total_hour.toString()
        }])
        setEditMode('single')
      }
    } else {
      // Edit all rows
      setEditingRows(filteredData.map(item => ({
        id: item.id,
        courses: item.courses,
        credit: item.credit.toString(),
        session_subjet: item.session_subjet.toString(),
        hour_session: item.hour_session.toString(),
        total_hour: item.total_hour.toString()
      })))
      setEditMode('bulk')
    }
    setShowEditModal(true)
    setErrors({})
  }, [filteredData])

  const handleEditRowChange = (index: number, field: string, value: string) => {
    const newRows = [...editingRows]
    newRows[index] = { ...newRows[index], [field]: value }
    setEditingRows(newRows)
    if (errors[`${field}-${index}`]) {
      const newErrors = { ...errors }
      delete newErrors[`${field}-${index}`]
      setErrors(newErrors)
    }
  }

  const validateEditForm = (): boolean => {
    const newErrors: FormErrors = {}
    editingRows.forEach((row, index) => {
      if (!row.courses.trim()) newErrors[`courses-${index}`] = 'Le cours est requis'
      if (!row.credit || parseFloat(row.credit) <= 0) newErrors[`credit-${index}`] = 'Le crédit doit être positif'
      if (!row.session_subjet || parseFloat(row.session_subjet) <= 0) newErrors[`session_subjet-${index}`] = 'Requis'
      if (!row.hour_session || parseFloat(row.hour_session) <= 0) newErrors[`hour_session-${index}`] = 'Requis'
      if (!row.total_hour || parseFloat(row.total_hour) <= 0) newErrors[`total_hour-${index}`] = 'Requis'
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveChanges = async () => {
    if (!validateEditForm()) return

    setLoading(true)
    setSuccess(false)

    try {
      for (const row of editingRows) {
        const { error } = await supabase
          .from('course_program')
          .update({
            courses: row.courses,
            credit: parseFloat(row.credit),
            session_subjet: parseFloat(row.session_subjet),
            hour_session: parseFloat(row.hour_session),
            total_hour: parseFloat(row.total_hour)
          })
          .eq('id', row.id)

        if (error) throw error
      }

      setSuccessMessage(`${editingRows.length} ligne(s) mise(s) à jour avec succès!`)
      setSuccess(true)
      setShowEditModal(false)
      setEditingRows([])

      // Refresh data by calling onUpdateData callback
      if (onUpdateData) {
        onUpdateData(int)
      }

      setTimeout(() => setSuccess(false), 5000)
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
      })
    } finally {
      setLoading(false)
    }
  }

  const closeEditModal = () => {
    if (!loading) {
      setShowEditModal(false)
      setEditingRows([])
      setEditMode(null)
      setErrors({})
    }
  }

  const handleDeleteRow = async (id: number) => {
    setDeleting(true)
    try {
      const { error } = await supabase.from('course_program').delete().eq('id', id)
      if (error) throw error
      setSuccessMessage('Cours supprimé avec succès!')
      setSuccess(true)
      if (onUpdateData) onUpdateData(int.filter(item => item.id !== id))
      setTimeout(() => setSuccess(false), 5000)
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Erreur lors de la suppression' })
    } finally {
      setDeleting(false)
      setDeleteConfirm(null)
    }
  }

  const handleDeleteAll = async () => {
    setDeleting(true)
    try {
      const ids = filteredData.map(item => item.id)
      const { error } = await supabase.from('course_program').delete().in('id', ids)
      if (error) throw error
      setSuccessMessage(`${ids.length} cours supprimé(s) avec succès!`)
      setSuccess(true)
      if (onUpdateData) onUpdateData(int.filter(item => !ids.includes(item.id)))
      setTimeout(() => setSuccess(false), 5000)
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Erreur lors de la suppression' })
    } finally {
      setDeleting(false)
      setDeleteConfirm(null)
    }
  }

  const fileName = `Programme_${faculty}_Annee${year}_Sesion${session}_${new Date().getTime()}`

  if (filteredData.length === 0) {
    return (
      <div className="m-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-amber-900">Aucun cours trouvé</p>
            <p className="text-sm text-amber-700">Aucun programme pour {faculty} - Année {year} - Session {session}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="m-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Success Notification */}
      {success && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-green-50 border-b border-green-200 px-6 py-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-800 font-medium text-sm">{successMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17.25S6.5 28 12 28s10-4.745 10-10.75S17.5 6.253 12 6.253z" />
              </svg>
              Programme Académique
            </h3>
            <div className="flex gap-4 mt-2 text-blue-100 text-sm">
              <span className="flex items-center gap-1">
                <span className="font-semibold">Faculté:</span> {faculty}
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold">Année:</span> {year}
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold">Session:</span> {session}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="relative flex gap-2 flex-wrap">
            <button
              onClick={() => openEditModal()}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Éditer Tout
            </button>

            <button
              onClick={() => setDeleteConfirm('all')}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer Tout
            </button>

            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 flex items-center gap-2 transition-all shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exporter
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => {
                    exportToCSV(filteredData, fileName)
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-all border-b border-gray-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                  </svg>
                  <div>
                    <p className="font-medium text-sm">CSV</p>
                    <p className="text-xs text-gray-500">Excel compatible</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    exportToJSON(filteredData, fileName)
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-all border-b border-gray-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                  </svg>
                  <div>
                    <p className="font-medium text-sm">JSON</p>
                    <p className="text-xs text-gray-500">Full data structure</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    exportToExcel(filteredData, fileName)
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-all border-b border-gray-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                  </svg>
                  <div>
                    <p className="font-medium text-sm">Excel</p>
                    <p className="text-xs text-gray-500">XLS format</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    printTable(filteredData, faculty, year, session)
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  <div>
                    <p className="font-medium text-sm">Imprimer</p>
                    <p className="text-xs text-gray-500">Format impression</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {editMode === 'bulk' ? 'Éditer tous les cours' : 'Éditer le cours'}
              </h2>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 font-medium text-sm">{errors.submit}</span>
              </div>
            )}

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {editingRows.map((row, index) => (
                <div key={row.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded">Ligne {index + 1}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Cours</label>
                      <input
                        type="text"
                        value={row.courses}
                        onChange={(e) => handleEditRowChange(index, 'courses', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                          errors[`courses-${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400 focus:border-amber-500'
                        }`}
                        placeholder="Nom du cours"
                      />
                      {errors[`courses-${index}`] && <p className="text-red-600 text-xs mt-0.5">{errors[`courses-${index}`]}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Crédit</label>
                      <input
                        type="number"
                        value={row.credit}
                        onChange={(e) => handleEditRowChange(index, 'credit', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                          errors[`credit-${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400 focus:border-amber-500'
                        }`}
                        placeholder="0"
                        step="0.1"
                      />
                      {errors[`credit-${index}`] && <p className="text-red-600 text-xs mt-0.5">{errors[`credit-${index}`]}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Séances/Mois</label>
                      <input
                        type="number"
                        value={row.session_subjet}
                        onChange={(e) => handleEditRowChange(index, 'session_subjet', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                          errors[`session_subjet-${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400 focus:border-amber-500'
                        }`}
                        placeholder="0"
                        step="0.1"
                      />
                      {errors[`session_subjet-${index}`] && <p className="text-red-600 text-xs mt-0.5">{errors[`session_subjet-${index}`]}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">H/Séance</label>
                      <input
                        type="number"
                        value={row.hour_session}
                        onChange={(e) => handleEditRowChange(index, 'hour_session', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                          errors[`hour_session-${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400 focus:border-amber-500'
                        }`}
                        placeholder="0"
                        step="0.1"
                      />
                      {errors[`hour_session-${index}`] && <p className="text-red-600 text-xs mt-0.5">{errors[`hour_session-${index}`]}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Total Heures</label>
                      <input
                        type="number"
                        value={row.total_hour}
                        onChange={(e) => handleEditRowChange(index, 'total_hour', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                          errors[`total_hour-${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400 focus:border-amber-500'
                        }`}
                        placeholder="0"
                        step="0.1"
                      />
                      {errors[`total_hour-${index}`] && <p className="text-red-600 text-xs mt-0.5">{errors[`total_hour-${index}`]}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={loading}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer les modifications'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-4 py-4 text-left font-semibold text-gray-700 text-sm w-12">Actions</th>
              {TABLE_COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key as keyof CourseProgram)}
                  className={`px-6 py-4 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none ${col.width}`}
                >
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    {col.label}
                    {sortBy === col.key && (
                      <svg
                        className={`w-4 h-4 text-blue-600 transition-transform ${
                          sortOrder === 'desc' ? 'rotate-180' : ''
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M3 8a1 1 0 011.414 0L10 13.172l5.586-5.172A1 1 0 1116.414 9l-7 6.5-7-6.5A1 1 0 013 8z" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((course, index) => (
              <tr
                key={course.id}
                className={`border-b transition-colors hover:bg-blue-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => openEditModal(course.id)}
                    title="Éditer cette ligne"
                    className="inline-flex items-center justify-center w-8 h-8 text-amber-600 hover:bg-amber-100 rounded-lg transition-all hover:shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{course.courses}</td>
                <td className="px-6 py-4 text-center text-gray-700">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                    {course.credit}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-gray-700 font-semibold">{course.session_subjet}</td>
                <td className="px-6 py-4 text-center text-gray-700 font-semibold">{course.hour_session}h</td>
                <td className="px-6 py-4 text-center text-gray-700 font-semibold">{course.total_hour}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-t-2 border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Cours</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{filteredData.length}</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Crédits</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{totals.credit}</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-green-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Séances/Mois</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{totals.session_subjet}</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-purple-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">H/Séance</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{totals.hour_session}h</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-orange-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Heures</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{totals.total_hour}h</p>
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 flex justify-between items-center">
        <p>
          📊 <span className="font-semibold">{filteredData.length}</span> cours affichés •
          Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
        </p>
      </div>
    </div>
  )
}

// export function TheTable2({ int, year, faculty, session }: TableProps) {
//   const filteredData = int.filter((item: CourseProgram) => item.year === year && item.session === session)

//   if (filteredData.length === 0) {
//     return null
//   }

//   return (
//     <div className="m-5 text-[14px]"> 
            
//             <ol className=" flex ">
//                 <li className="m-2">Faculté: {faculty}</li>
//                 <li className="m-2">Année: {year}</li>
//                 <li className="m-2">session: {session}</li>
//             </ol>
//              <ol className="flex text-center ">
//                 <li className="border-r min-w-50 bg-[#0077B6] text-white text-[16px] text-center pt-1 border-gray-800">Cours</li>
//                 <li className="border-r min-w-[15%] bg-[#0077B6] text-white text-[16px] text-center pt-1 border-gray-800">Crédit</li>
//                 <li className="border-r max-w-[15%] min-w-[5%] bg-[#0077B6] text-white text-[16px] text-center pt-1 border-gray-800">Nombres séances/heures</li>
//                 <li className="border-r max-w-[15%] min-w-[5%] bg-[#0077B6] text-white text-[16px] text-center pt-1 border-gray-800">nombres heures/séances</li>
//                 <li className="borde max-w-[15%] min-w-[5%] bg-[#0077B6] text-white text-[16px] text-center pt-1 border-gray-800">Nombres d'heures totals</li>
//                 </ol> 
//              {into.map((pro:any,index:any)=>
//             <ol key={pro.id} className={`flex text-center`}>
//                 <li className={`border-r min-w-50 ${colors[index % colors.length]}`}>{pro.courses}</li>
//                 <li className={`border-r min-w-[15%] font-bold ${colors[index % colors.length]}`}>{pro.credit}</li>
//                 <li className={`border-r min-w-[15%] font-bold ${colors[index % colors.length]}`}>{pro.session_subjet}</li>
//                 <li className={`border-r min-w-[15%] font-bold ${colors[index % colors.length]}`}>{pro.hour_session}</li>
//                 <li className={`border-r min-w-[15%] font-bold ${colors[index % colors.length]}`}>{pro.total_hour}</li>
//                 </ol>
//             )}
//             <ol className="flex text-center">
//                 <li className="border-r  min-w-50 font-bold">Totals</li>
//                 <li className="border-r border-b min-w-[15%] font-bold">
//                     {into?.reduce((accumulator : number, currentItem:any) => accumulator + Number(currentItem.credit), 0)}</li>
//                 <li className="border-r border-b min-w-[15%] font-bold">
//                     {into?.reduce((accumulator : number, currentItem:any) => accumulator + Number(currentItem.session_subjet), 0)}</li>
//                 <li className="border-r border-b min-w-[15%] font-bold">
//                     {into?.reduce((accumulator : number, currentItem:any) => accumulator + Number(currentItem.hour_session), 0)}</li>
//                 <li className="border-r border-b min-w-[15%] font-bold">
//                     {into?.reduce((accumulator : number, currentItem:any) => accumulator + Number(currentItem.total_hour), 0)}</li>
//                 </ol>
//         </div> : null}
//         </>
//     )
// }

// // export function TheTable2({int,year,faculty,session}:tab){
// //     const into= int.filter((item:any)=> item.year === year && item.session===session)
// //     return(
// //         <>
// //         {into ? <div className="m-5 text-[14px]"> 
            
// //             <ol className=" flex ">
// //                 <li className="m-2">Faculté: {faculty}</li>
// //                 <li className="m-2">Année: {year}</li>
// //                 <li className="m-2">session: {session}</li>
// //             </ol>
// //              <ol className="flex text-center ">
// //                 <li className=" min-w-50 bg-[#0077B6] text-white text-[16px] text-center pt-1 border-gray-800">Cours</li>
// //                 </ol> 
// //              {into.map((pro:any,index:any)=>
// //             <ol key={pro.id} className={`flex text-center`}>
// //                 <li className={` min-w-50 ${colors[index % colors.length]}`}>{pro.courses}</li>
// //                 </ol>
// //             )}
// //         </div> : null}
// //         </>
// //     )
// // }