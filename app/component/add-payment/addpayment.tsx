'use client'

import { useEffect, useState, useCallback } from "react"
import { supabase } from "../db"
import { Update } from "@/app/component/add-buuton/add_button"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Time from "../time/time"
import { Filter2 } from "../filter/filter"
import { exportToCSV, printHTML } from "../export/exportUtils"
import { Scanner } from "@yudiel/react-qr-scanner"

// ============ TYPES ============
interface PaymentProps {
  id: number
  history: PaymentRecord[]
  balance: number
  discount: number 
  price: number
  onSuccess?: () => void
  v_1: number
  v_2: number
  v_3: number
  remise: number
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
                  <td>  ${new Date(payment.date).toLocaleDateString('fr-FR')}</td>
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
  payment_history?: PaymentRecord[]
  amount?: number
  balance: number
  discount?: number
  faculty?: string
  price: number
  remise?: number
  v_1?: boolean
  v_2?: boolean
  v_3?: boolean  
}

interface StudentBalance {
  balance: number
}

interface StudentIdProp {
  id: number
  v_1: boolean
  v_2: boolean
  v_3: boolean
  onSuccess?: () => void
}

// ============ CONSTANTS ============
const CURRENCY = "HT"
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
export default function Pay({ id, history, balance, discount,remise, price,v_1, v_2, v_3, onSuccess }: PaymentProps) {
  const [amount, setAmount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [toast, setToast] = useState<Toast | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [studentdiscount, setStudentdiscount] = useState<number>(0)
  const [versement, setVersement] = useState<number>(0)

  const numBalance = toNumber(balance)
  const numDiscount = toNumber(discount)
  const numPrice = toNumber(price)
  const remainingBalance = numBalance === numPrice ? numBalance - numDiscount - amount : numBalance - amount 

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
          payment_history: updatedHistory,
          v_1: v_1 <= ((price-remise)-remainingBalance) ? true : false,
            v_2: v_2 <= ((price-remise)-remainingBalance) && v_1 <= ((price-remise)-remainingBalance) ? true : false,
            v_3: remainingBalance === 0 ? true : false,
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
      onSuccess?.()
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

   const handlediscount = async () => {

    setLoading(true)
    try {
      const { error } = await supabase
        .from('student_payment')
        .update({
          discount: studentdiscount,
          balance: numBalance - studentdiscount
        })
        .eq('id', id)

      if (error) throw error
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `Remise de ${studentdiscount} ${CURRENCY} appliquée avec succès!`
      })
      setStudentdiscount(0)
      onSuccess?.()
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de l\'application de la remise'
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
          {/* discount button  */}
          {!discount ? (<div className="bg-white p-6 outline-none rounded-lg border-2 border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Remise Étudiante</h3>
            <input
              type="number"
              value={studentdiscount}
              onChange={(e) => setStudentdiscount(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border-2 text-lg font-semibold focus:outline-none focus:ring-2 transition-all"
              placeholder="0.00"
            />
            <button
            onClick={handlediscount}
            disabled={discount ? true : false}
            className="w-full px-4 py-3 bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Effectuer la remise
          </button>
          </div>): null}

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
            className="w-full px-4 py-3 bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

interface FacultyPriceExtended extends Faculty {
  categorie?: string
  symbol?: string
  v_1?: number
  v_2?: number
  v_3?: number
}

export function Price() {
  const [faculties, setFaculties] = useState<FacultyPriceExtended[]>([])
  const [faculty, setFaculty] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [v_1, setV_1] = useState<number>(0)
  const [v_2, setV_2] = useState<number>(0)
  const [v_3, setV_3] = useState<number>(0)
  const [categorie, setCategorie] = useState('')
  const [symbol, setSymbol] = useState('HT')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [toast, setToast] = useState<Toast | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [stats, setStats] = useState({ total: 0, with0Balance: 0, withPositiveBalance: 0 })

  useEffect(() => {
    fetchFacultiesAndStats()
  }, [])

  const fetchFacultiesAndStats = async () => {
    try {
      // Fetch faculty prices
      const { data: facultyData, error: facultyError } = await supabase
        .from('faculty_price')
        .select('*')
        .order('faculty', { ascending: true })
      
      if (facultyError) throw facultyError
      setFaculties(facultyData || [])

      // Fetch payment statistics
      const { data: paymentData, error: paymentError } = await supabase
        .from('student_payment')
        .select('balance')

      if (!paymentError && paymentData) {
        const total = paymentData.length
        const with0Balance = paymentData.filter((p: any) => parseFloat(p.balance) === 0).length
        const withPositiveBalance = paymentData.filter((p: any) => parseFloat(p.balance) > 0).length
        setStats({ total, with0Balance, withPositiveBalance })
      }
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
    if (!v_1 || v_1 < 0) newErrors.v_1 = 'Versement 1 requis'
    if (!v_2 || v_2 < 0) newErrors.v_2 = 'Versement 2 requis'
    if (!v_3 || v_3 < 0) newErrors.v_3 = 'Versement 3 requis'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const payload = {
        faculty,
        price,
        v_1,
        v_2,
        v_3,
        categorie,
        symbol
      }

      if (editingId) {
        const { error } = await supabase
          .from('faculty_price')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('faculty_price').insert([payload])
        if (error) throw error
      }

      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `${faculty} ${editingId ? 'modifiée' : 'ajoutée'} avec succès!`
      })

      resetForm()
      fetchFacultiesAndStats()
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de l\'opération'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFaculty('')
    setPrice(0)
    setV_1(0)
    setV_2(0)
    setV_3(0)
    setCategorie('')
    setSymbol('HT')
    setShowForm(false)
    setEditingId(null)
    setErrors({})
  }

  const handleEdit = (fac: FacultyPriceExtended) => {
    setFaculty(fac.faculty)
    setPrice(fac.price)
    setV_1(fac.v_1 || 0)
    setV_2(fac.v_2 || 0)
    setV_3(fac.v_3 || 0)
    setCategorie(fac.categorie || '')
    setSymbol(fac.symbol || 'HT')
    setEditingId(fac.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette faculté?')) return

    try {
      const { error } = await supabase.from('faculty_price').delete().eq('id', id)
      if (error) throw error

      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: 'Faculté supprimée avec succès!'
      })

      fetchFacultiesAndStats()
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors de la suppression'
      })
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
                  <input
                    type="text"
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Sciences appliquées"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Symbole</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="HT"
                    maxLength={3}
                  />
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Montants des Versements</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Versement 1 ({CURRENCY})</label>
                    <input
                      type="number"
                      value={v_1}
                      onChange={(e) => {
                        setV_1(parseFloat(e.target.value) || 0)
                        if (errors.v_1) setErrors({ ...errors, v_1: '' })
                      }}
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                        errors.v_1
                          ? 'border-red-500 bg-red-50 focus:ring-red-500/50'
                          : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/50'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.v_1 && <p className="text-red-600 text-sm mt-1">{errors.v_1}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Versement 2 ({CURRENCY})</label>
                    <input
                      type="number"
                      value={v_2}
                      onChange={(e) => {
                        setV_2(parseFloat(e.target.value) || 0)
                        if (errors.v_2) setErrors({ ...errors, v_2: '' })
                      }}
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                        errors.v_2
                          ? 'border-red-500 bg-red-50 focus:ring-red-500/50'
                          : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/50'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.v_2 && <p className="text-red-600 text-sm mt-1">{errors.v_2}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Versement 3 ({CURRENCY})</label>
                    <input
                      type="number"
                      value={v_3}
                      onChange={(e) => {
                        setV_3(parseFloat(e.target.value) || 0)
                        if (errors.v_3) setErrors({ ...errors, v_3: '' })
                      }}
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                        errors.v_3
                          ? 'border-red-500 bg-red-50 focus:ring-red-500/50'
                          : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/50'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.v_3 && <p className="text-red-600 text-sm mt-1">{errors.v_3}</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
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
                    editingId ? 'Modifier' : 'Ajouter'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full px-6 py-3 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Faculté</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Catégorie</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Prix</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Versement 1</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Versement 2</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Versement 3</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {faculties.map((fac, index) => (
                    <tr key={fac.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{fac.faculty}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {fac.categorie || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-lg font-bold text-blue-600">{formatCurrency(fac.price)} {fac.symbol || CURRENCY}</p>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                        {formatCurrency(fac.v_1 || 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                        {formatCurrency(fac.v_2 || 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                        {formatCurrency(fac.v_3 || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(fac)}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-all text-sm"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(fac.id)}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-all text-sm"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      $ {formatCurrency(balance)} {CURRENCY}
    </span>
  )
}

// ============ STUDENTS LIST ============
export function Student_pay() {
  // Student list state
  const [students, setStudents] = useState<User[]>([])
  const [filteredStudents, setFilteredStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [faculties, setFaculties] = useState<string[]>([])
  const [selectedFaculty, setSelectedFaculty] = useState<string>('')
  const [yearOptions, setYearOptions] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'positive' | 'zero'>('all')

  // Auxiliary data maps for quick lookup
  const [paymentData, setPaymentData] = useState<{ [key: number]: StudentPayment }>({})
  const [studentYearMap, setStudentYearMap] = useState<{ [key: number]: number }>({})
  const [facultyPriceMap, setFacultyPriceMap] = useState<{ [key: string]: any }>({})
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const fetchStudentsAndData = async () => {
      try {
        // Fetch students
        const { data: studentData, error: studentError } = await supabase
          .from('student')
          .select('last_name, first_name, id, faculty, student_code')
          .order('last_name', { ascending: true })

        if (studentError) throw studentError
        setStudents(studentData || [])

        // Extract unique faculties from the student list for the faculty filter
        const uniqueFaculties = [...new Set((studentData || []).map(s => s.faculty).filter(Boolean))]
        setFaculties(uniqueFaculties as string[])

        // Fetch student year (niveau) data for filters
        const { data: statusData, error: statusError } = await supabase
          .from('student_status')
          .select('student_id, year_study')

        if (!statusError && statusData) {
          const yearMap: { [key: number]: number } = {}
          statusData.forEach((status: any) => {
            if (status.student_id != null) {
              yearMap[status.student_id] = status.year_study || 0
            }
          })
          setStudentYearMap(yearMap)

          const uniqueYears = [...new Set(statusData.map((status: any) => status.year_study || 0))]
            .filter((year) => year !== 0)
            .sort((a, b) => a - b)
          setYearOptions(uniqueYears)
        }

        // Fetch payment data for all students
        const { data: paymentDataRes, error: paymentError } = await supabase
          .from('student_payment')
          .select('id, student_id, balance, discount, price')

        if (!paymentError && paymentDataRes) {
          const paymentMap: { [key: number]: any } = {}
          paymentDataRes.forEach((payment: any) => {
            paymentMap[payment.student_id] = payment
          })
          setPaymentData(paymentMap)
        }

        // Fetch faculty price data with versement amounts
        const { data: facultyData, error: facultyError } = await supabase
          .from('faculty_price')
          .select('faculty, price, v_1, v_2, v_3, symbol')

        if (!facultyError && facultyData) {
          const facultyMap: { [key: string]: any } = {}
          facultyData.forEach((fac: any) => {
            facultyMap[fac.faculty] = fac
          })
          setFacultyPriceMap(facultyMap)
        }
      } catch (err) {
        console.error('Error fetching students:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentsAndData()
  }, [])

  useEffect(() => {
    // Apply filters to the student list whenever filter values or source data change
    let filtered = students

    if (selectedFaculty) {
      filtered = filtered.filter(s => s.faculty === selectedFaculty)
    }

    if (selectedYear) {
      filtered = filtered.filter(s => studentYearMap[s.id] === Number(selectedYear))
    }

    if (balanceFilter === 'positive') {
      filtered = filtered.filter(s => {
        const balance = paymentData[s.id]?.balance || 0
        return toNumber(balance) > 0
      })
    } else if (balanceFilter === 'zero') {
      filtered = filtered.filter(s => {
        const balance = paymentData[s.id]?.balance || 0
        return toNumber(balance) === 0
      })
    }

    setFilteredStudents(filtered)
  }, [students, selectedFaculty, selectedYear, balanceFilter, paymentData, studentYearMap])

  // Calculate versement amounts for a student
  const calculateVersements = (student: User) => {
    const facultyPrice = facultyPriceMap[student.faculty]
    if (!facultyPrice) {
      return { 
        v1Remaining: 0, 
        v2Remaining: 0, 
        v3Remaining: 0, 
        v1Total: 0,
        v2Total: 0,
        v3Total: 0,
        netPrice: 0, 
        paid: 0,
        isPaid: false,
        isPartial: false
      }
    }

    const payment = paymentData[student.id]
    const price = toNumber(facultyPrice.price)
    const discount = toNumber(payment?.discount || 0)
    const balance = toNumber(payment?.balance || 0)
    
    const netPrice = price - discount
    const paid = netPrice - balance
    
    let v1Total = toNumber(facultyPrice.v_1)
    let v2Total = toNumber(facultyPrice.v_2)
    let v3Total = toNumber(facultyPrice.v_3)

    // Apply discount to versement amounts (v3 first, then v2, then v1)
    let remainingDiscount = discount
    
    if (remainingDiscount > 0) {
      // Subtract from v3 first
      if (remainingDiscount >= v3Total) {
        remainingDiscount -= v3Total
        v3Total = 0
        
        // If discount still remains, subtract from v2
        if (remainingDiscount > 0 && remainingDiscount >= v2Total) {
          remainingDiscount -= v2Total
          v2Total = 0
          
          // If discount still remains, subtract from v1
          if (remainingDiscount > 0) {
            v1Total = Math.max(0, v1Total - remainingDiscount)
          }
        } else if (remainingDiscount > 0) {
          v2Total -= remainingDiscount
          remainingDiscount = 0
        }
      } else {
        // Discount is less than v3, just reduce v3
        v3Total -= remainingDiscount
        remainingDiscount = 0
      }
    }

    // Calculate remaining amounts for each versement
    const isPaid = balance === 0
    const isPartial = paid > 0 && !isPaid
    
    let v1Remaining = v1Total
    let v2Remaining = v2Total
    let v3Remaining = v3Total

    if (isPartial || isPaid) {
      // Deduct from v1 first
      if (paid >= v1Total) {
        v1Remaining = 0
        const remainingAfterV1 = paid - v1Total
        
        // Then deduct from v2
        if (remainingAfterV1 >= v2Total) {
          v2Remaining = 0
          v3Remaining = Math.max(0, v3Total - (remainingAfterV1 - v2Total))
        } else {
          v2Remaining = v2Total - remainingAfterV1
        }
      } else {
        v1Remaining = v1Total - paid
      }
    }

    return { 
      v1Remaining, 
      v2Remaining, 
      v3Remaining,
      v1Total,
      v2Total,
      v3Total,
      netPrice, 
      paid,
      isPaid,
      isPartial
    }
  }

  // Helper function to get versement status color and text
  const getVersementStatus = (remaining: number, total: number) => {
    if (remaining === 0) {
      return { color: 'text-green-600', status: '✓ Payé', bgColor: 'bg-green-50' }
    } else if (remaining < total && remaining > 0) {
      return { color: 'text-amber-600', status: '◐ Partiel', bgColor: 'bg-amber-50' }
    } else {
      return { color: 'text-red-600', status: '○ Impayé', bgColor: 'bg-red-50' }
    }
  }

  // Helper function to get balance color based on amount
  const getBalanceColor = (balance: number, total: number): string => {
    if (balance === 0) return 'text-green-600'
    if (balance < total) return 'text-amber-600'
    return 'text-red-600'
  }

  // Calculate faculty summary data with versement breakdown
  const calculateFacultySummary = () => {
    const facultySummary: { [key: string]: { 
      studentCount: number
      v1Total: number
      v1Balance: number
      v2Total: number
      v2Balance: number
      v3Total: number
      v3Balance: number
      totalPrice: number
      totalPaid: number
      totalDiscount: number
    }} = {}

    // Group students by faculty and calculate totals
    filteredStudents.forEach(student => {
      const faculty = student.faculty || 'Non spécifié'
      const vers = calculateVersements(student)
      const payment = paymentData[student.id]
      const discount = toNumber(payment?.discount || 0)

      if (!facultySummary[faculty]) {
        facultySummary[faculty] = {
          studentCount: 0,
          v1Total: 0,
          v1Balance: 0,
          v2Total: 0,
          v2Balance: 0,
          v3Total: 0,
          v3Balance: 0,
          totalPrice: 0,
          totalPaid: 0,
          totalDiscount: 0
        }
      }

      facultySummary[faculty].studentCount += 1
      facultySummary[faculty].v1Total += vers.v1Total
      facultySummary[faculty].v1Balance += vers.v1Remaining
      facultySummary[faculty].v2Total += vers.v2Total
      facultySummary[faculty].v2Balance += vers.v2Remaining
      facultySummary[faculty].v3Total += vers.v3Total
      facultySummary[faculty].v3Balance += vers.v3Remaining
      facultySummary[faculty].totalPrice += vers.netPrice
      facultySummary[faculty].totalPaid += vers.paid
      facultySummary[faculty].totalDiscount += discount
    })

    return facultySummary
  }

  // Export handlers
  const handleExportCSV = async () => {
    try {
      setExporting(true)

      const rows = [
        ['Nom Étudiant', 'Faculté', 'Année', 'Total Année', 'Versement 1', 'Versement 2', 'Versement 3', 'Payé'],
        ...filteredStudents.map(student => {
          const vers = calculateVersements(student)
          return [
            `${student.last_name} ${student.first_name}`,
            student.faculty || '-',
            `Année ${studentYearMap[student.id] || '-'}`,
            formatCurrency(vers.netPrice),
            formatCurrency(vers.v1Total),
            formatCurrency(vers.v2Total),
            formatCurrency(vers.v3Total),
            formatCurrency(vers.paid)
          ]
        })
      ]

      const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `liste_paiements_${selectedFaculty || 'tous'}_${selectedYear ? `année${selectedYear}` : 'tous'}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting to CSV:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleExportJSON = async () => {
    try {
      setExporting(true)

      const data = {
        exportDate: new Date().toISOString(),
        faculty: selectedFaculty || 'Toutes facultés',
        year: selectedYear ? `Année ${selectedYear}` : 'Tous niveaux',
        totalRecords: filteredStudents.length,
        data: filteredStudents.map(student => {
          const vers = calculateVersements(student)
          return {
            nom: `${student.last_name} ${student.first_name}`,
            faculte: student.faculty,
            annee: studentYearMap[student.id] || 0,
            totalAnnee: vers.netPrice,
            versement1: vers.v1Total,
            versement2: vers.v2Total,
            versement3: vers.v3Total,
            montantPaye: vers.paid
          }
        })
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `liste_paiements_${selectedFaculty || 'tous'}_${selectedYear ? `année${selectedYear}` : 'tous'}_${new Date().toISOString().split('T')[0]}.json`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting to JSON:', error)
    } finally {
      setExporting(false)
    }
  }

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '', 'height=900,width=1200')
      if (!printWindow) return

      const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <title>Liste des Paiements</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; background: white; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0077B6; padding-bottom: 15px; }
            .header h1 { font-size: 24px; color: #0077B6; margin-bottom: 10px; }
            .filter-info { font-size: 13px; color: #666; text-align: center; margin-top: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            thead { background-color: #0077B6; color: white; }
            th { padding: 12px; text-align: left; font-weight: 600; border: 1px solid #ddd; }
            td { padding: 10px; border: 1px solid #ddd; }
            tbody tr:nth-child(odd) { background-color: #f9f9f9; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Liste des Paiements</h1>
            <div class="filter-info">
              Date: ${new Date().toLocaleDateString('fr-FR')} | 
              ${selectedFaculty ? `Faculté: ${selectedFaculty} | ` : ''}
              ${selectedYear ? `Année: ${selectedYear} | ` : ''}
              Total: ${filteredStudents.length} étudiant(s)
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nom Étudiant</th>
                <th class="text-center">Faculté</th>
                <th class="text-center">Année</th>
                <th class="text-right">Total Année</th>
                <th class="text-right">Versement 1</th>
                <th class="text-right">Versement 2</th>
                <th class="text-right">Versement 3</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStudents
                .map(student => {
                  const vers = calculateVersements(student)
                  return `
                <tr>
                  <td><strong>${student.last_name} ${student.first_name}</strong></td>
                  <td class="text-center">${student.faculty || '-'}</td>
                  <td class="text-center">Année ${studentYearMap[student.id] || '-'}</td>
                  <td class="text-right">${formatCurrency(vers.netPrice)}</td>
                  <td class="text-right">${formatCurrency(vers.v1Total)}</td>
                  <td class="text-right">${formatCurrency(vers.v2Total)}</td>
                  <td class="text-right">${formatCurrency(vers.v3Total)}</td>
                </tr>
              `
                })
                .join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Document généré le ${new Date().toLocaleString('fr-FR')}</p>
            <p>UDEI - Système de Gestion Administratif Universitaire</p>
          </div>
        </body>
        </html>
      `

      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 250)
    } catch (error) {
      console.error('Error printing:', error)
    }
  }

  // Loading state while student and filter data are being fetched
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

  // Empty state if no students exist in the database
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
        <h2 className="text-2xl font-bold text-gray-900">Liste des étudiants - Paiements</h2>
        <span className="ml-auto bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
          {filteredStudents.length} étudiant{filteredStudents.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Export Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 flex gap-3 flex-wrap">
        <button
          onClick={handleExportCSV}
          disabled={exporting || filteredStudents.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
          title="Télécharger en Excel/CSV"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {exporting ? 'Export en cours...' : 'Télécharger Excel'}
        </button>

        <button
          onClick={handleExportJSON}
          disabled={exporting || filteredStudents.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
          title="Exporter en JSON"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exporter JSON
        </button>

        <button
          onClick={handlePrint}
          disabled={filteredStudents.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
          title="Imprimer la liste"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimer
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtres
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Faculty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Faculté</label>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les facultés</option>
              {faculties.map(faculty => (
                <option key={faculty} value={faculty}>{faculty}</option>
              ))}
            </select>
          </div>

          {/* Year/Niveau Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Année / Niveau</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les niveaux</option>
              {yearOptions.map((year) => (
                <option key={year} value={String(year)}>{`Année ${year}`}</option>
              ))}
            </select>
          </div>

          {/* Balance Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Solde</label>
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value as 'all' | 'positive' | 'zero')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous</option>
              <option value="positive">Solde Positif</option>
              <option value="zero">Solde Zéro</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedFaculty('')
                setSelectedYear('')
                setBalanceFilter('all')
              }}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-all"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10a4 4 0 018 0" />
          </svg>
          <p className="text-yellow-800 font-medium">Aucun étudiant ne correspond aux filtres</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Individual Student Table */}
          <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-200">
          {/* Student table header */}
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom et Prénom</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Faculté</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Année</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Total Année</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Versement 1</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Versement 2</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Versement 3</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student, index) => {
                const vers = calculateVersements(student)
                const v1Status = getVersementStatus(vers.v1Remaining, vers.v1Total)
                const v2Status = getVersementStatus(vers.v2Remaining, vers.v2Total)
                const v3Status = getVersementStatus(vers.v3Remaining, vers.v3Total)
                
                return (
                  <tr
                    key={student.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {student.last_name} {student.first_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Code: {student.student_code}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {student.faculty || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        Année {studentYearMap[student.id] || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-gray-900">{formatCurrency(vers.netPrice)} {CURRENCY}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`${v1Status.bgColor} rounded px-2 py-1 inline-block`}>
                        <p className={`text-sm font-bold ${v1Status.color}`}>{formatCurrency(vers.v1Remaining)}</p>
                        <p className="text-xs text-gray-600">{v1Status.status}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`${v2Status.bgColor} rounded px-2 py-1 inline-block`}>
                        <p className={`text-sm font-bold ${v2Status.color}`}>{formatCurrency(vers.v2Remaining)}</p>
                        <p className="text-xs text-gray-600">{v2Status.status}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`${v3Status.bgColor} rounded px-2 py-1 inline-block`}>
                        <p className={`text-sm font-bold ${v3Status.color}`}>{formatCurrency(vers.v3Remaining)}</p>
                        <p className="text-xs text-gray-600">{v3Status.status}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/admin/payment?id=${student.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Détails
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Faculty Summary Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-x-auto border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Résumé par Faculté
            </h3>
          </div>
          
          <table className="w-full">
            <thead className="bg-linear-to-r from-blue-600 to-blue-500 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Faculté</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Effectif</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Versement 1</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Solde V1</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Versement 2</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Solde V2</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Versement 3</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Solde V3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(calculateFacultySummary()).map(([faculty, data], index) => (
                <tr key={faculty} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{faculty}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {data.studentCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-gray-900">{formatCurrency(data.v1Total)} {CURRENCY}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold ${getBalanceColor(data.v1Balance, data.v1Total)}`}>
                      {formatCurrency(data.v1Balance)} {CURRENCY}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-gray-900">{formatCurrency(data.v2Total)} {CURRENCY}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold ${getBalanceColor(data.v2Balance, data.v2Total)}`}>
                      {formatCurrency(data.v2Balance)} {CURRENCY}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-gray-900">{formatCurrency(data.v3Total)} {CURRENCY}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold ${getBalanceColor(data.v3Balance, data.v3Total)}`}>
                      {formatCurrency(data.v3Balance)} {CURRENCY}
                    </span>
                  </td>
                </tr>
              ))}
              
              {/* Grand Total Row */}
              {(() => {
                const summary = calculateFacultySummary()
                const totals = {
                  studentCount: Object.values(summary).reduce((sum, f) => sum + f.studentCount, 0),
                  v1Total: Object.values(summary).reduce((sum, f) => sum + f.v1Total, 0),
                  v1Balance: Object.values(summary).reduce((sum, f) => sum + f.v1Balance, 0),
                  v2Total: Object.values(summary).reduce((sum, f) => sum + f.v2Total, 0),
                  v2Balance: Object.values(summary).reduce((sum, f) => sum + f.v2Balance, 0),
                  v3Total: Object.values(summary).reduce((sum, f) => sum + f.v3Total, 0),
                  v3Balance: Object.values(summary).reduce((sum, f) => sum + f.v3Balance, 0),
                }

                return (
                  <tr className="bg-blue-50 border-t-2 border-blue-600">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">TOTAL GÉNÉRAL</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-bold">
                        {totals.studentCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-gray-900">{formatCurrency(totals.v1Total)} {CURRENCY}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-blue-600">{formatCurrency(totals.v1Balance)} {CURRENCY}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-gray-900">{formatCurrency(totals.v2Total)} {CURRENCY}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-blue-600">{formatCurrency(totals.v2Balance)} {CURRENCY}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-gray-900">{formatCurrency(totals.v3Total)} {CURRENCY}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-blue-600">{formatCurrency(totals.v3Balance)} {CURRENCY}</span>
                    </td>
                  </tr>
                )
              })()}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  )
}

// ============ confirmationt versement===========
export function Confirm({ id, v_1, v_2, v_3, onSuccess }: StudentIdProp) {
  const [verst_1, setVerst_1] = useState<boolean>(v_1 || false)
  const [verst_2, setVerst_2] = useState<boolean>(v_2 || false)
  const [verst_3, setVerst_3] = useState<boolean>(v_3 || false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const handleToggle = async (key: 'v_1' | 'v_2' | 'v_3', nextValue: boolean) => {
    setLoading(true)
    const prevState = { v_1: verst_1, v_2: verst_2, v_3: verst_3 }
    const nextState = {
      v_1: key === 'v_1' ? nextValue : verst_1,
      v_2: key === 'v_2' ? nextValue : verst_2,
      v_3: key === 'v_3' ? nextValue : verst_3,
    }

    setVerst_1(nextState.v_1)
    setVerst_2(nextState.v_2)
    setVerst_3(nextState.v_3)

    try {
      const { error } = await supabase
        .from('student_payment')
        .update(nextState)
        .eq('id', id)

      if (error) throw error

      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `Versement ${key.slice(-1)} mis à jour avec succès.`
      })
      onSuccess?.()
    } catch (err) {
      setVerst_1(prevState.v_1)
      setVerst_2(prevState.v_2)
      setVerst_3(prevState.v_3)
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du versement'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleItems = [
    { key: 'v_1' as const, label: 'Versement 1', value: verst_1 },
    { key: 'v_2' as const, label: 'Versement 2', value: verst_2 },
    { key: 'v_3' as const, label: 'Versement 3', value: verst_3 }
  ]

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {toggleItems.map((item) => (
          <div key={item.key} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 transition hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 mt-1">Cliquez pour basculer</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(item.key, !item.value)}
                disabled={loading}
                className={`relative inline-flex h-9 w-16 shrink-0 items-center rounded-full p-1 transition ${item.value ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-7 w-7 rounded-full bg-white shadow transform transition ${item.value ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className={`text-sm font-semibold ${item.value ? 'text-emerald-600' : 'text-rose-600'}`}>
                {item.value ? 'Complet' : 'Incomplet'}
              </span>
              {loading && (
                <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.25" />
                    <path d="M22 12a10 10 0 00-10-10" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Sauvegarde...
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
// ============ PAYMENTS HISTORY ============
export function Payments() {
  const [payments, setPayments] = useState<StudentPayment[]>([])
  const [student, setStudent] = useState<User | null | any>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<Toast | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [versement, setVersement] = useState<{ v_1: number; v_2: number; v_3: number }>({ v_1: 0, v_2: 0, v_3: 0 })

  const searchParams = useSearchParams()
  const studentId = searchParams.get('id')

  const refreshPayments = useCallback(() => {
    setReloadKey((prev) => prev + 1)
  }, [])

  useEffect(() => {
    if (!studentId) return

    const fetchPayment = async () => {
      setLoading(true)
      try {
        const { data: paymentData, error: paymentError } = await supabase
          .from('student_payment')
          .select('*')
          .eq('student_id', studentId)

          const f = paymentData?.[0]?.faculty
        const {data: versementData, error: versementError } = await supabase
        .from('faculty_price')
        .select('*')
        .eq('faculty', f);
        
        if (versementError) throw versementError
        if (versementData && versementData.length > 0) {
          const v = versementData[0]
          setVersement({ v_1: v.v_1, v_2: v.v_2, v_3: v.v_3 })
        }

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
  }, [studentId, reloadKey])

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

  if (!student && studentId) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4v2m0-4v2" />
        </svg>
        <p className="text-red-700 font-semibold">Aucun étudiant trouvé</p>
      </div>
    )
  }

  const currentPayment:any = payments[0]

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
        <div className="bg-linear-to-r from-blue-600 to-blue-500 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            <h2 className="text-2xl font-bold">
              {student?.last_name} {student?.first_name}
            </h2>
          </div>
          <p className="text-blue-100 text-sm">ID Étudiant: #{student.id}</p>
        </div>

        {/* Export Buttons */}
        {currentPayment?.payment_history && currentPayment.payment_history.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const title = `Historique Paiements - ${student?.last_name} ${student?.first_name}`
                const html = `
                  <h2>${title}</h2>
                  <div class="info">
                    <p><strong>Code:</strong> ${student?.student_code}</p>
                    <p><strong>Faculté:</strong> ${student?.faculty}</p>
                    <p><strong>Prix:</strong> ${formatCurrency(currentPayment.price)} ${CURRENCY}</p>
                    <p><strong>Remise:</strong> ${formatCurrency(toNumber(currentPayment.discount))} ${CURRENCY}</p>
                    <p><strong>Solde:</strong> ${formatCurrency(currentPayment.balance)} ${CURRENCY}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                  </div>
                  <table>
                    <thead><tr><th>Montant</th><th>Solde après</th><th>Date</th></tr></thead>
                    <tbody>
                      ${(currentPayment.payment_history || []).map((p: PaymentRecord) => `
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
                const rows = (currentPayment.payment_history || []).map((p: PaymentRecord) => [
                  `${formatCurrency(p.amount)} ${CURRENCY}`,
                  `${formatCurrency(p.balance)} ${CURRENCY}`,
                  typeof p.date === 'string' ? new Date(p.date).toLocaleDateString('fr-FR') : new Date(p.date).toLocaleDateString('fr-FR'),
                ])
                exportToCSV(headers, rows, `paiements_${student?.student_code}`)
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
              <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(currentPayment.price - (currentPayment.discount || 0))}</p>
              <p className="text-xs text-gray-500 mt-1">{CURRENCY}</p>
            </div>

            <div className="bg-white rounded-lg border-2 border-orange-200 shadow-md p-6">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Remise</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{formatCurrency(toNumber(currentPayment.discount))}</p>
              <p className="text-xs text-gray-500 mt-1">{CURRENCY}</p>
            </div>

            <div className="bg-white rounded-lg border-2 border-blue-200 shadow-md p-6">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Solde actuel</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{currentPayment.price===currentPayment.balance ? formatCurrency(currentPayment.balance-currentPayment?.discount) : formatCurrency(currentPayment.balance)}</p>
              <p className="text-xs text-gray-500 mt-1">{CURRENCY}</p>
            </div>

            <div className="bg-white rounded-lg border-2 border-gray-200 shadow-md p-6">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Faculté</p>
              <p className="text-lg font-bold text-gray-800 mt-2">{currentPayment.faculty}</p>
            </div>
          </div>
        )}

        <div className="h-25" >
        <Confirm
          id={currentPayment?.id || 0}
          v_1={currentPayment?.v_1 || false}
          v_2={currentPayment?.v_2 || false}
          v_3={currentPayment?.v_3 || false}
          onSuccess={refreshPayments}
        />
        </div>

        {/* Payment Form */}
        {currentPayment && (
          <div className="bg-white rounded-lg border-2 border-green-200 shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Effectuer un paiement
            </h3>
            <Pay
              id={currentPayment.id}
              price={currentPayment.price}
              discount={currentPayment.discount || 0}
              balance={currentPayment.balance}
              history={currentPayment.payment_history || []}
              onSuccess={refreshPayments}
              v_1={versement?.v_1}
              v_2={versement?.v_2}
              v_3={versement?.v_3}
              remise={currentPayment?.discount || 0}
            />
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

interface ScannedPayment {
  balance: number
  discount: number
  price: number
  v_1: boolean
  v_2: boolean
  v_3: boolean
}

interface ScannedStudent {
  id: number
  first_name: string
  last_name: string
  faculty: string
  photo_url?: string | null
  student_code?: string | null
}

interface ScannedVersement {
  label: string
  total: number
  paid: number
  remaining: number
  complete: boolean
}

export function QrcodeScan() {
  const [scanning, setScanning] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [student, setStudent] = useState<ScannedStudent | null>(null)
  const [payment, setPayment] = useState<ScannedPayment | null>(null)
  const [academicYear, setAcademicYear] = useState('')
  const [versements, setVersements] = useState<ScannedVersement[]>([])

  const resetScan = () => {
    setStudent(null)
    setPayment(null)
    setAcademicYear('')
    setVersements([])
    setError('')
    setScanning(true)
  }

  const loadStudent = async (rawValue: string) => {
    const scanresult = Number(rawValue.trim())
    if (!Number.isInteger(scanresult) || scanresult <= 0) {
      setError('Le QR code ne contient pas un identifiant étudiant valide.')
      return
    }

    setScanning(false)
    setLoading(true)
    setError('')

    try {
      const { data: studentData, error: studentError } = await supabase
        .from('student')
        .select('id, first_name, last_name, faculty, photo_url, student_code')
        .eq('id', scanresult)
        .single()

      if (studentError) throw studentError

      const [{ data: paymentData, error: paymentError }, { data: statusData, error: statusError }, { data: facultyData, error: facultyError }] = await Promise.all([
        supabase.from('student_payment').select('balance, discount, price, v_1, v_2, v_3').eq('student_id', scanresult).maybeSingle(),
        supabase.from('student_status').select('academic_year').eq('student_id', scanresult).order('id', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('faculty_price').select('v_1, v_2, v_3').eq('faculty', studentData.faculty).maybeSingle(),
      ])

      if (paymentError) throw paymentError
      if (statusError) throw statusError
      if (facultyError) throw facultyError
      if (!paymentData) throw new Error('Aucune information de paiement trouvée pour cet étudiant.')
      if (!facultyData) throw new Error('Aucun montant de versement trouvé pour la faculté de cet étudiant.')

      const currentPayment = {
        balance: toNumber(paymentData.balance),
        discount: toNumber(paymentData.discount),
        price: toNumber(paymentData.price),
        v_1: Boolean(paymentData.v_1),
        v_2: Boolean(paymentData.v_2),
        v_3: Boolean(paymentData.v_3),
      }
      const totals = [toNumber(facultyData?.v_1), toNumber(facultyData?.v_2), toNumber(facultyData?.v_3)]
      const discountedTotals = [...totals]
      let remainingDiscount = currentPayment.discount
      for (let index = 2; index >= 0; index -= 1) {
        const reduction = Math.min(discountedTotals[index], remainingDiscount)
        discountedTotals[index] -= reduction
        remainingDiscount -= reduction
      }

      const paid = Math.max(0, currentPayment.price - currentPayment.discount - currentPayment.balance)
      const remainingAmounts = [...discountedTotals]
      let remainingPaid = paid
      for (let index = 0; index < remainingAmounts.length; index += 1) {
        const applied = Math.min(remainingAmounts[index], remainingPaid)
        remainingAmounts[index] -= applied
        remainingPaid -= applied
      }

      setStudent(studentData)
      setPayment(currentPayment)
      setAcademicYear(statusData?.academic_year || 'Non renseignée')
      setVersements(remainingAmounts.map((remaining, index) => ({
        label: `Versement ${index + 1}`,
        total: discountedTotals[index],
        paid: discountedTotals[index] - remaining,
        remaining,
        complete: remaining <= 0,
      })))
    } catch (loadError) {
      setStudent(null)
      setPayment(null)
      setVersements([])
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les informations de paiement.')
    } finally {
      setLoading(false)
    }
  }

  const handleScan = (results: Array<{ rawValue: string }>) => {
    if (!loading && scanning && results[0]?.rawValue) void loadStudent(results[0].rawValue)
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Paiements</p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Scanner une carte étudiant</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">Scannez le QR code présent sur la carte pour consulter le dossier de paiement.</p>
          </div>
          {!scanning && <button type="button" onClick={resetScan} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">Nouveau scan</button>}
        </div>
        {scanning && <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-xl border border-slate-700 bg-black"><Scanner onScan={handleScan} onError={() => setError('Autorisez l’accès à la caméra pour scanner un QR code.')} /></div>}
        {loading && <p className="mt-5 text-center text-sm text-cyan-200">Chargement du dossier...</p>}
        {error && <p className="mt-5 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      </div>

      {student && payment && <div className="space-y-5">
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-4 ring-cyan-50">
            {student.photo_url ? <img src={student.photo_url} alt={`${student.first_name} ${student.last_name}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-3xl font-bold text-slate-300">{student.first_name[0]}{student.last_name[0]}</div>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-600">Étudiant #{student.id}</p>
            <h3 className="mt-1 truncate text-2xl font-bold text-slate-900">{student.last_name} {student.first_name}</h3>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <p><span className="font-semibold text-slate-900">Faculté:</span> {student.faculty || 'Non renseignée'}</p>
              <p><span className="font-semibold text-slate-900">Année académique:</span> {academicYear}</p>
              <p><span className="font-semibold text-slate-900">Code:</span> {student.student_code || 'Non renseigné'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {versements.map((versement) => <div key={versement.label} className={`rounded-xl border p-5 ${versement.complete ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex items-center justify-between gap-2"><h4 className="font-bold text-slate-900">{versement.label}</h4><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${versement.complete ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>{versement.complete ? 'Complet' : 'En cours'}</span></div>
            <p className="mt-5 text-2xl font-bold text-slate-900">{formatCurrency(versement.complete ? versement.total : versement.remaining)} <span className="text-sm font-semibold">{CURRENCY}</span></p>
            <p className="mt-1 text-sm text-slate-600">{versement.complete ? 'Versement payé' : `Reste à payer sur ${formatCurrency(versement.total)} ${CURRENCY}`}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80"><div className={`h-full rounded-full ${versement.complete ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${versement.total ? Math.min(100, (versement.paid / versement.total) * 100) : 100}%` }} /></div>
          </div>)}
        </div>
      </div>}
    </section>
  )
}