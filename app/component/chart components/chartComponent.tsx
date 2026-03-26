import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from 'recharts'

interface ChartData {
  date_time: string | number
  amount: number
  [key: string]: any
}

interface ChartProgressProps {
  data: ChartData[]
  title?: string
  subtitle?: string
  dataKey?: string
  color?: string
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-gray-700 font-semibold text-sm">{data.date_time}</p>
        <p className="text-indigo-600 font-bold text-sm">
          HTG {parseFloat(data.amount).toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </p>
      </div>
    )
  }
  return null
}

export default function ChartProgress({
  data,
  title = 'Progression des Dépenses',
  subtitle = 'Vue mensuelle des dépenses',
  dataKey = 'amount',
  color = '#6366f1'
}: ChartProgressProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="w-full lg:w-1/2 h-96 bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-500 font-medium">Aucune donnée disponible</p>
          <p className="text-gray-400 text-sm mt-1">Les dépenses apparaîtront ici</p>
        </div>
      </div>
    )
  }

  // Calculate statistics
  const total = data.reduce((sum, item) => sum + (parseFloat(item[dataKey]) || 0), 0)
  const average = (total / data.length).toFixed(2)
  const max = Math.max(...data.map(item => parseFloat(item[dataKey]) || 0)).toFixed(2)

  return (
    <div className="w-full lg:w-1/2 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {title}
        </h3>
        <p className="text-indigo-100 text-sm mt-1">{subtitle}</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <p className="text-gray-600 text-xs font-medium uppercase tracking-wider">Total</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {parseFloat(total.toString()).toLocaleString('en-US', { maximumFractionDigits: 0 })} HTG
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-600 text-xs font-medium uppercase tracking-wider">Moyenne</p>
          <p className="text-lg font-bold text-indigo-600 mt-1">
            {average} HTG
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-600 text-xs font-medium uppercase tracking-wider">Max</p>
          <p className="text-lg font-bold text-green-600 mt-1">
            {max} HTG
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 p-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="date_time"
              tickFormatter={(value) => {
                try {
                  return new Date(value).toLocaleString('default', { month: 'short', day: 'numeric' })
                } catch {
                  return value
                }
              }}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              label={{ value: 'HTG', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
            <ReferenceLine
              y={parseInt(average)}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{ value: `Moyenne: ${average} HTG`, position: 'right', fontSize: 11, fill: '#f59e0b' }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, r: 5 }}
              activeDot={{ r: 7 }}
              fillOpacity={1}
              fill="url(#colorAmount)"
              isAnimationActive={true}
              animationDuration={800}
              name="Montant (HTG)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
        <p>
          📊 <span className="font-medium">{data.length}</span> enregistrement{data.length > 1 ? 's' : ''} •
          <span className="font-medium ml-2">Mis à jour</span> à {new Date().toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}