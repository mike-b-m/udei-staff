'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Lecture from '../lect_input/lecture'
import { useStudentData, useStudentSearch } from './useStudentData'
import { ADMIN_ROLES, EDITOR_ROLES } from './constants'
import { StudentSearchProps, StudentData, StudentStatus } from './types'
import { supabase } from '../db'
import { exportToCSV, printHTML } from '../export/exportUtils'
import { Readsession } from '../teacher/teacher'

const yearexam = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6'
]
const sessionexam = [
  '1',
  '2',
]

/**
 * Unified StudentInfos Component
 *
 * This component replaces the old StudentInfos + StudentInfos2 (95% duplicate code)
 * Now works in both full-page and modal modes with a single implementation
 *
 * Usage:
 * - Full page: <StudentInfos displayMode="full-page" showSearchInputs={true} />
 * - Modal: <StudentInfos displayMode="modal" studentCode="E001" studentName="Smith John" />
 */
export default function StudentInfos(props: StudentSearchProps) {
  const {
    studentCode: initialCode,
    displayMode = 'full-page',
    studentName,
    onClose,
    showSearchInputs = true
  } = props

  // Form state
  const [studentCode, setStudentCode] = useState(initialCode || '')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [searchMode, setSearchMode] = useState(true) // true = name search, false = code search
  const [isOpen, setIsOpen] = useState(false)

  // Data fetching
  const { student, status, userRole, loading, error } = useStudentData(studentCode)
  const { searchResults, searching, search } = useStudentSearch()

  // Handlers
  const handleSearch = () => {
    if (searchMode && (firstName || lastName)) {
      search(firstName, lastName)
    } else if (!searchMode && studentCode) {
      setStudentCode(studentCode)
    }
  }

  const handleSelectStudent = (code: string) => {
    setStudentCode(code)
    setFirstName('')
    setLastName('')
  }

  // Permission checks with type-safe narrowing
  const canEdit = userRole ? EDITOR_ROLES.includes(userRole.role as any) : false
  const canViewPayment = userRole ? ADMIN_ROLES.includes(userRole.role as any) : false

  // ===== MODAL MODE =====
  if (displayMode === 'modal') {
    return (
      <div>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="font-medium text-gray-700 hover:text-gray-900 hover:underline transition"
        >
          {studentName}
        </button>

        {/* Modal Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto max-w-3xl w-full">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Informations {studentName}</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-light"
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              {loading && <LoadingState />}
              {error && <ErrorState message={error} />}
              {student && (
                <StudentDisplayContent
                  student={student}
                  status={status ?? undefined}
                  userRole={userRole ?? undefined}
                  canViewPayment={canViewPayment}
                  canEdit={canEdit}
                />
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ===== FULL-PAGE MODE =====
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Recherche Étudiant</h1>
          <p className="text-gray-600">Consultez les informations complètes d'un étudiant</p>
        </div>

        {/* Search Section */}
        {showSearchInputs && (
          <SearchSection
            searchMode={searchMode}
            onToggleMode={() => setSearchMode(!searchMode)}
            firstName={firstName}
            onFirstNameChange={setFirstName}
            lastName={lastName}
            onLastNameChange={setLastName}
            studentCode={studentCode}
            onStudentCodeChange={setStudentCode}
            onSearch={handleSearch}
            isLoading={searching || loading}
          />
        )}

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <SearchResults results={searchResults} onSelect={handleSelectStudent} />
        )}

        {/* Main Content */}
        <div>
          {loading && <LoadingState />}
          {error && <ErrorState message={error} />}

          {student ? (
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <StudentDisplayContent
                student={student}
                status={status ?? undefined}
                userRole={userRole ?? undefined}
                canViewPayment={canViewPayment}
                canEdit={canEdit}
              />
            </div>
          ) : !loading && !error && (
            <EmptyState message="Veuillez rechercher un étudiant pour voir ses informations" />
          )}
        </div>
      </div>
    </div>
  )
}

// ===== SUB-COMPONENTS =====

interface SearchSectionProps {
  searchMode: boolean
  onToggleMode: () => void
  firstName: string
  onFirstNameChange: (value: string) => void
  lastName: string
  onLastNameChange: (value: string) => void
  studentCode: string
  onStudentCodeChange: (value: string) => void
  onSearch: () => void
  isLoading: boolean
}

function SearchSection({
  searchMode,
  onToggleMode,
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
  studentCode,
  onStudentCodeChange,
  onSearch,
  isLoading
}: SearchSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex gap-2 mb-4">
        <button
          onClick={onToggleMode}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {searchMode ? 'Chercher par Code' : 'Chercher par Nom'}
        </button>
      </div>

      {searchMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nom de famille"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <input
            type="text"
            placeholder="Prénom"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      ) : (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Code Étudiant (ex: E001)"
            value={studentCode}
            onChange={(e) => onStudentCodeChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      )}

      <button
        onClick={onSearch}
        disabled={isLoading}
        className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
      >
        {isLoading ? 'Recherche en cours...' : 'Rechercher'}
      </button>
    </div>
  )
}

interface SearchResultsProps {
  results: Array<{
    id: number
    first_name: string
    last_name: string
    faculty: string
    student_code: string
  }>
  onSelect: (code: string) => void
}

function SearchResults({ results, onSelect }: SearchResultsProps) {
  return (
    <div className="bg-white rounded-xl shadow-md mb-6 max-h-64 overflow-y-auto border border-gray-200">
      {results.map((student) => (
        <button
          key={student.id}
          onClick={() => onSelect(student.student_code)}
          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition"
        >
          <div className="font-semibold text-gray-900">
            {student.last_name} {student.first_name}
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <span>{student.faculty}</span>
            <span className="text-gray-400">•</span>
            <span className="font-mono text-blue-600">{student.student_code}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

interface StudentDisplayContentProps {
  student: any
  status: any | undefined
  userRole: any | undefined
  canViewPayment: boolean
  canEdit: boolean
}

// ===== EXPORT HELPERS FOR STUDENT INFO =====
function getStudentPersonalAndFamilyHTML(student: any) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fiche Étudiant - ${student.last_name} ${student.first_name}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #d32f2f;
          padding-bottom: 20px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }
        .logo {
          width: 60px;
          height: 60px;
          margin-right: 20px;
        }
        .university-name {
          text-align: center;
        }
        .university-name h1 {
          margin: 0;
          color: #1b5e20;
          font-size: 16px;
          font-weight: bold;
        }
        .university-name h2 {
          margin: 5px 0 0 0;
          color: #000;
          font-size: 20px;
          font-weight: bold;
        }
        .red-bar {
          background-color: #d32f2f;
          height: 8px;
          margin: 10px 0;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #000;
          margin: 20px 0;
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
          font-weight: bold;
        }
        td {
          border: 1px solid #ddd;
          padding: 10px;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #1b5e20;
          margin-top: 20px;
          margin-bottom: 10px;
          border-left: 4px solid #d32f2f;
          padding-left: 10px;
        }
        .info {
          margin: 10px 0;
          color: #666;
          font-size: 12px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          font-size: 11px;
          color: #999;
          text-align: center;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .red-bar { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="logo-section">
          <img src="/image/icon.png" alt="UDEI Logo" class="logo">
          <div class="university-name">
            <h1>UNIVERSITÉ D'ÉTUDES INTERNATIONALES</h1>
            <h2>UDEI</h2>
          </div>
        </div>
        <div class="red-bar"></div>
      </div>

      <!-- Title -->
      <div class="title">Fiche Étudiant</div>

      <!-- Date and Info -->
      <div class="info">
        <p><strong>Date d'émission:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <p><strong>Généré par:</strong> Système de Gestion Académique UDEI</p>
      </div>

      <!-- Personal Information -->
      <div class="section-title">📋 Informations Personnelles</div>
      <table>
        <tbody>
          <tr><td width="30%"><strong>Nom</strong></td><td>${student.last_name || '—'}</td></tr>
          <tr><td><strong>Prénom</strong></td><td>${student.first_name || '—'}</td></tr>
          <tr><td><strong>Code Étudiant</strong></td><td>${student.student_code || '—'}</td></tr>
          <tr><td><strong>Année Académique</strong></td><td>${student.academy || '—'}</td></tr>
          <tr><td><strong>Faculté</strong></td><td>${student.faculty || '—'}</td></tr>
          <tr><td><strong>Email</strong></td><td>${student.email || '—'}</td></tr>
          <tr><td><strong>Téléphone</strong></td><td>${student.phone_number || '—'}</td></tr>
          <tr><td><strong>Sexe</strong></td><td>${student.sex || '—'}</td></tr>
          <tr><td><strong>Statut Matrimonial</strong></td><td>${student.marital_status || '—'}</td></tr>
          <tr><td><strong>Date de Naissance</strong></td><td>${student.date_birth || '—'}</td></tr>
          <tr><td><strong>Lieu de Naissance</strong></td><td>${student.place_of_birth || '—'}</td></tr>
          <tr><td><strong>NIF/CIN</strong></td><td>${student.nif_cin || '—'}</td></tr>
          <tr><td><strong>Adresse</strong></td><td>${student.adress || '—'}</td></tr>
        </tbody>
      </table>

      <!-- Family Information - Mother -->
      <div class="section-title">👩 Informations Familiales — Mère</div>
      <table>
        <tbody>
          <tr><td width="30%"><strong>Nom</strong></td><td>${student.mother_name || '—'}</td></tr>
          <tr><td><strong>Lieu de Naissance</strong></td><td>${student.mother_birth || '—'}</td></tr>
          <tr><td><strong>Domicile</strong></td><td>${student.mother_residence || '—'}</td></tr>
          <tr><td><strong>Téléphone</strong></td><td>${student.mother_phone || '—'}</td></tr>
          <tr><td><strong>Profession</strong></td><td>${student.mother_profesion || '—'}</td></tr>
        </tbody>
      </table>

      <!-- Family Information - Father -->
      <div class="section-title">👨 Informations Familiales — Père</div>
      <table>
        <tbody>
          <tr><td width="30%"><strong>Nom</strong></td><td>${student.father_name || '—'}</td></tr>
          <tr><td><strong>Lieu de Naissance</strong></td><td>${student.father_birth || '—'}</td></tr>
          <tr><td><strong>Domicile</strong></td><td>${student.father_residence || '—'}</td></tr>
          <tr><td><strong>Téléphone</strong></td><td>${student.father_phone || '—'}</td></tr>
          <tr><td><strong>Profession</strong></td><td>${student.father_profesion || '—'}</td></tr>
        </tbody>
      </table>

      <!-- Footer -->
      <div class="footer">
        <p>© 2026 Université d'Études Internationales d'Haïti (UDEI) | Système de Gestion Académique</p>
        <p>Tél: 48-809-772 | Email: udelformationuniversitaire@gmail.com</p>
      </div>
    </body>
    </html>
  `
}

function exportStudentCSV(student: any) {
  const headers = ['Champ', 'Valeur']
  const rows = [
    ['Nom', student.last_name || ''],
    ['Prénom', student.first_name || ''],
    ['Code Étudiant', student.student_code || ''],
    ['Année Académique', student.academy || ''],
    ['Email', student.email || ''],
    ['Téléphone', student.phone_number || ''],
    ['Faculté', student.faculty || ''],
    ['Sexe', student.sex || ''],
    ['Statut Matrimonial', student.marital_status || ''],
    ['Date de Naissance', student.date_birth || ''],
    ['Lieu de Naissance', student.place_of_birth || ''],
    ['NIF/CIN', student.nif_cin || ''],
    ['Adresse', student.adress || ''],
    ['--- Mère ---', ''],
    ['Nom Mère', student.mother_name || ''],
    ['Lieu Naissance Mère', student.mother_birth || ''],
    ['Domicile Mère', student.mother_residence || ''],
    ['Téléphone Mère', student.mother_phone || ''],
    ['Profession Mère', student.mother_profesion || ''],
    ['--- Père ---', ''],
    ['Nom Père', student.father_name || ''],
    ['Lieu Naissance Père', student.father_birth || ''],
    ['Domicile Père', student.father_residence || ''],
    ['Téléphone Père', student.father_phone || ''],
    ['Profession Père', student.father_profesion || ''],
  ]
  exportToCSV(headers, rows, `etudiant_${student.student_code}`)
}

// ===== EDIT MODAL =====
function EditFieldModal({ isOpen, onClose, title, fields, onSave }: {
  isOpen: boolean
  onClose: () => void
  title: string
  fields: { label: string; key: string; value: string; type?: string }[]
  onSave: (values: Record<string, string>) => Promise<void>
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map(f => [f.key, f.value || '']))
  )
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(values)
      onClose()
    } catch {
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div className="space-y-3">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type || 'text'}
                value={values[f.key] || ''}
                onChange={e => setValues({ ...values, [f.key]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={saving} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== EXPORT BUTTONS BAR =====
function ExportBar({ onPrint, onExcel, onPDF }: { onPrint: () => void; onExcel: () => void; onPDF: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={onPDF} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-medium">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        PDF
      </button>
      <button onClick={onExcel} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition text-sm font-medium">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
        Excel
      </button>
      <button onClick={onPrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
        Imprimer
      </button>
    </div>
  )
}

function StudentDisplayContent({
  student,
  status,
  userRole,
  canViewPayment,
  canEdit
}: StudentDisplayContentProps) {
  const [editInfoOpen, setEditInfoOpen] = useState(false)
  const [editStatusOpen, setEditStatusOpen] = useState(false)
  const [open, setOpen] = useState('')
  const [photoChangeOpen, setPhotoChangeOpen] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const handleExportPrint = () => {
    printHTML(`Fiche ${student.last_name} ${student.first_name}`, getStudentPersonalAndFamilyHTML(student))
  }
  const handleExportPDF = handleExportPrint // PDF via print dialog (Save as PDF)
  const handleExportExcel = () => exportStudentCSV(student)

  const handleSaveInfo = async (values: Record<string, string>) => {
    const { error } = await supabase.from('student').update(values).eq('id', student.id)
    if (error) throw error
    window.location.reload()
  }

  const handleSaveStatus = async (values: Record<string, string>) => {
    const payload: Record<string, any> = { ...values }
    if (values.year_study) payload.year_study = parseInt(values.year_study)
    if (values.year_completed) payload.year_completed = parseInt(values.year_completed)
    const { error } = await supabase.from('student_status').update(payload).eq('student_id', student.id)
    if (error) throw error
    window.location.reload()
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError('La photo doit être inférieure à 5MB')
        return
      }
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
      setPhotoError(null)
    }
  }

  const handlePhotoSave = async () => {
    if (!photoFile) return

    setPhotoLoading(true)
    setPhotoError(null)

    try {
      // Upload new photo
      const fileExt = photoFile.name.split('.').pop()
      const fileName = `student_${student.id}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('student_photo')
        .upload(fileName, photoFile, { contentType: photoFile.type })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('student_photo')
        .getPublicUrl(fileName)

      // Update student record
      const { error: updateError } = await supabase
        .from('student')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', student.id)

      if (updateError) throw updateError

      setPhotoChangeOpen(false)
      setPhotoFile(null)
      setPhotoPreview(null)
      window.location.reload()
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la photo')
    } finally {
      setPhotoLoading(false)
    }
  }
  return (
    <div className="space-y-8">
      {/* Export & Edit Modals */}
      <EditFieldModal
        isOpen={editInfoOpen}
        onClose={() => setEditInfoOpen(false)}
        title="Modifier Informations Personnelles"
        fields={[
          { label: 'Nom', key: 'last_name', value: student.last_name || '' },
          { label: 'Prénom', key: 'first_name', value: student.first_name || '' },
          { label: 'Email', key: 'email', value: student.email || '', type: 'email' },
          { label: 'Téléphone', key: 'phone_number', value: student.phone_number || '', type: 'tel' },
          { label: 'Adresse', key: 'adress', value: student.adress || '' },
          { label: 'Sexe', key: 'sex', value: student.sex || '' },
          { label: 'Statut Matrimonial', key: 'marital_status', value: student.marital_status || '' },
          { label: 'NIF/CIN', key: 'nif_cin', value: student.nif_cin || '' },
        ]}
        onSave={handleSaveInfo}
      />
      {status && (
        <EditFieldModal
          isOpen={editStatusOpen}
          onClose={() => setEditStatusOpen(false)}
          title="Modifier Statut Académique"
          fields={[
            { label: 'Année Actuelle', key: 'year_study', value: String(status.year_study || ''), type: 'number' },
            { label: 'Année Complétée', key: 'year_completed', value: String(status.year_completed || ''), type: 'number' },
            { label: 'Année Académique', key: 'academic_year', value: String(status.academic_year || ''), type: 'string' },
          ]}
          onSave={handleSaveStatus}
        />
      )}

      {/* Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-900">Fiche Étudiant</h3>
        <ExportBar onPrint={handleExportPrint} onExcel={handleExportExcel} onPDF={handleExportPDF} />
      </div>

      {/* Personal Information */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-3 border-b-2 border-blue-500">
          <h3 className="text-xl font-bold text-gray-900">
            📋 Informations Personnelles
          </h3>
          {canEdit && (
            <button onClick={() => setEditInfoOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition text-sm font-medium mt-2 sm:mt-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Modifier
            </button>
          )}
        </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Photo */}
          <div className="md:col-span-1">
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-300 flex items-center justify-center shrink-0 shadow-md relative group">
              {student.photo_url ? (
                <Image
                  src={student.photo_url}
                  alt={`${student.first_name} ${student.last_name}`}
                  width={150}
                  height={150}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-20 h-20 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              )}
              {canEdit && (
                <button
                  onClick={() => setPhotoChangeOpen(true)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </div>
            {canEdit && (
              <button
                onClick={() => setPhotoChangeOpen(true)}
                className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Changer la photo
              </button>
            )}
          </div>

          {/* Info Grid */}
          <div className="md:col-span-2 space-y-2">
            <Lecture int="Nom" out={student.last_name} />
            <Lecture int="Prénom" out={student.first_name} />
            <Lecture int="Code Étudiant" out={student.student_code} />
            <Lecture int="Année Académie" out={student.academy} />
            <Lecture int="Email" out={student.email} />
            <Lecture int="Téléphone" out={student.phone_number} />
            <Lecture int="Faculté" out={student.faculty} />
          </div>
        </div>

        {/* Photo Change Modal */}
        {photoChangeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Changer la photo</h3>
                <button
                  onClick={() => {
                    setPhotoChangeOpen(false)
                    setPhotoFile(null)
                    setPhotoPreview(null)
                    setPhotoError(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Preview */}
                {photoPreview && (
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                    <Image
                      src={photoPreview}
                      alt="Aperçu"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* File Input */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Sélectionner une photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Error Message */}
                {photoError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {photoError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setPhotoChangeOpen(false)
                      setPhotoFile(null)
                      setPhotoPreview(null)
                      setPhotoError(null)
                    }}
                    disabled={photoLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handlePhotoSave}
                    disabled={!photoFile || photoLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {photoLoading ? 'Enregistrement...' : 'Confirmer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Lecture int="Sexe" out={student.sex} />
          <Lecture int="Statut Matrimonial" out={student.marital_status} />
          <Lecture int="Date de Naissance" out={student.date_birth} />
          <Lecture int="Lieu de Naissance" out={student.place_of_birth} />
          <Lecture int="NIF/CIN" out={student.nif_cin} />
          <Lecture int="Adresse" out={student.adress} />
        </div>
      </div>

      {/* Academic Status */}
      {status && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-3 border-b-2 border-green-500">
            <h3 className="text-xl font-bold text-gray-900">
              🎓 Statut Académique
            </h3>
            {canEdit && (
              <button onClick={() => setEditStatusOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition text-sm font-medium mt-2 sm:mt-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Modifier
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg">
            <Lecture int="Année Actuelle" out={status.year_study} />
            <Lecture int="Année Complétée" out={status.year_completed} />
            <Lecture int="Vu par" out={student.seen_by || 'Non assigné'} />
            <Lecture int="Année Académique" out={status.academic_year || 'Non assigné'} />
            <Lecture int="Faculté Complétée" out={status.faculty_completion ? '✅ Oui' : '❌ Non'} />
          </div>
        </div>
      )}

      {/* Family Information */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-purple-500">
          👨‍👩‍👧 Informations Familiales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mother Info */}
          <div className="bg-pink-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              👩 Mère
            </h4>
            <div className="space-y-2">
              <Lecture int="Nom" out={student.mother_name || '—'} />
              <Lecture int="Lieu de Naissance" out={student.mother_birth || '—'} />
              <Lecture int="Domicile" out={student.mother_residence || '—'} />
              <Lecture int="Téléphone" out={student.mother_phone || '—'} />
              <Lecture int="Profession" out={student.mother_profesion || '—'} />
            </div>
          </div>

          {/* Father Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              👨 Père
            </h4>
            <div className="space-y-2">
              <Lecture int="Nom" out={student.father_name || '—'} />
              <Lecture int="Lieu de Naissance" out={student.father_birth || '—'} />
              <Lecture int="Domicile" out={student.father_residence || '—'} />
              <Lecture int="Téléphone" out={student.father_phone || '—'} />
              <Lecture int="Profession" out={student.father_profesion || '—'} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap pt-6 border-t border-gray-200">
        {canViewPayment && (
          <Link
            href={`/admin/payment?id=${student.id}`}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
              />
            </svg>
            Voir les Paiements
          </Link>
        )}

        {/* Years and Sessions */}
        <div className='flex flex-wrap gap-2'>
          {yearexam.map(j => sessionexam.map(s =>
            <button
              key={`${j}-${s}`}
              onClick={() => setOpen(open === `${j}-${s}` ? '' : `${j}-${s}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
            >
              Année {j} - Session {s}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Pop-up Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 animate-in fade-in zoom-in">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-linear-to-r from-blue-600 to-blue-500 text-white rounded-t-xl">
              <h3 className="text-xl font-bold">
                Notes - Année {open.split('-')[0]} - Session {open.split('-')[1]}
              </h3>
              <button
                onClick={() => setOpen('')}
                className="text-white hover:text-gray-200 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <Readsession
                faculty=""
                session={open.split('-')[1]}
                year={open.split('-')[0]}
                id={student.id}
                name=""
                matiere=''
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setOpen('')}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="text-gray-600 mt-4 font-medium">Chargement des informations...</p>
      </div>
    </div>
  )
}

interface ErrorStateProps {
  message: string
}

function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
      <p className="text-red-800 font-semibold flex items-center gap-2">
        <span>⚠️ Erreur</span>
      </p>
      <p className="text-red-700 text-sm mt-1">{message}</p>
    </div>
  )
}

interface EmptyStateProps {
  message: string
}

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="bg-linear-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
      <svg
        className="mx-auto h-16 w-16 text-gray-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-gray-600 text-lg font-medium">{message}</p>
    </div>
  )
}

// ===== BACKWARDS COMPATIBILITY EXPORT =====

/**
 * StudentInfos2 - Now just a wrapper around unified StudentInfos component
 * Kept for backwards compatibility with /admin/page.tsx
 */
export function StudentInfos2({
  search,
  fullnamex
}: {
  search: string
  fullnamex: string
}) {
  return (
    <StudentInfos
      studentCode={search}
      displayMode="modal"
      studentName={fullnamex}
      showSearchInputs={false}
    />
  )
}