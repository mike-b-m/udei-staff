'use client'
import { supabase } from "../db";
import { useState, useEffect } from "react";
import Time from "../time/time";
import Input from "../input/input-comp";

// Types
type StaffProfile = {
  id: string
  full_name: string
  role: string
  email: string
  phone?: string
  created_at: string
}

type ValidationError = {
  field: string
  message: string
}

// Constants
const STAFF_ROLES = ['admin', 'editor', 'administration', 'prof'] as const
const PASSWORD_MIN_LENGTH = 8
const ROW_COLORS = [
  "bg-blue-50 hover:bg-blue-100",
  "bg-white hover:bg-gray-50"
]

export default function SignUp() {
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [fullname, setFullname] = useState('')
  const [role, setRole] = useState('')

  // UI state
  const [profiles, setProfiles] = useState<StaffProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingProfiles, setFetchingProfiles] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  // Fetch profiles on mount
  useEffect(() => {
    fetchProfiles()
  }, [])

  // Auto-dismiss messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  const fetchProfiles = async () => {
    try {
      setFetchingProfiles(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (err: any) {
      console.error('Error fetching profiles:', err.message)
      setErrorMessage('Erreur lors du chargement des comptes')
    } finally {
      setFetchingProfiles(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: ValidationError[] = []

    if (!fullname.trim()) {
      errors.push({ field: 'fullname', message: 'Le nom complet est requis' })
    } else if (fullname.trim().length < 3) {
      errors.push({ field: 'fullname', message: 'Le nom doit contenir au moins 3 caractères' })
    }

    if (!email.trim()) {
      errors.push({ field: 'email', message: 'L\'email est requis' })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ field: 'email', message: 'L\'email n\'est pas valide' })
    }

    if (!password) {
      errors.push({ field: 'password', message: 'Le mot de passe est requis' })
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      errors.push({ field: 'password', message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères` })
    }

    if (!role) {
      errors.push({ field: 'role', message: 'Le rôle est requis' })
    }

    if (phone && !/^\d{10,}$/.test(phone.replace(/\D/g, ''))) {
      errors.push({ field: 'phone', message: 'Le numéro de téléphone n\'est pas valide' })
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setPhone('')
    setFullname('')
    setRole('')
    setValidationErrors([])
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullname,
            role: role,
            phone: phone,
          }
        }
      })

      if (error) throw error

      setSuccessMessage(`Compte créé avec succès pour ${fullname}`)
      resetForm()
      
      // Refetch profiles to show new account
      await fetchProfiles()
    } catch (err: any) {
      const message = err.message || 'Une erreur est survenue lors de la création du compte'
      setErrorMessage(message)
      console.error('Error creating account:', err)
    } finally {
      setLoading(false)
    }
  }

  const getFieldError = (field: string): string | undefined => {
    return validationErrors.find(e => e.field === field)?.message
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Error Message */}
        {errorMessage && (
          <div className="fixed top-4 right-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg p-4 flex items-start gap-3 z-50 max-w-md animate-slideIn">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-red-800 font-semibold">Erreur</p>
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 right-4 bg-green-50 border-l-4 border-green-500 rounded-lg shadow-lg p-4 flex items-start gap-3 z-50 max-w-md animate-slideIn">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-green-800 font-semibold">Succès</p>
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-green-500 hover:text-green-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestion du Personnel</h1>
          <p className="text-gray-600">Créer des comptes pour les membres du personnel</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Créer un Compte</h2>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom Complet *
                </label>
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => {
                    setFullname(e.target.value)
                    if (validationErrors.some(err => err.field === 'fullname')) {
                      setValidationErrors(validationErrors.filter(err => err.field !== 'fullname'))
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                    getFieldError('fullname') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Jean Dupont"
                />
                {getFieldError('fullname') && (
                  <p className="text-red-600 text-sm mt-1">{getFieldError('fullname')}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (validationErrors.some(err => err.field === 'email')) {
                      setValidationErrors(validationErrors.filter(err => err.field !== 'email'))
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                    getFieldError('email') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="jean@example.com"
                />
                {getFieldError('email') && (
                  <p className="text-red-600 text-sm mt-1">{getFieldError('email')}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (validationErrors.some(err => err.field === 'password')) {
                      setValidationErrors(validationErrors.filter(err => err.field !== 'password'))
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                    getFieldError('password') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <p className="text-gray-500 text-xs mt-1">Min. {PASSWORD_MIN_LENGTH} caractères</p>
                {getFieldError('password') && (
                  <p className="text-red-600 text-sm mt-1">{getFieldError('password')}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (validationErrors.some(err => err.field === 'phone')) {
                      setValidationErrors(validationErrors.filter(err => err.field !== 'phone'))
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                    getFieldError('phone') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+509 40000000"
                />
                {getFieldError('phone') && (
                  <p className="text-red-600 text-sm mt-1">{getFieldError('phone')}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rôle *
                </label>
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value)
                    if (validationErrors.some(err => err.field === 'role')) {
                      setValidationErrors(validationErrors.filter(err => err.field !== 'role'))
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                    getFieldError('role') ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner un rôle</option>
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
                {getFieldError('role') && (
                  <p className="text-red-600 text-sm mt-1">{getFieldError('role')}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création en cours...
                  </span>
                ) : (
                  'Créer le compte'
                )}
              </button>
            </form>
          </div>

          {/* Accounts List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h3 className="text-xl font-bold text-white">Comptes Créés</h3>
              </div>

              {fetchingProfiles ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 mt-4">Chargement des comptes...</p>
                </div>
              ) : profiles.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 8.048M9 9h6m-6 4h6m2-5a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600">Aucun compte créé pour le moment</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nom Complet</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rôle</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date Création</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {profiles.map((profile, index) => (
                        <tr key={profile.id} className={`${ROW_COLORS[index % ROW_COLORS.length]} transition`}>
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">{profile.full_name}</td>
                          <td className="px-6 py-3 text-sm">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                              {profile.role}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">{profile.email}</td>
                          <td className="px-6 py-3 text-sm text-gray-600">
                            <Time open={profile.created_at} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {profiles.length > 0 && (
                <div className="bg-gray-50 border-t-2 border-gray-200 px-6 py-3">
                  <p className="text-sm text-gray-600">
                    Total: <span className="font-semibold text-gray-900">{profiles.length}</span> compte{profiles.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}