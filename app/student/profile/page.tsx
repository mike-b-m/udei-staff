'use client'
import { supabase } from "@/app/component/db"
import { useState, useEffect } from "react"

interface StudentProfile {
    id: number
    first_name: string
    last_name: string
    faculty: string
    email: string
    phone_number: string
    date_birth: string
    place_of_birth: string
    sex: string
    marital_status: string
    adress: string
    nif_cin: string
    photo_url: string
    student_code: string
    diploma: string
    mother_name: string
    mother_phone: string
    mother_profesion: string
    father_name: string
    father_phone: string
    father_profesion: string
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<StudentProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [form, setForm] = useState<Partial<StudentProfile>>({})
    const [uploading, setUploading] = useState(false)

    // Password change
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordSaving, setPasswordSaving] = useState(false)

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.email) { setLoading(false); return }

        const { data } = await supabase
            .from('student')
            .select('*')
            .eq('email', user.email)
            .maybeSingle()

        if (data) {
            setProfile(data)
            setForm(data)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!profile?.id) return
        setSaving(true)
        setError('')
        setMessage('')

        const { error: updateError } = await supabase
            .from('student')
            .update({
                first_name: form.first_name,
                last_name: form.last_name,
                phone_number: form.phone_number,
                date_birth: form.date_birth,
                place_of_birth: form.place_of_birth,
                sex: form.sex,
                marital_status: form.marital_status,
                adress: form.adress,
                nif_cin: form.nif_cin,
                mother_name: form.mother_name,
                mother_phone: form.mother_phone,
                mother_profesion: form.mother_profesion,
                father_name: form.father_name,
                father_phone: form.father_phone,
                father_profesion: form.father_profesion,
            })
            .eq('id', profile.id)

        if (updateError) {
            setError(updateError.message)
        } else {
            setMessage('Profil mis à jour avec succès')
            setEditing(false)
            loadProfile()
        }
        setSaving(false)
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !profile?.id) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Veuillez sélectionner une image')
            return
        }
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError('Image trop grande (max 2MB)')
            return
        }

        setUploading(true)
        setError('')

        const fileExt = file.name.split('.').pop()
        const fileName = `student_${profile.id}_${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(fileName, file, { upsert: true })

        if (uploadError) {
            setError('Erreur lors du téléchargement: ' + uploadError.message)
            setUploading(false)
            return
        }

        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName)

        await supabase.from('student').update({ photo_url: urlData.publicUrl }).eq('id', profile.id)
        setMessage('Photo de profil mise à jour')
        loadProfile()
        setUploading(false)
    }

    const handlePasswordChange = async () => {
        if (newPassword.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères')
            return
        }
        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            return
        }

        setPasswordSaving(true)
        setError('')

        // Refresh the session to ensure we have valid tokens
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
        if (!session) {
            setError('Session expirée. Veuillez vous reconnecter.')
            setPasswordSaving(false)
            return
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) {
            setError(error.message)
        } else {
            setMessage('Mot de passe mis à jour avec succès')
            setShowPasswordForm(false)
            setNewPassword('')
            setConfirmPassword('')
        }
        setPasswordSaving(false)
    }

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
                    <p className="text-gray-600 text-lg">Aucun profil étudiant trouvé.</p>
                    <p className="text-gray-500 mt-2">Veuillez d&apos;abord compléter votre inscription.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-100 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Mon Profil</h1>

                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center justify-between">
                        {message}
                        <button onClick={() => setMessage('')} className="font-bold">✕</button>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center justify-between">
                        {error}
                        <button onClick={() => setError('')} className="font-bold">✕</button>
                    </div>
                )}

                {/* Profile Header */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                    <div className="bg-linear-to-r from-blue-600 to-blue-500 h-32 relative"></div>
                    <div className="px-6 pb-6">
                        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-16">
                            <div className="relative group">
                                <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                                    {profile.photo_url ? (
                                        <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                                    </svg>
                                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                                </label>
                                {uploading && <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900">{profile.last_name} {profile.first_name}</h2>
                                <p className="text-gray-600">{profile.faculty}</p>
                                <p className="text-blue-600 font-mono font-semibold">{profile.student_code}</p>
                            </div>
                            <button onClick={() => setEditing(!editing)}
                                className={`px-6 py-2.5 rounded-lg font-semibold transition ${editing ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                                {editing ? 'Annuler' : 'Modifier le Profil'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Informations Personnelles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: 'Nom', field: 'last_name' },
                            { label: 'Prénom', field: 'first_name' },
                            { label: 'Email', field: 'email', readonly: true },
                            { label: 'Téléphone', field: 'phone_number' },
                            { label: 'Date de Naissance', field: 'date_birth', type: 'date' },
                            { label: 'Lieu de Naissance', field: 'place_of_birth' },
                            { label: 'NIF/CIN', field: 'nif_cin' },
                            { label: 'Adresse', field: 'adress' },
                        ].map(({ label, field, readonly, type }) => (
                            <div key={field}>
                                <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
                                {editing && !readonly ? (
                                    <input type={type || 'text'} value={(form as any)[field] || ''}
                                        onChange={e => handleChange(field, e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                                ) : (
                                    <p className="text-gray-900 font-medium py-2">{(profile as any)[field] || '-'}</p>
                                )}
                            </div>
                        ))}
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Sexe</label>
                            {editing ? (
                                <select value={form.sex || ''} onChange={e => handleChange('sex', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                    <option value="M">Masculin</option>
                                    <option value="F">Féminin</option>
                                </select>
                            ) : (
                                <p className="text-gray-900 font-medium py-2">{profile.sex === 'M' || profile.sex === 'Masculin' ? 'Masculin' : 'Féminin'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">État Civil</label>
                            {editing ? (
                                <select value={form.marital_status || ''} onChange={e => handleChange('marital_status', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                    <option value="Célibataire">Célibataire</option>
                                    <option value="Marié(e)">Marié(e)</option>
                                    <option value="Divorcé(e)">Divorcé(e)</option>
                                </select>
                            ) : (
                                <p className="text-gray-900 font-medium py-2">{profile.marital_status || '-'}</p>
                            )}
                        </div>
                    </div>

                    {editing && (
                        <div className="mt-6 flex gap-3">
                            <button onClick={handleSave} disabled={saving}
                                className="px-8 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                                {saving ? 'Enregistrement...' : 'Sauvegarder'}
                            </button>
                            <button onClick={() => { setEditing(false); setForm(profile) }}
                                className="px-8 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition">
                                Annuler
                            </button>
                        </div>
                    )}
                </div>

                {/* Settings Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Paramètres du Compte</h3>

                    {/* Change Password */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-gray-900">Changer le Mot de Passe</h4>
                                <p className="text-sm text-gray-500 mt-1">Mettez à jour votre mot de passe de connexion</p>
                            </div>
                            <button onClick={() => setShowPasswordForm(!showPasswordForm)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition text-sm">
                                {showPasswordForm ? 'Annuler' : 'Modifier'}
                            </button>
                        </div>
                        {showPasswordForm && (
                            <div className="mt-4 space-y-3 pt-4 border-t">
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Nouveau mot de passe (min 8 caractères)"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Confirmer le mot de passe"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                                <button onClick={handlePasswordChange} disabled={passwordSaving}
                                    className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                                    {passwordSaving ? 'Mise à jour...' : 'Mettre à Jour'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Logout */}
                    <div className="mt-4 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-gray-900">Déconnexion</h4>
                                <p className="text-sm text-gray-500 mt-1">Se déconnecter de votre compte</p>
                            </div>
                            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition text-sm">
                                Se Déconnecter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
