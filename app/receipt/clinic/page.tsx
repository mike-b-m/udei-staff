'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/app/component/db'

interface ClinicReceipt {
  id: number
  created_at: string
  student_name: string | null
  year: number | string | null
  total_price: number | string | null
  insert_by: string | null
  discount: number | string | null
}

interface ClinicPaymentLine {
  id: number
  receipt_id: number | null
  service_name: string | null
  quantity: number | string | null
  price: number | string | null
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
  const receiptId = searchParams.get('id')
  const [receipt, setReceipt] = useState<ClinicReceipt | null>(null)
  const [lines, setLines] = useState<ClinicPaymentLine[]>([])
  const [cashier, setCashier] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    const parsedReceiptId = Number(receiptId)
    if (!receiptId || !Number.isSafeInteger(parsedReceiptId) || parsedReceiptId <= 0) {
      setReceipt(null)
      setLines([])
      setCashier(null)
      setLoading(false)
      setLoadError('Aucun identifiant de reçu valide n’a été fourni.')
      return () => { isCurrent = false }
    }

    const fetchReceipt = async () => {
      setLoading(true)
      setLoadError('')

      try {
        const { data: receiptData, error: receiptError } = await supabase
          .from('clinic_receipt')
          .select('id, created_at, student_name, year, total_price, insert_by, discount')
          .eq('id', parsedReceiptId)
          .maybeSingle()

        if (receiptError) throw receiptError
        if (!receiptData) throw new Error('Reçu clinique introuvable.')

        const [linesResult, profileResult] = await Promise.all([
          supabase
            .from('clinic_pay')
            .select('id, receipt_id, service_name, quantity, price')
            .eq('receipt_id', parsedReceiptId)
            .order('id', { ascending: true }),
          receiptData.insert_by
            ? supabase
            .from('profiles')
            .select('full_name')
                .eq('id', receiptData.insert_by)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ])

        if (linesResult.error) throw linesResult.error
        if (profileResult.error) throw profileResult.error

        if (!isCurrent) return

        setReceipt(receiptData as ClinicReceipt)
        setLines((linesResult.data ?? []) as ClinicPaymentLine[])
        setCashier(profileResult.data?.full_name ?? null)
      } catch (error) {
        if (isCurrent) {
          setReceipt(null)
          setLines([])
          setCashier(null)
          setLoadError(error instanceof Error ? error.message : 'Impossible de charger le reçu.')
        }
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    void fetchReceipt()
    return () => { isCurrent = false }
  }, [receiptId, retryKey])

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
          {receiptId && (
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

  const discount = toNumber(receipt?.discount)
  const netPrice = toNumber(receipt?.total_price)
  const subtotal = netPrice + discount

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
            <p className="text-lg font-bold text-slate-900">Reçu clinique</p>
            <p className="mt-1 text-xs text-slate-500">Reçu n° {receipt?.id}</p>
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
              <p className="text-base font-bold text-slate-900">{receipt?.student_name || 'Non renseigné'}</p>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                <dt className="text-slate-500">Année</dt>
                <dd className="font-semibold text-slate-800">{receipt?.year ? `Année ${receipt.year}` : '-'}</dd>
                <dt className="text-slate-500">Date</dt>
                <dd className="font-semibold text-slate-800">{formatDate(receipt?.created_at)}</dd>
              </dl>
            </div>

            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-blue-700">Sous-total</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)} {CURRENCY}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-blue-700">Réduction</span>
                <span className="font-semibold text-slate-900">− {formatCurrency(discount)} {CURRENCY}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-blue-200 pt-3">
                <span className="font-bold text-blue-800">Total net</span>
                <span className="text-xl font-bold text-slate-950">{formatCurrency(netPrice)} {CURRENCY}</span>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">Prestations</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {lines.length} prestation{lines.length > 1 ? 's' : ''}
              </span>
            </div>

            {lines.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[28rem] text-sm">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Prestation</th>
                      <th className="px-4 py-3 text-right font-semibold">Quantité</th>
                      <th className="px-4 py-3 text-right font-semibold">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {lines.map((line) => (
                      <tr key={line.id} className="odd:bg-white even:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{line.service_name || 'Prestation'}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{toNumber(line.quantity)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(line.price)} {CURRENCY}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
                Aucune prestation enregistrée pour ce reçu.
              </div>
            )}
          </section>

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
