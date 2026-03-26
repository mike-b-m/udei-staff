'use client'
import { Price, Payments, Student_pay } from "@/app/component/add-payment/addpayment"
import { Suspense, useState, useMemo } from "react"

// ============ ICON COMPONENTS ============
const Icons = {
  price: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  students: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 8.048M12 4.354L8.117 8.427M12 4.354l3.883 4.073M18.364 5.636l-3.536 3.536M9.172 9.172L5.636 5.636m13.728 0l-3.536 3.536M9 11a3 3 0 11-6 0 3 3 0 016 0zm9 0a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  payments: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  rightArrow: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),
  checkCircle: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// ============ TAB DEFINITIONS ============
const TABS = [
  {
    id: 'price',
    label: 'Tarification',
    icon: Icons.price,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    component: Price,
    description: 'Gérer les tarifs par faculté'
  },
  {
    id: 'students',
    label: 'Étudiants',
    icon: Icons.students,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    component: Student_pay,
    description: 'Consulter les soldes des étudiants'
  },
  {
    id: 'payments',
    label: 'Transactions',
    icon: Icons.payments,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    component: Payments,
    description: 'Historique des paiements'
  }
]

// ============ LOADING SKELETON ============
function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-1/2 animate-pulse"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}

// ============ TAB NAVIGATION ============
function TabNavigation({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tabId: string) => void }) {
  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative group px-6 py-4 font-semibold transition-all duration-300
                flex items-center gap-3
                ${
                  activeTab === tab.id
                    ? `${tab.iconColor} bg-opacity-5`
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {/* Icon with background */}
              <span className={`
                p-2 rounded-lg transition-all duration-300
                ${activeTab === tab.id
                  ? `${tab.bgColor} ${tab.iconColor}`
                  : 'text-gray-400 group-hover:text-gray-600'
                }`}>
                {tab.icon}
              </span>
              
              {/* Label */}
              <span>{tab.label}</span>
              
              {/* Animated underline */}
              {activeTab === tab.id && (
                <div className={`
                  absolute bottom-0 left-0 right-0 h-1.5 
                  ${tab.iconColor.replace('text-', 'bg-')} 
                  rounded-t-full opacity-80
                `}></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

// ============ TAB CONTENT ============
function TabContent({ activeTab }: { activeTab: string }) {
  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component

  return (
    <div className="animate-in fade-in duration-300">
      {ActiveComponent && <ActiveComponent />}
    </div>
  )
}

// ============ MAIN PAGE ============
export default function PaymentPage() {
  const [activeTab, setActiveTab] = useState('price')

  const activeTabData = useMemo(
    () => TABS.find(tab => tab.id === activeTab),
    [activeTab]
  )

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Icon Bg */}
                <div className={`
                  p-3 rounded-xl shadow-lg
                  ${activeTabData?.bgColor} 
                  backdrop-blur-sm
                  border border-opacity-20 border-white
                `}>
                  <span className={`
                    text-3xl inline-block
                    ${activeTabData?.iconColor}
                  `}>
                    {activeTabData?.icon}
                  </span>
                </div>
                
                {/* Content */}
                <div className="text-white">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                      {activeTabData?.label}
                    </h1>
                    <span className="px-3 py-1 text-xs font-semibold bg-white bg-opacity-10 rounded-full text-white border border-white border-opacity-20">
                      PRO
                    </span>
                  </div>
                  <p className="text-slate-300 mt-2 text-sm font-medium">
                    {activeTabData?.description}
                  </p>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="text-right">
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500 bg-opacity-10 px-4 py-2 rounded-lg border border-emerald-500 border-opacity-30">
                  {Icons.checkCircle}
                  <span className="text-sm font-semibold">Actif</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto">
          <TabContent activeTab={activeTab} />
        </div>
      </div>
    </Suspense>
  )
}