'use client'
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "../db";

// Role-based access control constants
const NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Accueil',
    icon: 'home',
    roles: ['admin', 'editor', 'administration', 'prof']
  },
  {
    href: '/admin/inscription',
    label: 'Inscription',
    icon: 'inscription',
    roles: ['admin', 'editor']
  },
  {
    href: '/admin/search',
    label: 'Recherche',
    icon: 'search',
    roles: ['admin', 'administration', 'editor']
  },
  {
    href: '/admin/spend',
    label: 'Dépense',
    icon: 'spend',
    roles: ['admin', 'administration']
  },
  {
    href: '/admin/create',
    label: 'Compte',
    icon: 'create',
    roles: ['admin']
  },
  {
    href: '/admin/program',
    label: 'Programme',
    icon: 'program',
    roles: ['admin', 'editor', 'prof']
  },
  {
    href: '/admin/payment',
    label: 'Paiement',
    icon: 'payment',
    roles: ['admin', 'administration']
  },
  {
    href: '/admin/teacher',
    label: 'Enseignants',
    icon: 'teacher',
    roles: ['admin', 'editor', 'prof']
  },
  {
    href: '/admin/enrollment',
    label: 'Inscription Sem.',
    icon: 'enrollment',
    roles: ['admin', 'editor', 'administration']
  },
  {
    href: '/admin/exam',
    label: 'Examens',
    icon: 'exam',
    roles: ['admin', 'editor', 'prof']
  },
  {
    href: '/admin/reports',
    label: 'Rapports',
    icon: 'reports',
    roles: ['admin']
  },
  {
    href: '/admin/homework',
    label: 'Devoirs',
    icon: 'homework',
    roles: ['admin', 'editor', 'prof']
  },
  {
    href: '/admin/manage',
    label: 'Gestion Acad.',
    icon: 'manage',
    roles: ['admin']
  }
]

const ICON_MAP: Record<string, React.ReactNode> = {
  home: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
    </svg>
  ),
  inscription: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  ),
  search: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  ),
  spend: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  ),
  create: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
    </svg>
  ),
  program: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
  ),
  payment: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  ),
  teacher: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
    </svg>
  ),
  enrollment: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
  ),
  exam: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.251 2.251 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
    </svg>
  ),
  reports: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
  homework: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  manage: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
  )
}

interface NavItemProps {
  item: typeof NAV_ITEMS[0]
  isActive: boolean
  isExpanded: boolean
  onClick?: () => void
}

function NavItem({ item, isActive, isExpanded, onClick }: NavItemProps) {
  return (
    <Link href={item.href} onClick={onClick}>
      <li className={`
        relative m-2 px-3 py-2.5 rounded-lg flex items-center gap-3
        transition-all duration-300 ease-out
        ${isActive 
          ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30' 
          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
        }
        group
      `}>
        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-lg" />
        )}
        
        <div className="shrink-0">{ICON_MAP[item.icon]}</div>
        
        {/* Label with smooth expand animation */}
        <span className={`
          font-medium text-sm overflow-hidden transition-all duration-300
          ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}
          group-hover:opacity-100 group-hover:w-auto
        `}>
          {item.label}
        </span>

        {/* Hover indicator on desktop */}
        <div className="absolute inset-0 rounded-lg bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      </li>
    </Link>
  )
}

export default function Nav() {
  const [session, setSession] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const getData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (session) setSession(session)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Error:', userError.message)
        return
      }

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        
        if (profileData?.role) {
          setUserRole(profileData.role)
        }
      }
    }

    getData()
  }, [])

  if (!session) return null

  // Filter nav items based on user role
  const filteredItems = NAV_ITEMS.filter(item => 
    userRole && item.roles.includes(userRole)
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-lg font-bold text-blue-600">UDEI Admin</h1>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 top-14 z-40 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <nav className={`
        fixed left-0 top-0 md:top-0 h-screen z-40
        bg-white border-r border-gray-200 shadow-xl
        transition-all duration-300 ease-out
        flex flex-col
        ${isMobileOpen 
          ? 'w-64 translate-x-0' 
          : '-translate-x-full md:translate-x-0 w-64 md:w-20'
        }
        md:hover:w-64
        group/nav
      `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Desktop Logo/Brand */}
        <div className="hidden md:flex items-center justify-center h-16 md:h-20 border-b border-gray-100 px-3 shrink-0 bg-white">
          <div className={`
            text-xl font-bold text-blue-600 transition-all duration-300 whitespace-nowrap
            ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
            group-hover/nav:opacity-100 group-hover/nav:w-auto
          `}>
            UDEI
          </div>
        </div>

        {/* Mobile Logo */}
        <div className="md:hidden flex items-center justify-between h-14 border-b border-gray-100 px-4 shrink-0 bg-white">
          <span className="text-lg font-bold text-blue-600">UDEI</span>
          <button onClick={() => setIsMobileOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items — scrollable */}
        <ul className="p-2 space-y-1 flex-1 overflow-y-auto scrollbar-thin">
          {filteredItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              isExpanded={isExpanded || isMobileOpen}
              onClick={() => setIsMobileOpen(false)}
            />
          ))}
        </ul>

        {/* Footer Info */}
        <div className="shrink-0 p-4 border-t border-gray-100 bg-gray-50">
          <div className={`
            text-xs text-gray-500 text-center overflow-hidden transition-all duration-300
            ${isExpanded || isMobileOpen ? 'opacity-100 h-auto' : 'opacity-0 h-0'}
            group-hover/nav:opacity-100 group-hover/nav:h-auto
          `}>
            <p className="font-semibold">Connecté en tant que</p>
            <p className="text-blue-600 capitalize">{userRole}</p>
          </div>
        </div>
      </nav>
    </>
  )
}