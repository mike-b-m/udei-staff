'use client'
import { useState } from 'react'
import { supabase } from '../db'
import Input from '../input/input-comp'

interface AddDeptProps {
  onOpen: () => void
}

interface FormErrors {
  [key: string]: string
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'moncash', label: 'MonCash' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'natcash', label: 'NatCash' }
]

export default function AddDept({ onOpen }: AddDeptProps) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    description: '',
    paymentMethod: '',
    date: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) newErrors.name = 'Le nom est requis'
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Le montant doit être positif'
    if (!formData.description.trim()) newErrors.description = 'La description est requise'
    if (!formData.paymentMethod) newErrors.paymentMethod = 'La méthode de paiement est requise'
    if (!formData.date) newErrors.date = 'La date est requise'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setSuccess(false)

    try {
      const { error } = await supabase
        .from('spent_in_company')
        .insert([
          {
            date_time: formData.date,
            amount: parseFloat(formData.amount),
            name: formData.name,
            pay_method: formData.paymentMethod,
            describe_motive: formData.description
          }
        ])
        .select()

      if (error) throw error

      setSuccessMessage('Dépense enregistrée avec succès!')
      setSuccess(true)
      setFormData({ name: '', amount: '', description: '', paymentMethod: '', date: '' })

      setTimeout(() => {
        onOpen()
      }, 1500)
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Une erreur est survenue lors de la sauvegarde'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Ajouter une Dépense
          </h2>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-medium">{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">{errors.submit}</span>
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom */}
            <Input
              label="Nom de la dépense"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              error={errors.name}
              placeholder="Ex: Fournitures de bureau"
            />

            {/* Montant */}
            <Input
              label="Montant (HTG)"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              error={errors.amount}
              placeholder="Ex: 5000"
            />

            {/* Date */}
            <Input
              label="Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              error={errors.date}
            />

            {/* Méthode de paiement */}
            <div className="flex flex-col w-full mb-0">
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Méthode de paiement <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-2.5 rounded-lg font-medium border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 ${
                  errors.paymentMethod
                    ? 'border-red-500 bg-red-50 focus:border-red-600'
                    : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
                }`}
              >
                <option value="">Sélectionner une méthode</option>
                {PAYMENT_METHODS.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              {errors.paymentMethod && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {errors.paymentMethod}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col w-full">
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Détails de la dépense..."
              required
              rows={4}
              className={`w-full px-4 py-2.5 rounded-lg font-medium border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 resize-none placeholder:font-normal placeholder:text-gray-400 ${
                errors.description
                  ? 'border-red-500 bg-red-50 focus:border-red-600'
                  : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
              }`}
            />
            {errors.description && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errors.description}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onOpen}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                loading || success
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Enregistrement...
                </>
              ) : success ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Enregistré!
                </>
              ) : (
                'Enregistrer la dépense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}