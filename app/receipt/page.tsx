'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/app/component/db'

interface PaymentRecord {
  date?: Date | string
  created_at?: Date | string
  amount: number | string
  balance: number | string
  method?: string
  insert_by?: string | null
}

interface StudentPayment {
  id: number
  student_id: number | null
  payment_history?: PaymentRecord[] | null
  balance: number | null
  discount: number | null
  faculty?: string | null
  price: number | null
  level?: number | string | null
  v_1?: boolean | null
  v_2?: boolean | null
  v_3?: boolean | null
}

interface StudentInfo {
  id: number
  last_name: string | null
  first_name: string | null
  faculty: string | null
  student_code: string | null
}

interface StatusRow {
  year_study: number | string | null
}

const CURRENCY = 'HT'

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const formatCurrency = (value: unknown) =>
  toNumber(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const formatDate = (value: unknown) => {
  if (!value) return '-'
  const date = new Date(value as string)
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ReceiptContent() {
  const searchParams = useSearchParams()
  const studentId = searchParams.get('id')
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [payment, setPayment] = useState<StudentPayment | null>(null)
  const [history, setHistory] = useState<PaymentRecord[]>([])
  const [year, setYear] = useState<number | string | null>(null)
  const [cashier, setCashier] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    if (!studentId) {
      setStudent(null)
      setPayment(null)
      setHistory([])
      setLoading(false)
      setLoadError('Aucun identifiant étudiant n’a été fourni.')
      return () => { isCurrent = false }
    }

    const fetchReceipt = async () => {
      setLoading(true)
      setLoadError('')

      try {
        const [
          paymentResult,
          studentResult,
          statusResult,
          historyResult,
          userResult,
        ] = await Promise.all([
          supabase
            .from('student_payment')
            .select('id, student_id, payment_history, balance, discount, faculty, price, level, v_1, v_2, v_3')
            .eq('student_id', studentId)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('student')
            .select('id, last_name, first_name, faculty, student_code')
            .eq('id', studentId)
            .maybeSingle(),
          supabase
            .from('student_status')
            .select('year_study')
            .eq('student_id', studentId)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('payment_history')
            .select('created_at, amount, balance, method, insert_by')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false }),
          supabase.auth.getUser(),
        ])

        if (paymentResult.error) throw paymentResult.error
        if (studentResult.error) throw studentResult.error
        if (statusResult.error) throw statusResult.error
        if (historyResult.error) throw historyResult.error
        if (userResult.error) throw userResult.error
        if (!studentResult.data) throw new Error('Étudiant introuvable.')

        

        if (!isCurrent) return

        const currentPayment = paymentResult.data as StudentPayment | null
        const jsonHistory = currentPayment?.payment_history ?? []
        const tableHistory = (historyResult.data ?? []) as PaymentRecord[]
        setHistory(jsonHistory.length > 0 ? jsonHistory : tableHistory)
        setStudent(studentResult.data as StudentInfo)
        setPayment(currentPayment)
        setYear((statusResult.data as StatusRow | null)?.year_study ?? currentPayment?.level ?? null)
        
      } catch (error) {
        if (isCurrent) {
          setStudent(null)
          setPayment(null)
          setHistory([])
          setLoadError(error instanceof Error ? error.message : 'Impossible de charger le reçu.')
        }
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    void fetchReceipt()
    return () => { isCurrent = false }
  }, [studentId, retryKey])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10" role="status">
          <div className="mx-auto h-16 w-16 rounded-full bg-slate-200" />
          <div className="mx-auto mt-5 h-5 w-48 rounded bg-slate-200" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="h-28 rounded-xl bg-slate-100" />
            <div className="h-28 rounded-xl bg-slate-100" />
          </div>
          <div className="mt-6 h-52 rounded-xl bg-slate-100" />
        </div>
      </main>
    )
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <section role="alert" className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-700">!</div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Impossible de charger le reçu</h1>
          <p className="mt-2 text-sm text-slate-600">{loadError}</p>
          {studentId && (
            <button
              type="button"
              onClick={() => setRetryKey((key) => key + 1)}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Réessayer
            </button>
          )}
        </section>
      </main>
    )
  }

  const price = toNumber(payment?.price)
  const discount = Math.min(price, toNumber(payment?.discount))
  const netPrice = price - discount
  const balance = toNumber(payment?.balance)
  const paid = Math.max(0, netPrice - balance)
  const totalPaid = history.reduce((sum, record) => sum + toNumber(record.amount), 0)

  let versement = 'Versement 1'
  if (payment?.v_2) versement = 'Versement 3'
  else if (payment?.v_1) versement = 'Versement 2'

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 sm:px-6 sm:py-8 print:bg-white print:p-0">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl print:max-w-none print:border-0 print:shadow-none">
        <header className="flex flex-col items-center border-b border-slate-200 px-5 py-6 text-center sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left print:flex-row">
          <Image
            src="/image/h.png"
            alt="UDEI"
            width={180}
            height={80}
            priority
            className="h-16 w-auto object-contain sm:h-20"
          />
          <div className="mt-4 sm:mt-0">
            <p className="text-lg font-bold text-slate-900">Reçu de paiement</p>
            <p className="mt-1 text-xs text-slate-500">{versement}</p>
          </div>
        </header>

        <div className="border-b border-dashed border-slate-300 px-5 py-4 text-center text-xs leading-5 text-slate-600 sm:px-8">
          <p>#5 Village Zao, Maïs Gâté 13 (Bloc Gérald Bataille), Port-au-Prince, Haïti</p>
          <p>+(509) 40 03 4090 / +(509) 48 80 9772</p>
        </div>

        <div className="px-5 py-6 sm:px-8">
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Étudiant</p>
              <p className="text-base font-bold text-slate-900">
                {student?.last_name} {student?.first_name}
              </p>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                <dt className="text-slate-500">Code</dt>
                <dd className="font-semibold text-slate-800">{student?.student_code || '-'}</dd>
                <dt className="text-slate-500">Faculté</dt>
                <dd className="font-semibold text-slate-800">{student?.faculty || '-'}</dd>
                <dt className="text-slate-500">Année</dt>
                <dd className="font-semibold text-slate-800">{year ? `Année ${year}` : '-'}</dd>
              </dl>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-2 sm:content-start">
              <div>
                <p className="text-xs text-blue-700">Prix net</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(netPrice)} {CURRENCY}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700">Payé</p>
                <p className="mt-1 text-lg font-bold text-emerald-700">{formatCurrency(paid)} {CURRENCY}</p>
              </div>
              <div className="sm:col-span-2 border-t border-blue-200 pt-3">
                <p className="text-xs text-blue-700">Solde restant</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{formatCurrency(balance)} {CURRENCY}</p>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">Historique des paiements</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {history.length} paiement{history.length > 1 ? 's' : ''}
              </span>
            </div>

            {history.length > 0 ? (
              <>
                <div className="hidden overflow-hidden rounded-xl border border-slate-200 sm:block">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Mode</th>
                        <th className="px-4 py-3 text-right font-semibold">Montant</th>
                        <th className="px-4 py-3 text-right font-semibold">Solde</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {history.map((record, index) => (
                        <tr key={`${record.date ?? record.created_at}-${index}`} className="odd:bg-white even:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600">{formatDate(record.date ?? record.created_at)}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{record.method || 'Espèces'}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(record.amount)} {CURRENCY}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(record.balance)} {CURRENCY}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 sm:hidden">
                  {history.map((record, index) => (
                    <div key={`${record.date ?? record.created_at}-${index}`} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-500">{formatDate(record.date ?? record.created_at)}</p>
                          <p className="mt-1 font-semibold text-slate-800">{record.method || 'Espèces'}</p>
                        </div>
                        <p className="text-right text-base font-bold text-emerald-700">
                          {formatCurrency(record.amount)} {CURRENCY}
                        </p>
                      </div>
                      <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                        Solde: <strong className="text-slate-900">{formatCurrency(record.balance)} {CURRENCY}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
                Aucun paiement enregistré pour cet étudiant.
              </div>
            )}
          </section>

          {history.length > 0 && (
            <div className="mt-5 flex justify-end">
              <div className="w-full rounded-xl bg-slate-900 px-5 py-4 text-white sm:w-72">
                <p className="flex justify-between text-sm">
                  <span className="text-slate-300">Total payé</span>
                  <strong>{formatCurrency(totalPaid)} {CURRENCY}</strong>
                </p>
              </div>
            </div>
          )}

          <footer className="mt-8 border-t border-dashed border-slate-300 pt-5 text-xs text-slate-500">
            <p>N.B. : le montant payé n’est pas remboursable en aucun cas.</p>
            <p className="mt-2 text-right font-semibold text-slate-700">Émis par : {cashier || '-'}</p>
          </footer>
        </div>
      </article>

      <div className="mx-auto mt-4 flex max-w-4xl justify-end gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 sm:w-auto"
        >
          Imprimer le reçu
        </button>
      </div>
    </main>
  )
}

export default function ReceiptPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 px-4 py-8">
          <div className="mx-auto max-w-4xl animate-pulse rounded-2xl border border-slate-200 bg-white p-10">
            <div className="mx-auto h-16 w-16 rounded-full bg-slate-200" />
            <div className="mx-auto mt-5 h-5 w-48 rounded bg-slate-200" />
          </div>
        </main>
      }
    >
      <ReceiptContent />
    </Suspense>
  )
}
