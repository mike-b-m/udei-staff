'use client'
import { supabase } from "../db"
import { useState, useEffect } from "react"
import Input from "../input/input-comp"
import { Code } from "../code/code"
import Image from "next/image"

import { useFaculties } from "@/app/component/student-infos/useFaculties"

interface FormData {
  first_name: string
  last_name: string
  date_birth: string
  place_of_birth: string
  nif_cin: string
  marital_status: string
  adress: string
  phone_number: string
  email: string
  sex: string
  faculty: string
  academy: string
  mother_name: string
  mother_birth: string
  mother_residence: string
  mother_phone: string
  mother_profesion: string
  father_name: string
  father_birth: string
  father_residence: string
  father_phone: string
  father_profesion: string
  seen_by: string
  student_code: string
  photo_url: string
}

interface FormErrors {
  [key: string]: string
}

const REQUIRED_FIELDS = [
  'first_name',
  'last_name',
  'date_birth',
  'place_of_birth',
  'nif_cin',
  'marital_status',
  'adress',
  'phone_number',
  'email',
  'sex',
  'faculty',
  'academy'
]

export default function StudentInput() {
  const { facultyNames } = useFaculties()
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    date_birth: '',
    place_of_birth: '',
    nif_cin: '',
    marital_status: '',
    adress: '',
    phone_number: '',
    email: '',
    sex: '',
    faculty: '',
    academy: '',
    mother_name: '',
    mother_birth: '',
    mother_residence: '',
    mother_phone: '',
    mother_profesion: '',
    father_name: '',
    father_birth: '',
    father_residence: '',
    father_phone: '',
    father_profesion: '',
    seen_by: '',
    student_code: '',
    photo_url: ''
  })

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [sequenceNumber, setSequenceNumber] = useState(0)

  useEffect(() => {
    const getNextSequence = async () => {
      const { data, error } = await supabase
        .from('student')
        .select('id', { count: 'exact' })
        .gte('enroll_date', new Date(new Date().getFullYear(), 0, 1).toISOString())

      if (!error && data) {
        setSequenceNumber(data.length + 1)
      }
      else console.error(error.message)
    }
    getNextSequence()
  }, [])

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ photo: 'Photo doit être inférieure à 5MB' })
        return
      }
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.photo
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    REQUIRED_FIELDS.forEach(field => {
      if (!formData[field as keyof FormData]) {
        newErrors[field] = 'Ce champ est requis'
      }
    })

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }

    if (formData.phone_number && formData.phone_number.length < 8) {
      newErrors.phone_number = 'Téléphone invalide'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      let photo_url = ''

      if (photo) {
        const fileExt = photo.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('student_photo')
          .upload(fileName, photo, { contentType: photo.type })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('student_photo')
          .getPublicUrl(fileName)
        photo_url = urlData.publicUrl
      }

      const { error: insertError } = await supabase.from('student').insert([
        {
          ...formData,
          photo_url,
          agreement: true
        }
      ])

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        window.location.reload()
      }, 2500)
    } catch (error) {
      console.error('Error:', error)
      setErrors({
        submit: error instanceof Error ? error.message : 'Une erreur est survenue'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Inscription Étudiant
          </h1>
          <p className="text-gray-600">Complétez le formulaire d'inscription</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in duration-300 flex items-center gap-3">
            <svg className="w-6 h-6 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-green-900">Enregistrement réussi!</p>
              <p className="text-sm text-green-800">Redirection en cours...</p>
            </div>
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-in fade-in duration-300 flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center mb-4 shadow-md shrink-0">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.433-.608-7.499-1.632Z" />
                  </svg>
                )}
              </div>
              <label className="text-sm font-semibold text-gray-700 mb-3">
                Photo de l&apos;étudiant
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="px-4 py-2 text-sm file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer transition-colors"
              />
              {errors.photo && (
                <p className="mt-2 text-sm text-red-600">{errors.photo}</p>
              )}
            </div>
          </div>

          <section className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 pb-4 border-b-2 border-blue-200">
              <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0">1</span>
              Informations Personnelles
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nom"
                type="text"
                value={formData.last_name}
                onChange={handleInputChange('last_name')}
                required
                error={errors.last_name}
              />
              <Input
                label="Prénom"
                type="text"
                value={formData.first_name}
                onChange={handleInputChange('first_name')}
                required
                error={errors.first_name}
              />
              <Input
                label="Date de naissance"
                type="date"
                value={formData.date_birth}
                onChange={handleInputChange('date_birth')}
                required
                error={errors.date_birth}
              />
              <Input
                label="Lieu de naissance"
                type="text"
                value={formData.place_of_birth}
                onChange={handleInputChange('place_of_birth')}
                required
                error={errors.place_of_birth}
              />
              <Input
                label="NIF/CIN"
                type="text"
                value={formData.nif_cin}
                onChange={handleInputChange('nif_cin')}
                required
                error={errors.nif_cin}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                required
                error={errors.email}
              />
              <Input
                label="Téléphone"
                type="tel"
                value={formData.phone_number}
                onChange={handleInputChange('phone_number')}
                required
                error={errors.phone_number}
              />
              <Input
                label="Adresse"
                type="text"
                value={formData.adress}
                onChange={handleInputChange('adress')}
                required
                error={errors.adress}
              />
              <Input
                label="Année Académique"
                type="text"
                value={formData.academy}
                onChange={handleInputChange('academy')}
                required
                error={errors.academy}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col w-full mb-0">
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Sexe <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sex}
                  onChange={handleInputChange('sex')}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.sex
                      ? 'border-red-500 bg-red-50 focus:border-red-600'
                      : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
                  }`}
                >
                  <option value="">Sélectionner le sexe</option>
                  <option>Masculin</option>
                  <option>Féminin</option>
                </select>
                {errors.sex && <p className="mt-1 text-sm text-red-600">{errors.sex}</p>}
              </div>

              <div className="flex flex-col w-full mb-0">
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Statut Matrimonial <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.marital_status}
                  onChange={handleInputChange('marital_status')}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.marital_status
                      ? 'border-red-500 bg-red-50 focus:border-red-600'
                      : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
                  }`}
                >
                  <option value="">Sélectionner le statut</option>
                  <option>Marié</option>
                  <option>Célibataire</option>
                  <option>Divorcé</option>
                </select>
                {errors.marital_status && <p className="mt-1 text-sm text-red-600">{errors.marital_status}</p>}
              </div>

              <div className="flex flex-col w-full mb-0">
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Faculté <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.faculty}
                  onChange={handleInputChange('faculty')}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.faculty
                      ? 'border-red-500 bg-red-50 focus:border-red-600'
                      : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
                  }`}
                >
                  <option value="">Sélectionner une faculté</option>
                  {facultyNames.map(f => <option key={f}>{f}</option>)}
                </select>
                {errors.faculty && <p className="mt-1 text-sm text-red-600">{errors.faculty}</p>}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 pb-4 border-b-2 border-blue-200">
              <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0">2</span>
              Informations Familiales
            </h2>

            <div>
              <h3 className="font-semibold text-gray-700 mb-4 text-base">Mère</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nom de la mère"
                  type="text"
                  value={formData.mother_name}
                  onChange={handleInputChange('mother_name')}
                />
                <Input
                  label="Lieu de naissance"
                  type="text"
                  value={formData.mother_birth}
                  onChange={handleInputChange('mother_birth')}
                />
                <Input
                  label="Domicile"
                  type="text"
                  value={formData.mother_residence}
                  onChange={handleInputChange('mother_residence')}
                />
                <Input
                  label="Téléphone"
                  type="tel"
                  value={formData.mother_phone}
                  onChange={handleInputChange('mother_phone')}
                />
                <Input
                  label="Profession"
                  type="text"
                  value={formData.mother_profesion}
                  onChange={handleInputChange('mother_profesion')}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-700 mb-4 text-base">Père</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nom du père"
                  type="text"
                  value={formData.father_name}
                  onChange={handleInputChange('father_name')}
                />
                <Input
                  label="Lieu de naissance"
                  type="text"
                  value={formData.father_birth}
                  onChange={handleInputChange('father_birth')}
                />
                <Input
                  label="Domicile"
                  type="text"
                  value={formData.father_residence}
                  onChange={handleInputChange('father_residence')}
                />
                <Input
                  label="Téléphone"
                  type="tel"
                  value={formData.father_phone}
                  onChange={handleInputChange('father_phone')}
                />
                <Input
                  label="Profession"
                  type="text"
                  value={formData.father_profesion}
                  onChange={handleInputChange('father_profesion')}
                />
              </div>
            </div>
            

            <Input
              label="Vu par"
              type="text"
              value={formData.seen_by}
              onChange={handleInputChange('seen_by')}
            />
          </section>
          <Code
            sequenceNumber={sequenceNumber}
            faculty={formData.faculty}
            onCodeGenerated={(code) => setFormData(prev => ({ ...prev, student_code: code }))}
          />

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-semibold text-gray-900">Code Étudiant</h3>
            </div>
            <p className="text-2xl font-mono text-blue-600 font-bold">{formData.student_code || 'En attente...'}</p>
            <p className="text-xs text-gray-600 mt-2">Généré automatiquement</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
            <input
              type="checkbox"
              id="agreement"
              required
              className="w-5 h-5 mt-1 text-blue-600 rounded cursor-pointer accent-blue-600 shrink-0"
            />
            <label htmlFor="agreement" className="text-sm text-gray-700 cursor-pointer">
              Je m&apos;engage à respecter les principes et règlements de l&apos;UDEI
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
              loading || success
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Enregistrement en cours...
              </>
            ) : success ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Enregistrement réussi!
              </>
            ) : (
              'Enregistrer l\'étudiant'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}