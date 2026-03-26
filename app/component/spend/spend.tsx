'use client'

import { supabase } from "../db";
import { useState, useEffect } from "react";
import Add_botton from "../add-buuton/add_button";
import Time from "../time/time";
import ChartProgress from "../chart components/chartComponent";

type Company = {
  id: number
  name: string
  date_time: string
  amount: number
  pay_method: string
  decribe_motive: string
}

const ROW_COLORS = [
  "bg-blue-50 hover:bg-blue-100",
  "bg-white hover:bg-gray-50"
]

export default function Spend() {
  const [expenses, setExpenses] = useState<Company[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const totalAmount = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const formattedTotal = new Intl.NumberFormat('en-US').format(totalAmount)

  useEffect(() => {
    fetchExpenses()
  }, [selectedYear])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError(null)

      const startDate = `${selectedYear}-01-01`
      const endDate = `${selectedYear}-12-31 23:59:59`

      const { data, error: fetchError } = await supabase
        .from('spent_in_company')
        .select('*')
        .gte('date_time', startDate)
        .lte('date_time', endDate)
        .order('date_time', { ascending: false })

      if (fetchError) throw fetchError

      setExpenses(data || [])
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données')
      console.error(err)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestion des Dépenses</h1>
          <p className="text-gray-600">Suivi détaillé des dépenses de l&apos;entreprise</p>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-green-500">
              <ChartProgress data={expenses} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-8 text-white flex flex-col justify-center">
            <p className="text-green-100 text-sm font-semibold mb-2">Total des Dépenses</p>
            <p className="text-4xl font-bold mb-1">HTG {formattedTotal}</p>
            <p className="text-green-100 text-sm">Année {selectedYear}</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filtrer par année
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-6">
              <Add_botton />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-8">
            <p className="text-red-700 font-semibold">Erreur</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
            <p className="text-gray-600 mt-4">Chargement des dépenses...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && expenses.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-600 text-lg">Aucune dépense trouvée pour l&apos;année {selectedYear}</p>
          </div>
        )}

        {/* Table */}
        {!loading && expenses.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nom</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Montant</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mode Paiement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map((expense, index) => (
                    <tr key={expense.id} className={`${ROW_COLORS[index % ROW_COLORS.length]} transition`}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{expense.name}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        HTG {new Intl.NumberFormat('en-US').format(Number(expense.amount))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <Time open={expense.date_time} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{expense.decribe_motive}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {expense.pay_method}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-gray-50 border-t-2 border-gray-200 px-6 py-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{expenses.length}</span> dépense{expenses.length > 1 ? 's' : ''} affichée{expenses.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                Total: <span className="text-green-600">HTG {formattedTotal}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
