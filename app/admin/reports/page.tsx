'use client'
import { supabase } from "@/app/component/db"
import { useState, useEffect } from "react"
import { FACULTIES } from "@/app/component/student-infos/constants"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface FacultyStats {
  faculty: string
  students: number
  paid: number
  unpaid: number
  revenue: number
}

export default function ReportsPage() {
  const [facultyStats, setFacultyStats] = useState<FacultyStats[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalSpend, setTotalSpend] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeChart, setActiveChart] = useState<'enrollment' | 'revenue' | 'balance'>('enrollment')

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    setLoading(true)
    const [studentsRes, paymentsRes, spendRes] = await Promise.all([
      supabase.from('student').select('id, faculty'),
      supabase.from('student_payment').select('student_id, amount, payment_history'),
      supabase.from('spent_in_company').select('amount'),
    ])

    const students = studentsRes.data || []
    const payments = paymentsRes.data || []
    const spends = spendRes.data || []

    setTotalStudents(students.length)

    const totalRev = payments.reduce((sum, p) => sum + (Number(p.payment_history?.amount) || 0), 0)
    setTotalRevenue(totalRev)

    const totalSp = spends.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
    setTotalSpend(totalSp)

    // Build per-faculty stats
    const stats: FacultyStats[] = FACULTIES.map(faculty => {
      const facultyStudents = students.filter(s => s.faculty === faculty)
      const studentIds = new Set(facultyStudents.map(s => s.id))
      const facultyPayments = payments.filter(p => studentIds.has(p.student_id))
      const paidStudentIds = new Set(facultyPayments.map(p => p.student_id))
      const revenue = facultyPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

      return {
        faculty,
        students: facultyStudents.length,
        paid: paidStudentIds.size,
        unpaid: facultyStudents.length - paidStudentIds.size,
        revenue,
      }
    }).filter(s => s.students > 0)

    setFacultyStats(stats)
    setLoading(false)
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']

  const pieData = facultyStats.map(s => ({
    name: s.faculty.length > 15 ? s.faculty.substring(0, 15) + '...' : s.faculty,
    value: s.students
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 py-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Chargement des rapports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rapports & Statistiques</h1>
        <p className="text-gray-600">Vue d&apos;ensemble des données de l&apos;université</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-80 font-semibold">Total Étudiants</p>
          <p className="text-3xl font-bold mt-1">{totalStudents}</p>
        </div>
        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-80 font-semibold">Revenus</p>
          <p className="text-3xl font-bold mt-1">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-linear-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-80 font-semibold">Dépenses</p>
          <p className="text-3xl font-bold mt-1">${totalSpend.toLocaleString()}</p>
        </div>
        <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-80 font-semibold">Solde Net</p>
          <p className="text-3xl font-bold mt-1">${(totalRevenue - totalSpend).toLocaleString()}</p>
        </div>
      </div>

      {/* Chart Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'enrollment', label: 'Inscriptions' },
          { key: 'revenue', label: 'Revenus' },
          { key: 'balance', label: 'Distribution' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveChart(tab.key as typeof activeChart)}
            className={`px-5 py-2 rounded-lg font-semibold transition-all text-sm ${
              activeChart === tab.key
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        {activeChart === 'enrollment' && (
          <>
            <h3 className="font-bold text-gray-900 mb-4">Étudiants par Faculté</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={facultyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="faculty" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#3B82F6" name="Étudiants" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {activeChart === 'revenue' && (
          <>
            <h3 className="font-bold text-gray-900 mb-4">Revenus par Faculté ($)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={facultyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="faculty" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#10B981" name="Revenus" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {activeChart === 'balance' && (
          <>
            <h3 className="font-bold text-gray-900 mb-4">Distribution des Étudiants</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={150} dataKey="value" label>
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Faculty Detail Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Détail par Faculté</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Faculté</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Étudiants</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Payés</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Non Payés</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Revenus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {facultyStats.map(stat => (
                <tr key={stat.faculty} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 text-sm">{stat.faculty}</td>
                  <td className="px-6 py-4 text-center text-sm">{stat.students}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">{stat.paid}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">{stat.unpaid}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-sm">${stat.revenue.toLocaleString()}</td>
                </tr>
              ))}
              {facultyStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Aucune donnée disponible</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
