'use client'

import { useEffect, useState, useCallback } from "react"
import { supabase } from "../db"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Time from "../time/time"
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
  remise: number
  student_id: number | null
  level:number| null
}

interface PaymentRecord {
  date: Date | string
  amount: number | string
  balance: number | string
  method?: string
}

const printTable = (
  data: StudentPayment,
  faculty: string | null,
  year: number | string | null | undefined,
  user: User,
  role: string | null,
  v_1: number | boolean | null,
  v_2: number | boolean | null,
  level: number | null| undefined,
) => {
  const printWindow = window.open('', '', 'height=600,width=900')
  if (!printWindow) return

  const html = `
    <html>
      <head>
        <title>${user.first_name} ${user.last_name} - ${faculty} - Année ${year} ${level} Hist-paiements </title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h2 { color: #0077B6; margin-bottom: 20px; }
          .info { 
          margin-bottom: 15px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
           font-size: 55%;
            }
           .center { 
          margin-bottom: 15px;
          display: grid;
          justify-content: center; /* Centers horizontally */
  align-items: center;
            }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 50%;
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
  .logo-section{
  width: 100%;}

  .logo{
  width: 100%;
  height: auto;
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
        <div class="logo-section">
          <img src="/image/h.png" alt="UDEI Logo" class="logo">
        </div>
        <div class="info" style="justify-content: center; align-items: center; border-bottom: 1px solid #ddd;">
        <div>#5 Village Zao, Maïs Gâté 13 (Bloc Gérald bataille) Port-au-Prince HAITI
        </div>
        <div class="text-center">+(509) 40 03 4090 / +(509) 48809772 </div>
        </div>
        <div class="info">
        <div style="font-size: 140%"><strong>Nom:</strong> ${user.last_name}</div>
        <div style="font-size: 140%"><strong>Prénom:</strong> ${user.first_name}</div>
        <div style="font-size: 100%"><strong>Code Étudiant:</strong> ${user.student_code}</div>
          <div><strong>Faculté:</strong> ${faculty}</div>
          <div><strong>Année:</strong> ${year}</div>
          <div><strong>Prix:</strong> ${formatCurrency(data?.price - data?.discount)} ${CURRENCY}</div>

          <div><strong>Balance:</strong> ${formatCurrency(data?.balance)} ${CURRENCY}</div>
          <div><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</div>
        </div>

        <div class=" info center"><strong> ${v_1 && !v_2 ? 'Versement 2' :v_2 ? 'Versement 3': 'Versement 1 '}</strong></div>
        <table>
          <thead>
            <tr>
            <td>Montant</td> 
             <td>Balance</td>
             <td>Mode de Paiement</td>
            <td>Date</td>
            </tr>
          </thead>
          <tbody>
            ${data?.payment_history?.map((payment: PaymentRecord) =>`
              <tr>
                <td> ${formatCurrency(payment.amount)} ${CURRENCY}</td>
                <td> ${formatCurrency(payment.balance)}  ${CURRENCY}</td>
                <td> ${payment.method}  </td>
                  <td>  ${new Date(payment.date).toLocaleDateString('fr-FR')}</td>
              </tr>
   `).join('')}
          </tbody>
        </table>
        <div class="info">
          <div><strong>N.B:</strong> le montant n'est pas remboursable en aucun cas </div>
          </div>
          <div class=" info text-end strong" style="justify-content: end;
           align-items: center;"> <strong>Émis par: ${role}</strong></div>
      </body> 
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  setTimeout(() => printWindow.print(), 250)
}
// ============ HELPER FUNCTIONS ============
const toNumber = (value: unknown): number => {
  const num = typeof value === "number"
    ? value
    : typeof value === "string"
      ? Number.parseFloat(value)
      : Number.NaN
  return Number.isFinite(num) ? num : 0
}

const roundCurrency = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

const adjustInstallmentTotals = (totals: number[], price: number): number[] => {
  const targetPrice = Math.max(0, roundCurrency(price))
  const adjusted = totals.map((total) => Math.max(0, roundCurrency(total)))
  let difference = roundCurrency(targetPrice - adjusted.reduce((sum, total) => sum + total, 0))

  if (difference >= 0) {
    adjusted[2] = roundCurrency(adjusted[2] + difference)
    return adjusted
  }

  difference = Math.abs(difference)
  for (let index = adjusted.length - 1; index >= 0 && difference > 0; index -= 1) {
    const reduction = Math.min(adjusted[index], difference)
    adjusted[index] = roundCurrency(adjusted[index] - reduction)
    difference = roundCurrency(difference - reduction)
  }

  return adjusted
}

const applyDiscountToInstallments = (totals: number[], discount: number): number[] => {
  const adjusted = [...totals]
  let remainingDiscount = Math.max(0, Math.min(discount, adjusted.reduce((sum, total) => sum + total, 0)))

  for (let index = adjusted.length - 1; index >= 0 && remainingDiscount > 0; index -= 1) {
    const reduction = Math.min(adjusted[index], remainingDiscount)
    adjusted[index] = roundCurrency(adjusted[index] - reduction)
    remainingDiscount = roundCurrency(remainingDiscount - reduction)
  }

  return adjusted
}

const formatCurrency = (value: unknown): string => {
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
  discount: number
  faculty?: string
  price: number
  remise?: number
  v_1?: boolean
  v_2?: boolean
  v_3?: boolean  
  level?: number | string | null
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
export default function Pay({ id,student_id, history, balance,level, discount,remise, price,v_1, v_2, onSuccess }: PaymentProps) {
  const [amount, setAmount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [toast, setToast] = useState<Toast | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [studentdiscount, setStudentdiscount] = useState<number>(0)
  const [priceIncrease, setPriceIncrease] = useState<number>(0)
  const [showPriceIncreaseConfirm, setShowPriceIncreaseConfirm] = useState(false)
  const [methode, setMethode] = useState<string>("Espèces")
  const numBalance = toNumber(balance)
  const numPrice = toNumber(price)
  const newPrice = roundCurrency(numPrice + priceIncrease)
  const remainingBalance = roundCurrency(numBalance - amount)

  const validatePayment = useCallback((): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!Number.isFinite(amount)) {
      newErrors.amount = "Le montant saisi est invalide"
    } else if (amount <= 0) {
      newErrors.amount = "Veuillez saisir un montant supérieur à 0"
    } else if (amount > numBalance) {
      newErrors.amount = "Le montant ne peut pas dépasser le solde"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [amount, numBalance])

  const handlePayment = async () => {
    if (!validatePayment()) return
    if (student_id === null) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: "Impossible d’enregistrer le paiement sans identifiant étudiant."
      })
      return
    }

    setLoading(true)
    try {
      const date = new Date()
      const newRecord: PaymentRecord = {
        date,
        amount,
        balance: remainingBalance,
        method: methode
      }

      const updatedHistory = history ? [...history, newRecord] : [newRecord]

      const { error } = await supabase
        .from('student_payment')
        .update({
          balance: remainingBalance,
          payment_history: updatedHistory,
          v_1: v_1 <= ((price-remise)-remainingBalance) ? true : false,
            v_2: v_2 +v_1 <= ((price-remise)-remainingBalance) ? true : false,
            v_3: remainingBalance === 0 ? true : false,
        })
        .eq('id', id)
      if (error) throw error

      const { error: historyError } = await supabase
        .from('payment_history')
        .insert({
          amount,
          balance: remainingBalance,
          student_id: student_id,
          level: level,
          method: methode,
        })

      if (historyError) {
        setToast({
          id: Date.now().toString(),
          type: 'error',
          message: `Le paiement a été enregistré, mais l’historique comptable n’a pas été mis à jour : ${historyError.message}`
        })
        setAmount(0)
        setShowConfirm(false)
        setErrors({})
        onSuccess?.()
        return
      }

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
    if (!Number.isFinite(studentdiscount) || studentdiscount <= 0) {
      setErrors({ discount: "La réduction doit être supérieure à 0" })
      return
    }
    if (studentdiscount > numBalance) {
      setErrors({ discount: "La réduction ne peut pas dépasser le solde actuel" })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('student_payment')
        .update({
          discount: studentdiscount,
          balance: roundCurrency(numBalance - studentdiscount)
        })
        .eq('id', id)

      if (error) throw error
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `Remise de ${studentdiscount} ${CURRENCY} appliquée avec succès!`
      })
      setStudentdiscount(0)
      setErrors({})
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

  const handlePriceIncrease = async () => {
    if (!Number.isFinite(priceIncrease) || priceIncrease <= 0 || !Number.isFinite(newPrice) || newPrice <= numPrice) {
      setErrors({ priceIncrease: "Le montant ajouté doit être supérieur à 0" })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('student_payment')
        .update({
          price: newPrice,
          balance: newPrice,
          discount: 0,
          payment_history: [],
          v_1: false,
          v_2: false,
          v_3: false,
        })
        .eq('id', id)

      if (error) throw error

      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `Prix augmenté de ${priceIncrease} ${CURRENCY} avec succès!`
      })
      setPriceIncrease(0)
      setStudentdiscount(0)
      setShowPriceIncreaseConfirm(false)
      setErrors({})
      onSuccess?.()
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de l\'augmentation du prix'
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
              value={amount || ''}
              onChange={(e) => {
                setAmount(parseFloat(e.target.value) || 0)
                if (errors.amount) setErrors({})
              }}
              required
              aria-invalid={Boolean(errors.amount)}
              min={0.01}
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
          <div>
            <h3 className="text-lg font-bold text-gray-700 mb-4">moyen de paiement </h3>
            <select
              value={methode}
              onChange={(e) => setMethode(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 text-lg font-semibold focus:outline-none focus:ring-2 transition-all 'border-gray-300 bg-white hover:border-gray-400 focus:border-green-500 focus:ring-green-500/50'"
              disabled={loading}
            >
            <option value=''>selectionne</option>
              <option value='espèces'>Espèces</option>
              <option value='carte'>virement bancaire </option>
            </select>
          </div>
          {errors.amount && (
            <p role="alert" className="text-red-600 text-sm font-medium mt-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {errors.amount}
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <h3 className="text-lg font-bold text-gray-700 mb-4">Réduction Étudiante</h3>
            <input
              type="number"
              min="0"
              max={numBalance}
              step="0.01"
              value={studentdiscount}
              onChange={(e) => {
                setStudentdiscount(Number(e.target.value) || 0)
                if (errors.discount) setErrors({})
              }}
              className="w-full px-4 py-3 rounded-lg border-2 text-lg font-semibold focus:outline-none focus:ring-2 transition-all"
              placeholder="0.00"
              disabled={loading}
            />
            {errors.discount && <p className="mt-2 text-sm font-medium text-red-600">{errors.discount}</p>}
            <button
            type="button"
            onClick={handlediscount}
            disabled={loading || discount > 0 || studentdiscount <= 0}
            className="w-full px-4 py-3 bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Effectuer la remise
          </button>
          </div>): null}

        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Ajouter au prix</h3>
          <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="price-increase">
            Montant à ajouter
          </label>
          <input
            id="price-increase"
            type="number"
            min="0"
            step="0.01"
            value={priceIncrease || ''}
            onChange={(e) => {
              setPriceIncrease(Number(e.target.value) || 0)
              if (errors.priceIncrease) setErrors({})
            }}
            className={`w-full px-4 py-3 rounded-lg border-2 text-lg font-semibold focus:outline-none focus:ring-2 transition-all ${
              errors.priceIncrease ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder="0.00"
            disabled={loading || showPriceIncreaseConfirm}
          />

          <p className="mt-2 text-sm text-gray-600">
            Prix actuel : {formatCurrency(numPrice)} {CURRENCY} · Nouveau prix : {formatCurrency(newPrice)} {CURRENCY}
          </p>
          <button
            type="button"
            onClick={() => {
              if (!Number.isFinite(priceIncrease) || priceIncrease <= 0) {
                setErrors({ priceIncrease: "Le montant ajouté doit être supérieur à 0" })
                return
              }
              setErrors({})
              setShowPriceIncreaseConfirm(true)
            }}
            disabled={loading || showPriceIncreaseConfirm || priceIncrease <= 0 || !Number.isFinite(newPrice) || newPrice <= numPrice}
            className="mt-4 w-full px-4 py-3 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ajouter au prix
          </button>
        </div>

        {showPriceIncreaseConfirm && (
          <div className="space-y-3">
            <div className="rounded border-l-4 border-amber-400 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                Confirmez l’augmentation du prix de {formatCurrency(priceIncrease)} {CURRENCY} ?
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Le solde sera réinitialisé à {formatCurrency(newPrice)} {CURRENCY}, la remise sera mise à 0, l’historique des paiements sera supprimé et les versements seront réinitialisés.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPriceIncreaseConfirm(false)}
                disabled={loading}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition-all hover:bg-gray-300 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handlePriceIncrease}
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Confirmer l’enregistrement'}
              </button>
            </div>
          </div>
        )}

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
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
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
            type="button"
            onClick={() => {
              if (!validatePayment()) return
              setShowConfirm(true)
            }}
            disabled={loading}
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

  useEffect(() => {
    fetchFaculties()
  }, [])

  const fetchFaculties = async () => {
    try {
      // Fetch faculty prices
      const { data: facultyData, error: facultyError } = await supabase
        .from('faculty_price')
        .select('*')
        .order('faculty', { ascending: true })
      
      if (facultyError) throw facultyError
      setFaculties(facultyData || [])

    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors du chargement des facultés'
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}
    if (!faculty.trim()) newErrors.faculty = 'Le nom de la faculté est requis'
    if (!Number.isFinite(price) || price <= 0) newErrors.price = 'Le prix doit être supérieur à 0'
    if (!Number.isFinite(v_1) || v_1 < 0) newErrors.v_1 = 'Le versement 1 ne peut pas être négatif'
    if (!Number.isFinite(v_2) || v_2 < 0) newErrors.v_2 = 'Le versement 2 ne peut pas être négatif'
    if (!Number.isFinite(v_3) || v_3 < 0) newErrors.v_3 = 'Le versement 3 ne peut pas être négatif'
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
      await fetchFaculties()
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

      await fetchFaculties()
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la suppression'
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

      <div className="space-y-5 sm:space-y-6 p-3 sm:p-6">
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
            <p className="text-sm text-gray-500">Cliquez sur &quot;Ajouter une faculté&quot; pour commencer</p>
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
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let isCurrent = true
    setLoading(true)
    setBalance(null)
    setErrorMessage("")

    const fetchBalance = async () => {
      try {
        const { data, error } = await supabase
          .from('student_payment')
          .select('balance')
          .eq('student_id', id)
          .single()

        if (error) throw error
        if (isCurrent) setBalance(toNumber(data?.balance))
      } catch (err) {
        console.error('Error fetching balance:', err)
        if (isCurrent) {
          setBalance(null)
          setErrorMessage(err instanceof Error ? err.message : 'Impossible de charger le solde.')
        }
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    void fetchBalance()
    return () => {
      isCurrent = false
    }
  }, [id])

  if (loading) {
    return <span className="text-gray-500 text-sm">Chargement...</span>
  }
  if (errorMessage || balance === null) {
    return <span role="alert" className="text-sm text-red-600">{errorMessage || 'Solde indisponible.'}</span>
  }

  return (
    <span className={`font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
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
  const [dataLoadError, setDataLoadError] = useState("")

  // Filter state
  const [faculties, setFaculties] = useState<string[]>([])
  const [selectedFaculty, setSelectedFaculty] = useState<string>('')
  const [yearOptions, setYearOptions] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'positive' | 'zero'>('all')

  // Auxiliary data maps for quick lookup
  const [paymentData, setPaymentData] = useState<{ [key: number]: StudentPayment }>({})
  const [studentYearMap, setStudentYearMap] = useState<{ [key: number]: number }>({})
  const [facultyPriceMap, setFacultyPriceMap] = useState<Record<string, FacultyPriceExtended>>({})
  const [exporting, setExporting] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [studentActiveMap, setStudentActiveMap] = useState<Record<number, boolean>>({})
const [statusView, setStatusView] = useState<'active' | 'inactive' | 'all'>('active')

// A student with no status row is treated as active
const isStudentActive = (id: number) => studentActiveMap[id] !== false
  const normalizeText = (value: string | null | undefined) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLocaleLowerCase()
    .trim()

  useEffect(() => {
    let isCurrent = true

    const fetchStudentsAndData = async () => {
      try {
        // Fetch students
        const { data: studentData, error: studentError } = await supabase
          .from('student')
          .select('last_name, first_name, id, faculty, student_code')
          .order('last_name', { ascending: true })

        if (studentError) throw studentError

        // Fetch student year (niveau) data for filters
        const { data: statusData, error: statusError } = await supabase
          .from('student_status')
          .select('id, student_id, year_study, is_active')
          .order('id', { ascending: false })
        if (statusError) throw statusError

        // Fetch payment data for all students
        const { data: paymentDataRes, error: paymentError } = await supabase
          .from('student_payment')
          .select('id, student_id, balance, discount, price')
          .order('id', { ascending: false })
        if (paymentError) throw paymentError

        // Fetch faculty price data with versement amounts
        const { data: facultyData, error: facultyError } = await supabase
          .from('faculty_price')
          .select('id, faculty, price, v_1, v_2, v_3, symbol')
        if (facultyError) throw facultyError

        if (!isCurrent) return

        const studentsList = studentData ?? []
        setStudents(studentsList)
        setFaculties([...new Set(studentsList.map((student) => student.faculty).filter((faculty): faculty is string => Boolean(faculty)))])

        const yearMap: Record<number, number> = {}
const activeMap: Record<number, boolean> = {}
for (const status of statusData ?? []) {
  const sid = status.student_id
  if (sid === null) continue
  const active = Boolean(status.is_active)
  // keep the latest row, but an active row always wins over an inactive one
  if (activeMap[sid] === undefined || (active && !activeMap[sid])) {
    activeMap[sid] = active
    yearMap[sid] = toNumber(status.year_study)
  }
}
setStudentActiveMap(activeMap)
setStudentYearMap(yearMap)
setYearOptions([...new Set(Object.values(yearMap).filter((year) => year > 0))].sort((a, b) => a - b))

        const paymentMap: Record<number, StudentPayment> = {}
        for (const payment of paymentDataRes ?? []) {
          if (paymentMap[payment.student_id] === undefined) {
            paymentMap[payment.student_id] = payment
          }
        }
        setPaymentData(paymentMap)

        const facultyMap: Record<string, FacultyPriceExtended> = {}
        for (const faculty of facultyData ?? []) {
          facultyMap[faculty.faculty] = faculty
        }
        setFacultyPriceMap(facultyMap)
        setDataLoadError("")
      } catch (err) {
        if (isCurrent) {
          setDataLoadError(err instanceof Error ? err.message : 'Impossible de charger les données des paiements.')
        }
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    void fetchStudentsAndData()
    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    // Apply filters to the student list whenever filter values or source data change
    let filtered = students
    if (statusView === 'active') {
  filtered = filtered.filter(s => isStudentActive(s.id))
} else if (statusView === 'inactive') {
  filtered = filtered.filter(s => !isStudentActive(s.id))
}

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
        const payment = paymentData[s.id]
        return payment !== undefined && toNumber(payment.balance) === 0
      })
    }

    const searchTerms = normalizeText(searchName).split(/\s+/).filter(Boolean)
if (searchTerms.length > 0) {
  filtered = filtered.filter((student) => {
    const haystack = normalizeText(
      `${student.last_name} ${student.first_name} ${student.student_code ?? ''}`
    )
    // every typed word must appear somewhere in the name (any order)
    return searchTerms.every((term) => haystack.includes(term))
  })
}

    setFilteredStudents(filtered)
  }, [students, selectedFaculty, selectedYear, balanceFilter, paymentData, studentYearMap, searchName])

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
    const price = Math.max(0, toNumber(payment?.price ?? facultyPrice.price))
    const discount = Math.max(0, Math.min(price, toNumber(payment?.discount)))
    const netPrice = price - discount
    const balance = payment ? Math.max(0, toNumber(payment.balance)) : netPrice
    const paid = Math.max(0, netPrice - balance)
    
    const installmentTotals = applyDiscountToInstallments(adjustInstallmentTotals(
      [toNumber(facultyPrice.v_1), toNumber(facultyPrice.v_2), toNumber(facultyPrice.v_3)],
      price
    ), discount)

    const [v1Total, v2Total, v3Total] = installmentTotals
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
  // Print and exports only include active students
const exportStudents = filteredStudents.filter(s => isStudentActive(s.id))
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

    const logoUrl = `${window.location.origin}/image/h.png`

    const rowsHtml = exportStudents
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
      .join('')

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Liste des Paiements</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; background: white; }
          .logo-section { width: 100%; }
          .logo { width: 100%; height: auto; }
          .info { margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 10px; font-size: 55%; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 15px; }
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
        <div class="logo-section">
          <img src="${logoUrl}" alt="UDEI Logo" class="logo">
        </div>
        <div class="info" style="justify-content: center; align-items: center; border-bottom: 1px solid #ddd;">
          <div>#5 Village Zao, Maïs Gâté 13 (Bloc Gérald bataille) Port-au-Prince HAITI</div>
          <div class="text-center">+(509) 40 03 4090 / +(509) 48809772</div>
        </div>

        <div class="header">
          <h1>Liste des Paiements</h1>
          <div class="filter-info">
            Date: ${new Date().toLocaleDateString('fr-FR')} |
            Statut: Actifs |
            ${selectedFaculty ? `Faculté: ${selectedFaculty} | ` : ''}
            ${selectedYear ? `Année: ${selectedYear} | ` : ''}
            Total: ${exportStudents.length} étudiant(s)
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
            ${rowsHtml}
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

    const img = printWindow.document.querySelector('img')
    const doPrint = () => printWindow.print()
    if (img && !img.complete) {
      img.onload = doPrint
      img.onerror = doPrint
    } else {
      setTimeout(doPrint, 250)
    }
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

  if (dataLoadError) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
        Impossible de charger les paiements des étudiants : {dataLoadError}
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

      {/* Search name*/}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Recherche
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou code..."
            aria-label="Rechercher un étudiant par son nom ou prénom"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full sm:flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setSearchName('')}
            disabled={!searchName}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-all disabled:opacity-50"
          >
            Effacer la recherche
          </button>
        </div>

        {searchName.trim() && (
          <p className="text-sm text-gray-600" role="status">
            {filteredStudents.length} étudiant{filteredStudents.length > 1 ? 's' : ''} trouvé{filteredStudents.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

        { /* Filter Controls */}

      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtres
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-wrap items-center gap-2">
  <span className="text-sm font-medium text-gray-700">Statut :</span>
  {([
    ['active', 'Actifs'],
    ['inactive', 'Inactifs'], 
    ['all', 'Tous'],
  ] as const).map(([value, label]) => (
    <button
      key={value}
      type="button"
      onClick={() => setStatusView(value)}
      className={`px-4 py-2 rounded-lg font-medium transition-all ${
        statusView === value
          ? value === 'inactive'
            ? 'bg-red-600 text-white'
            : 'bg-blue-600 text-white'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
      }`}
    >
      {label}
    </button>
  ))}
</div>
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
          <p className="text-yellow-800 font-medium">
            {searchName.trim()
              ? 'Aucun étudiant ne correspond à cette recherche'
              : 'Aucun étudiant ne correspond aux filtres'}
          </p>
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

  useEffect(() => {
    setVerst_1(v_1 || false)
    setVerst_2(v_2 || false)
    setVerst_3(v_3 || false)
  }, [id, v_1, v_2, v_3])

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
  const [student, setStudent] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [showLevelModal, setShowLevelModal] = useState(false)
  const [levelDraft, setLevelDraft] = useState("")
  const [levelSaving, setLevelSaving] = useState(false)
  const [levelError, setLevelError] = useState("")
  const [levelToast, setLevelToast] = useState<Toast | null>(null)
  const [versement, setVersement] = useState<{ v_1: number; v_2: number }>({ v_1: 0, v_2: 0 })
  const [role,setRole] = useState<string | null>(null)
  const [level, setLevel] = useState<number | null>(null)
  const searchParams = useSearchParams()
  const studentId = searchParams.get('id')

  const refreshPayments = useCallback(() => {
    setReloadKey((prev) => prev + 1)
  }, [])

  const handleLevelSave = async () => {
    const nextLevel = Number(levelDraft)
    if (!Number.isInteger(nextLevel) || nextLevel < 1) {
      setLevelError("L’année doit être un nombre entier supérieur à 0.")
      return
    }
    if (!currentPayment) return

    setLevelSaving(true)
    setLevelError("")
    try {
      const { error } = await supabase
        .from('student_payment')
        .update({ level: nextLevel })
        .eq('id', currentPayment.id)

      if (error) throw error

      setShowLevelModal(false)
      setLevelToast({
        id: Date.now().toString(),
        type: 'success',
        message: "L’année d’étude a été mise à jour avec succès."
      })
      refreshPayments()
    } catch (err) {
      setLevelError(err instanceof Error ? err.message : "Erreur lors de la mise à jour de l’année.")
    } finally {
      setLevelSaving(false)
    }
  }

  useEffect(() => {
    let isCurrent = true
    if (!studentId) {
      setStudent(null)
      setPayments([])
      setLoading(false)
      setLoadError("Aucun identifiant étudiant n’a été fourni.")
      return () => {
        isCurrent = false
      }
    }

    const fetchPayment = async () => {
      setLoading(true)
      setLoadError("")
      try {
        const [paymentResult, studentResult] = await Promise.all([
          supabase
            .from('student_payment')
            .select('*')
            .eq('student_id', studentId)
            .order('id', { ascending: false }),
          supabase
            .from('student')
            .select('last_name, first_name, id, faculty, student_code')
            .eq('id', studentId)
            .single(),
        ])
        const { data: paymentData, error: paymentError } = paymentResult
        const { data: studentData, error: studentError } = studentResult
        if (paymentError) throw paymentError
        if (studentError) throw studentError

        const currentPayment = paymentData?.[0]
        const [versementResult, statusResult, userResult] = await Promise.all([
          currentPayment?.faculty
            ? supabase.from('faculty_price').select('v_1, v_2').eq('faculty', currentPayment.faculty).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          supabase
            .from('student_status')
            .select('year_study')
            .eq('student_id', studentId)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.auth.getUser(),
        ])

        if (versementResult.error) throw versementResult.error
        if (statusResult.error) throw statusResult.error
        if (userResult.error) throw userResult.error
        let cashierName: string | null = null
        if (userResult.data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userResult.data.user.id)
            .maybeSingle()
          if (profileError) throw profileError
          cashierName = profile?.full_name ?? null
        }

        if (!isCurrent) return
        setPayments(paymentData ?? [])
        setStudent(studentData)
        setLevel(statusResult.data?.year_study ?? null)
        setVersement({
          v_1: toNumber(versementResult.data?.v_1),
          v_2: toNumber(versementResult.data?.v_2),
        })
        setRole(cashierName)
      } catch (err) {
        if (isCurrent) {
          setStudent(null)
          setPayments([])
          setLoadError(err instanceof Error ? err.message : 'Erreur lors du chargement des informations.')
        }
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    void fetchPayment()
    return () => {
      isCurrent = false
    }
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

  if (!student) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4v2m0-4v2" />
        </svg>
        <p className="text-red-700 font-semibold">{loadError || 'Aucun étudiant trouvé.'}</p>
      </div>
    )
  }

  const currentPayment = payments[0]

  return (
      <>
      {levelToast && (
        <Toast
          type={levelToast.type}
          message={levelToast.message}
          onClose={() => setLevelToast(null)}
        />
      )}
      <div className="space-y-6 p-6">
        {/* Student Info */}
        <div className="bg-linear-to-r from-blue-600 to-blue-500 rounded-lg shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-start gap-3 mb-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            <h2 className="text-xl sm:text-2xl font-bold break-words">
              {student?.last_name} {student?.first_name}
            </h2>
          </div>
          <p className="text-blue-100 text-sm">ID Étudiant: #{student.id}</p>
          <p className="text-blue-100 text-sm">Code Étudiant: #{student.student_code}</p>
          <p className="text-blue-100 text-sm">Année: {level ?? 'Non renseignée'}</p>
        </div>

        {/* Export Buttons */}
        {currentPayment?.payment_history && currentPayment.payment_history.length > 0 && (
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:flex gap-2">
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
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-medium"
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
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
              Excel
            </button>
            <button
              onClick={() => {
                printTable(currentPayment, student.faculty, currentPayment.level, student, role, currentPayment.v_1 ?? null, currentPayment.v_2 ?? null, level)
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Imprimer
            </button>
          </div>
        )}

      {/* Payment Info Cards */}
        {currentPayment && (
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg border-2 border-green-200 shadow-md p-4 sm:p-6">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Prix/An</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{formatCurrency(currentPayment.price - (currentPayment.discount || 0))}</p>
              <p className="text-xs text-gray-500 mt-1">{CURRENCY}</p>
            </div>

            {/* <div className="bg-white rounded-lg border-2 border-orange-200 shadow-md p-4 sm:p-6">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Réduction</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600 mt-2">{formatCurrency(toNumber(currentPayment.discount))}</p>
              <p className="text-xs text-gray-500 mt-1">{CURRENCY}</p>
            </div> */}

            <div className="bg-white rounded-lg border-2 border-blue-200 shadow-md p-4 sm:p-6">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Solde actuel</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">{currentPayment.price===currentPayment.balance ? formatCurrency(currentPayment.balance-currentPayment?.discount) : formatCurrency(currentPayment.balance)}</p>
              <p className="text-xs text-gray-500 mt-1">{CURRENCY}</p>
            </div>

            <div className="bg-white rounded-lg border-2 border-gray-200 shadow-md p-4 sm:p-6">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Faculté</p>
              <p className="text-lg font-bold text-gray-800 mt-2">{currentPayment.faculty}</p>
            </div>

            <div className="bg-white rounded-lg border-2 border-gray-200 shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Année</p>
                <button
                  type="button"
                  aria-label="Modifier l’année d’étude"
                  title="Modifier l’année d’étude"
                  onClick={() => {
                    setLevelDraft(currentPayment.level === null ? "" : String(currentPayment.level))
                    setLevelError("")
                    setShowLevelModal(true)
                  }}
                  className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m16.862 4.487 2.651 2.651M7 17l4.5-.9L19.5 8.1a1.875 1.875 0 0 0-2.652-2.652L8.85 13.45 7 17Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                  </svg>
                </button>
              </div>
              <p className="text-lg font-bold text-gray-800 mt-2">{currentPayment.level ?? 'Non renseignée'}</p>
            </div>
          </div>
        )}

        {showLevelModal && currentPayment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !levelSaving) setShowLevelModal(false)
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="level-modal-title"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h2 id="level-modal-title" className="text-xl font-bold text-gray-900">
                Modifier l’année d’étude
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Confirmez la modification de l’année d’étude de {currentPayment.level ?? 'Non renseignée'} à {levelDraft || '—'}.
              </p>
              <label htmlFor="payment-level" className="mt-5 block text-sm font-semibold text-gray-700">
                Nouvelle année
              </label>
              <input
                id="payment-level"
                type="number"
                min="1"
                step="1"
                value={levelDraft}
                onChange={(event) => {
                  setLevelDraft(event.target.value)
                  setLevelError("")
                }}
                disabled={levelSaving}
                className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-gray-100"
              />
              {levelError && (
                <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {levelError}
                </p>
              )}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowLevelModal(false)}
                  disabled={levelSaving}
                  className="rounded-lg bg-gray-100 px-4 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleLevelSave}
                  disabled={levelSaving || !levelDraft}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {levelSaving ? 'Enregistrement...' : 'Confirmer et enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {currentPayment ? (
          <div className="h-25">
            <Confirm
              id={currentPayment.id}
              v_1={currentPayment.v_1 || false}
              v_2={currentPayment.v_2 || false}
              v_3={currentPayment.v_3 || false}
              onSuccess={refreshPayments}
            />
          </div>
        ) : (
          <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            Aucune information de paiement n’est enregistrée pour cet étudiant.
          </p>
        )}

        {/* Payment Form */}
        {currentPayment && (
          <div className="bg-white rounded-lg border-2 border-green-200 shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Effectuer un paiement
            </h3>
            <Pay
              id={currentPayment.id}
              student_id={Number(studentId)}
              price={currentPayment.price}
              discount={currentPayment.discount || 0}
              balance={currentPayment.balance}
              history={currentPayment.payment_history || []}
              onSuccess={refreshPayments}
              v_1={versement?.v_1}
              v_2={versement?.v_2}
              remise={currentPayment?.discount || 0}
              level={Number(currentPayment?.level)}
            />
          </div>
        )}

        {/* Payment History */}
        {currentPayment?.payment_history && currentPayment.payment_history.length > 0 && (
          <div className="bg-white rounded-lg border-2 border-gray-200 shadow-md overflow-hidden">
            <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Historique des paiements ({currentPayment.payment_history.length})
              </h3>
            </div>

            <div className="divide-y divide-gray-200">
              {currentPayment.payment_history.map((payment: PaymentRecord, index: number) => (
                <div key={index} className={`px-4 sm:px-6 py-4 grid grid-cols-1 min-[420px]:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center ${ROW_COLORS[index % ROW_COLORS.length]}`}>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Montant</p>
                    <p className="text-lg font-bold text-amber-600">{formatCurrency(payment.amount)} {CURRENCY}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Solde après</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(payment.balance)} {CURRENCY}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">moyen de paiement</p>
                    <p className="text-sm font-semibold text-gray-800">{payment.method || '—'}</p>
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

        {currentPayment && (!currentPayment.payment_history || currentPayment.payment_history.length === 0) && (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m0 0V5m0 0l-4 4m4-4l4 4" />
            </svg>
            <p className="text-gray-600 font-medium">Aucune transaction</p>
            <p className="text-sm text-gray-500">Les paiements s’afficheront ici</p>
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
  first_name: string | null
  last_name: string | null
  faculty: string | null
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
        supabase.from('student_payment').select('balance, discount, price, v_1, v_2, v_3').eq('student_id', scanresult).order('id', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('student_status').select('academic_year').eq('student_id', scanresult).order('id', { ascending: false }).limit(1).maybeSingle(),
        studentData.faculty
          ? supabase.from('faculty_price').select('v_1, v_2, v_3').eq('faculty', studentData.faculty).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ])

      if (paymentError) throw paymentError
      if (statusError) throw statusError
      if (facultyError) throw facultyError
      if (!paymentData) throw new Error('Aucune information de paiement trouvée pour cet étudiant.')
      if (!facultyData) throw new Error('Aucun montant de versement trouvé pour la faculté de cet étudiant.')

      const currentPayment = {
        balance: Math.max(0, toNumber(paymentData.balance)),
        discount: Math.max(0, Math.min(toNumber(paymentData.price), toNumber(paymentData.discount))),
        price: Math.max(0, toNumber(paymentData.price)),
        v_1: Boolean(paymentData.v_1),
        v_2: Boolean(paymentData.v_2),
        v_3: Boolean(paymentData.v_3),
      }
      const totals = adjustInstallmentTotals(
        [toNumber(facultyData.v_1), toNumber(facultyData.v_2), toNumber(facultyData.v_3)],
        currentPayment.price
      )
      const discountedTotals = applyDiscountToInstallments(totals, currentPayment.discount)

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
            {student.photo_url ? <img src={student.photo_url} alt={`${student.first_name ?? ''} ${student.last_name ?? ''}`.trim()} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-3xl font-bold text-slate-300">{student.first_name?.[0] ?? '?'}{student.last_name?.[0] ?? ''}</div>}
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