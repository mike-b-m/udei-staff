import { useEffect, useState, useCallback } from "react"
import { supabase } from "../db"
import { Update } from "@/app/component/add-buuton/add_button"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Time from "../time/time"
import { Filter2 } from "../filter/filter"
import { exportToCSV, printHTML } from "../export/exportUtils"

// ============ TYPES ============
interface PaymentProps {
  id: number
  history: PaymentRecord[]
  balance: number
}

interface PaymentRecord {
  date: Date | string
  amount: number | string
  balance: number | string
}

//======= section for download infos =======
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

const TABLE_COLUMNS = [
  { key: 'courses', label: 'Cours', width: 'w-1/4' },
  { key: 'credit', label: 'Crédit', width: 'w-1/6' },
  { key: 'session_subjet', label: 'Séances/Mois', width: 'w-1/6' },
  { key: 'hour_session', label: 'H/Séance', width: 'w-1/6' },
  { key: 'total_hour', label: 'Total Heures', width: 'w-1/6' }
]

const printTable = (data: StudentPayment, faculty: string | null, year: number, user:User) => {
  const printWindow = window.open('', '', 'height=600,width=900')
  if (!printWindow) return

  let html = `
    <html>
      <head>
        <title>${user.first_name} ${user.last_name} - ${faculty} - Année ${year} Hist-paiements </title>
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
            .payment-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

/* Cell padding (px-6 py-4 equivalent) */
.payment-table th, 
.payment-table td {
  padding: 1rem 1.5rem;
  vertical-align: middle;
}

/* Container and Grid */
.payment-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.5rem;
}

/* Typography Base */
.label-text {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #4b5563; /* gray-600 */
  font-weight: 500;
}

.value-text {
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 700;
}

/* Colors */
.text-amber { color: #d97706; }
.text-blue { color: #2563eb; }
.text-gray-dark { 
  color: #1f2937; 
  font-size: 0.875rem;
  font-weight: 600;
}


        </style>
      </head><body>
        <h2>Historique des paiements</h2>
        <div class="info">
        <p><strong>Nom:</strong> ${user.last_name}</p>
        <p><strong>Prénom:</strong> ${user.first_name}</p>
        <p><strong>Code Étudiant:</strong> ${user.student_code}</p>
          <p><strong>Faculté:</strong> ${faculty}</p>
          <p><strong>Année:</strong> ${year}</p>
          <p><strong>Prix:</strong> ${formatCurrency(data?.price)} ${CURRENCY}</p>
          <p><strong>Remise:</strong> ${formatCurrency(data?.discount)} ${CURRENCY}</p>
          <p><strong>Solde:</strong> ${formatCurrency(data?.balance)} ${CURRENCY}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        <table>
          <thead>
            <tr>
            <td>Montant</td> 
             <td>Solde après</td>
            <td>Date</td>
            </tr>
          </thead>
          <tbody>
            ${data?.payment_history?.map((payment: PaymentRecord, index: number) =>`
              <tr>
                <td> ${formatCurrency(payment.amount)} ${CURRENCY}</td>
                  <td> ${formatCurrency(payment.balance)}  ${CURRENCY}L</td>
                  <td>  <Time open=${typeof payment.date === 'string' ? payment.date : payment.date instanceof Date ? payment.date.toISOString() : new Date(payment.date).toISOString()} /></td>
              </tr>
   `).join('')}
          </tbody>
        </table>
      </body> 
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  setTimeout(() => printWindow.print(), 250)
}
// ============ HELPER FUNCTIONS ============
const toNumber = (value: any): number => {
  const num = parseFloat(value)
  return isNaN(num) ? 0 : num
}

const formatCurrency = (value: any): string => {
  return toNumber(value).toFixed(2)
}

interface Faculty {
  id: number
  faculty: string
  price: number
}

interface User {
  id: number
  first_name: string
  last_name: string
  faculty: string
  student_code: string
}

interface StudentPayment {
  id: number
  student_id: number
  payment_history: PaymentRecord[]
  amount: number
  balance: number
  discount: number
  faculty: string
  price: number
}

interface StudentBalance {
  balance: number
}

interface StudentIdProp {
  id: number
}

// ============ CONSTANTS ============
const CURRENCY = "HTG"
const ROW_COLORS = ["bg-blue-50 hover:bg-blue-100", "bg-white hover:bg-gray-50"]

// ============ TOAST NOTIFICATIONS ============
interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

const Toast = ({ type, message, onClose }: { type: Toast['type']; message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  }[type]

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800'
  }[type]

  const icon = {
    success: (
      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  }[type]

  return (
    <div className={`fixed top-4 right-4 p-4 border rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-right duration-300 z-50 ${bgColor}`}>
      {icon}
      <p className={`font-medium text-sm ${textColor}`}>{message}</p>
    </div>
  )
}

// ============ PAYMENT FORM ============
export default function Pay({ id, history, balance }: PaymentProps) {
  const [amount, setAmount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [toast, setToast] = useState<Toast | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const numBalance = toNumber(balance)
  const remainingBalance = numBalance - amount

  const validatePayment = useCallback((): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!amount || amount <= 0) {
      newErrors.amount = "Le montant doit être supérieur à 0"
    }
    if (amount > numBalance) {
      newErrors.amount = "Le montant ne peut pas dépasser le solde"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [amount, numBalance])

  const handlePayment = async () => {
    if (!validatePayment()) return

    setLoading(true)
    try {
      const date = new Date()
      const newRecord: PaymentRecord = {
        date,
        amount,
        balance: remainingBalance
      }

      const updatedHistory = history ? [...history, newRecord] : [newRecord]

      const { error } = await supabase
        .from('student_payment')
        .update({
          balance: remainingBalance,
          payment_history: updatedHistory
        })
        .eq('id', id)

      if (error) throw error

      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `Paiement de ${amount} ${CURRENCY} effectué avec succès!`
      })

      setAmount(0)
      setShowConfirm(false)
      setErrors({})

      // Refresh parent data if needed
      window.location.reload()
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors du paiement'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Montant à payer
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(parseFloat(e.target.value) || 0)
                if (errors.amount) setErrors({})
              }}
              min={0}
              max={numBalance}
              step="0.01"
              className={`w-full px-4 py-3 rounded-lg border-2 text-lg font-semibold focus:outline-none focus:ring-2 transition-all ${
                errors.amount
                  ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/50'
                  : 'border-gray-300 bg-white hover:border-gray-400 focus:border-green-500 focus:ring-green-500/50'
              }`}
              placeholder="0.00"
            />
            <span className="absolute right-4 top-3 text-lg font-semibold text-gray-600">
              {CURRENCY}
            </span>
          </div>
          {errors.amount && (
            <p className="text-red-600 text-sm font-medium mt-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {errors.amount}
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
            <p className="text-xs font-semibold text-gray-600 uppercase">Solde actuel</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(numBalance)}</p>
            <p className="text-xs text-gray-500 mt-1">{CURRENCY}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
            <p className="text-xs font-semibold text-gray-600 uppercase">Montant</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(amount)}</p>
            <p className="text-xs text-gray-500 mt-1">{CURRENCY}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <p className="text-xs font-semibold text-gray-600 uppercase">Nouveau solde</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(remainingBalance)}</p>
            <p className="text-xs text-gray-500 mt-1">{CURRENCY}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {showConfirm ? (
          <div className="space-y-3">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-sm font-semibold text-yellow-800">
                ⚠️ Confirmez ce paiement de {formatCurrency(amount)} {CURRENCY} ?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9" />
                    </svg>
                    Traitement...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Confirmer le paiement
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!amount || amount <= 0}
            className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Effectuer le paiement
          </button>
        )}
      </div>
    </>
  )
}

// ============ FACULTY PRICE MANAGEMENT ============
export function Price() {
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [faculty, setFaculty] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    fetchFaculties()
  }, [])

  const fetchFaculties = async () => {
    try {
      const { data, error } = await supabase.from('faculty_price').select('*')
      if (error) throw error
      setFaculties(data || [])
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors du chargement des facultés'
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}
    if (!faculty.trim()) newErrors.faculty = 'Le nom de la faculté est requis'
    if (!price || price <= 0) newErrors.price = 'Le prix doit être supérieur à 0'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const { error } = await supabase.from('faculty_price').insert([{ faculty, price }])
      if (error) throw error

      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `${faculty} ajoutée avec succès!`
      })

      setFaculty('')
      setPrice(0)
      setShowForm(false)
      setErrors({})
      fetchFaculties()
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de l\'ajout'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="space-y-6 p-6">
        {/* Add Faculty Button/Form */}
        {showForm ? (
          <div className="bg-white rounded-lg border-2 border-blue-200 shadow-lg p-6 animate-in fade-in slide-in-from-top duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Ajouter une faculté
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom de la faculté
                </label>
                <input
                  type="text"
                  value={faculty}
                  onChange={(e) => {
                    setFaculty(e.target.value)
                    if (errors.faculty) setErrors({ ...errors, faculty: '' })
                  }}
                  className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                    errors.faculty
                      ? 'border-red-500 bg-red-50 focus:ring-red-500/50'
                      : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/50'
                  }`}
                  placeholder="Ex: Génie Civil"
                />
                {errors.faculty && <p className="text-red-600 text-sm mt-1">{errors.faculty}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prix annuel ({CURRENCY})
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => {
                    setPrice(parseFloat(e.target.value) || 0)
                    if (errors.price) setErrors({ ...errors, price: '' })
                  }}
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                    errors.price
                      ? 'border-red-500 bg-red-50 focus:ring-red-500/50'
                      : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/50'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setFaculty('')
                    setPrice(0)
                    setErrors({})
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9" />
                      </svg>
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Ajouter une faculté
          </button>
        )}

        {/* Faculties List */}
        {faculties.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Facultés enregistrées
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {faculties.map((fac, index) => (
                <div key={fac.id} className={`px-6 py-4 flex justify-between items-center ${ROW_COLORS[index % ROW_COLORS.length]} transition-colors`}>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{fac.faculty}</p>
                    <p className="text-sm text-gray-600">Prix annuel</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(fac.price)}</p>
                    <p className="text-sm text-gray-600">{CURRENCY}</p>
                  </div>
                  <div className="ml-6">
                    <Update value={fac.faculty} id={fac.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
            </svg>
            <p className="text-gray-600 font-medium">Aucune faculté enregistrée</p>
            <p className="text-sm text-gray-500">Cliquez sur "Ajouter une faculté" pour commencer</p>
          </div>
        )}
      </div>
    </>
  )
}

// ============ STUDENT BALANCE ============
export function StudentBal({ id }: StudentIdProp) {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { data, error } = await supabase
          .from('student_payment')
          .select('balance')
          .eq('student_id', id)
          .single()

        if (error) throw error
        setBalance(data?.balance || 0)
      } catch (err) {
        console.error('Error fetching balance:', err)
        setBalance(0)
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
  }, [id])

  if (loading) {
    return <span className="text-gray-500 text-sm">Chargement...</span>
  }

  return (
    <span className={`font-semibold ${balance && toNumber(balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
      {formatCurrency(balance)} {CURRENCY}
    </span>
  )
}

// ============ STUDENTS LIST ============
export function Student_pay() {
  const [students, setStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('student')
          .select('last_name, first_name, id, faculty,student_code')
          .order('last_name', { ascending: true })

        if (error) throw error
        setStudents(data || [])
      } catch (err) {
        console.error('Error fetching students:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium">Chargement des étudiants...</p>
        </div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-2a6 6 0 0112 0v2zm0 0h6v-2a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="text-gray-600 font-medium">Aucun étudiant trouvé</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-2a6 6 0 0112 0v2zm0 0h6v-2a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900">Liste des étudiants</h2>
        <span className="ml-auto bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
          {students.length} étudiant{students.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 font-semibold text-gray-700 border-b border-gray-200">
          <div>Nom et Prénom</div>
          <div className="text-center">Balance</div>
          <div>Faculté</div>
          <div className="text-center">Niveau</div>
        </div>

        <div className="divide-y divide-gray-200">
          {students.map((student, index) => (
            <Link
              href={`/admin/payment?id=${student.id}`}
              key={student.id}
              className={`grid grid-cols-4 gap-4 p-4 items-center transition-all hover:shadow-md ${
                ROW_COLORS[index % ROW_COLORS.length]
              }`}
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {student.last_name} {student.first_name}
                </p>
                <p className="text-xs text-gray-500 mt-1">ID: {student.id}</p>
              </div>
              <div className="text-center">
                <StudentBal id={student.id} />
              </div>
              <div>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {student.faculty}
                </span>
              </div>
              <div className="text-center">
                <Filter2 id={student.id} bool />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============ PAYMENTS HISTORY ============
export function Payments() {
  const [payments, setPayments] = useState<StudentPayment[]>([])
  const [student, setStudent] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<Toast | null>(null)

  const searchParams = useSearchParams()
  const studentId = searchParams.get('id')

  useEffect(() => {
    if (!studentId) return

    const fetchPayment = async () => {
      try {
        const { data: paymentData, error: paymentError } = await supabase
          .from('student_payment')
          .select('*')
          .eq('student_id', studentId)

        if (paymentError) throw paymentError

        const { data: studentData, error: studentError } = await supabase
          .from('student')
          .select('last_name, first_name, id, faculty,student_code')
          .eq('id', studentId)
          .single()

        if (studentError) throw studentError

        setPayments(paymentData || [])
        setStudent(studentData)
      } catch (err) {
        setToast({
          id: Date.now().toString(),
          type: 'error',
          message: 'Erreur lors du chargement des informations'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPayment()
  }, [studentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4v2m0-4v2" />
        </svg>
        <p className="text-red-700 font-semibold">Aucun étudiant trouvé</p>
      </div>
    )
  }

  const currentPayment = payments[0]

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="space-y-6 p-6">
        {/* Student Info */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            <h2 className="text-2xl font-bold">
              {student.last_name} {student.first_name}
            </h2>
          </div>
          <p className="text-blue-100 text-sm">ID Étudiant: #{student.id}</p>
        </div>

        {/* Export Buttons */}
        {currentPayment?.payment_history && currentPayment.payment_history.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const title = `Historique Paiements - ${student.last_name} ${student.first_name}`
                const html = `
                  <h2>${title}</h2>
                  <div class="info">
                    <p><strong>Code:</strong> ${student.student_code}</p>
                    <p><strong>Faculté:</strong> ${student.faculty}</p>
                    <p><strong>Prix:</strong> ${formatCurrency(currentPayment.price)} ${CURRENCY}</p>
                    <p><strong>Remise:</strong> ${formatCurrency(toNumber(currentPayment.discount))} ${CURRENCY}</p>
                    <p><strong>Solde:</strong> ${formatCurrency(currentPayment.balance)} ${CURRENCY}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                  </div>
                  <table>
                    <thead><tr><th>Montant</th><th>Solde après</th><th>Date</th></tr></thead>
                    <tbody>
                      ${currentPayment.payment_history.map((p: PaymentRecord) => `
                        <tr>
                          <td>${formatCurrency(p.amount)} ${CURRENCY}</td>
                          <td>${formatCurrency(p.balance)} ${CURRENCY}</td>
                          <td>${typeof p.date === 'string' ? new Date(p.date).toLocaleDateString('fr-FR') : new Date(p.date).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                `
                printHTML(title, html)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              PDF
            </button>
            <button
              onClick={() => {
                const headers = ['Montant', 'Solde après', 'Date']
                const rows = currentPayment.payment_history.map((p: PaymentRecord) => [
                  `${formatCurrency(p.amount)} ${CURRENCY}`,
                  `${formatCurrency(p.balance)} ${CURRENCY}`,
                  typeof p.date === 'string' ? new Date(p.date).toLocaleDateString('fr-FR') : new Date(p.date).toLocaleDateString('fr-FR'),
                ])
                exportToCSV(headers, rows, `paiements_${student.student_code}`)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
              Excel
            </button>
            <button
              onClick={() => {
                printTable(currentPayment, student?.faculty, 1, student)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Imprimer
            </button>
          </div>
        )}

        {/* Payment Info Cards */}
        {currentPayment && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border-2 border-green-200 shadow-md p-6">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Prix/An</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(currentPayment.price)}</p>
              <p className="text-xs text-gray-500 mt-1">{CURRENCY}</p>
            </div>

            <div className="bg-white rounded-lg border-2 border-orange-200 shadow-md p-6">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Remise</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{formatCurrency(toNumber(currentPayment.discount))}</p>
              <p className="text-xs text-gray-500 mt-1">{CURRENCY}</p>
            </div>

            <div className="bg-white rounded-lg border-2 border-blue-200 shadow-md p-6">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Solde actuel</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(currentPayment.balance)}</p>
              <p className="text-xs text-gray-500 mt-1">{CURRENCY}</p>
            </div>

            <div className="bg-white rounded-lg border-2 border-gray-200 shadow-md p-6">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Faculté</p>
              <p className="text-lg font-bold text-gray-800 mt-2">{currentPayment.faculty}</p>
            </div>
          </div>
        )}

        {/* Payment Form */}
        {currentPayment && (
          <div className="bg-white rounded-lg border-2 border-green-200 shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Effectuer un paiement
            </h3>
            <Pay id={currentPayment.id} balance={currentPayment.balance} history={currentPayment.payment_history || []} />
          </div>
        )}

        {/* Payment History */}
        {currentPayment?.payment_history && currentPayment.payment_history.length > 0 && (
          <div className="bg-white rounded-lg border-2 border-gray-200 shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Historique des paiements ({currentPayment.payment_history.length})
              </h3>
            </div>

            <div className="divide-y divide-gray-200">
              {currentPayment.payment_history.map((payment: PaymentRecord, index: number) => (
                <div key={index} className={`px-6 py-4 grid grid-cols-3 gap-4 items-center ${ROW_COLORS[index % ROW_COLORS.length]}`}>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Montant</p>
                    <p className="text-lg font-bold text-amber-600">{formatCurrency(payment.amount)} {CURRENCY}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Solde après</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(payment.balance)} {CURRENCY}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Date</p>
                    <p className="text-sm font-semibold text-gray-800">
                      <Time open={typeof payment.date === 'string' ? payment.date : payment.date instanceof Date ? payment.date.toISOString() : new Date(payment.date).toISOString()} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!currentPayment?.payment_history || currentPayment.payment_history.length === 0 && (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m0 0V5m0 0l-4 4m4-4l4 4" />
            </svg>
            <p className="text-gray-600 font-medium">Aucune transaction</p>
            <p className="text-sm text-gray-500">Les paiements s\'afficheront ici</p>
          </div>
        )}
      </div>
    </>
  )
}