'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/app/component/db'
import { FACULTIES } from '@/app/component/student-infos/constants'
import VideoPlayer from '@/app/component/video-player/video-player'

interface Lesson {
  id: number
  title: string
  description: string
  content: string
  faculty: string
  matiere: string
  year: number
  lesson_type: 'lesson' | 'lecture' | 'video' | 'quiz' | 'audio'
  youtube_url: string
  duration_minutes: number
  material_url: string
  thumbnail_url: string
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

const LESSON_TYPES = [
  { value: 'lesson', label: 'Leçon', icon: '📖', color: 'bg-blue-100 text-blue-700' },
  { value: 'lecture', label: 'Cours Magistral', icon: '🎓', color: 'bg-purple-100 text-purple-700' },
  { value: 'video', label: 'Vidéo', icon: '🎬', color: 'bg-red-100 text-red-700' },
  { value: 'quiz', label: 'Quiz', icon: '📝', color: 'bg-green-100 text-green-700' },
  { value: 'audio', label: 'Audio', icon: '🎧', color: 'bg-orange-100 text-orange-700' },
]

type LessonType = 'lesson' | 'video';

const EMPTY_FORM = {
  title: '',
  description: '',
  content: '',
  faculty: '',
  matiere: '',
  year: 1,
  lesson_type: 'lesson' as LessonType,
  youtube_url: '',
  duration_minutes: 0,
  material_url: '',
  is_published: false,
  sort_order: 0,
}

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [previewVideo, setPreviewVideo] = useState<string | null>(null)

  // Filters
  const [filterFaculty, setFilterFaculty] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterMatiere, setFilterMatiere] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Matieres based on selected faculty (from course_program)
  const [matieres, setMatieres] = useState<string[]>([])

  useEffect(() => {
    loadLessons()
  }, [filterFaculty, filterType, filterYear])

  useEffect(() => {
    if (form.faculty) loadMatieres(form.faculty)
  }, [form.faculty])

  useEffect(() => {
    if (filterFaculty) loadMatieres(filterFaculty)
  }, [filterFaculty])

  const loadLessons = async () => {
    setLoading(true)
    let query = supabase.from('lesson').select('*').order('sort_order').order('created_at', { ascending: false })
    if (filterFaculty) query = query.eq('faculty', filterFaculty)
    if (filterType) query = query.eq('lesson_type', filterType)
    if (filterYear) query = query.eq('year', parseInt(filterYear))
    if (filterMatiere) query = query.ilike('matiere', `%${filterMatiere}%`)

    const { data, error } = await query
    if (error) console.error(error)
    else setLessons(data || [])
    setLoading(false)
  }

  const loadMatieres = async (faculty: string) => {
    const { data } = await supabase
      .from('course_program')
      .select('courses')
      .eq('faculty', faculty)
    if (data) {
      const unique = [...new Set(data.map(d => d.courses))]
      setMatieres(unique)
    }
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.faculty || !form.matiere) {
      setError('Veuillez remplir le titre, la faculté et la matière')
      return
    }
    if (form.lesson_type === 'video' && !form.youtube_url) {
      setError('Veuillez fournir un lien YouTube pour les vidéos')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      title: form.title,
      description: form.description,
      content: form.content,
      faculty: form.faculty,
      matiere: form.matiere,
      year: form.year,
      lesson_type: form.lesson_type,
      youtube_url: form.youtube_url || null,
      duration_minutes: form.duration_minutes || null,
      material_url: form.material_url || null,
      is_published: form.is_published,
      sort_order: form.sort_order,
    }

    if (editingId) {
      const { error: updateError } = await supabase.from('lesson').update(payload).eq('id', editingId)
      if (updateError) setError(updateError.message)
      else {
        setMessage('Leçon mise à jour avec succès!')
        resetForm()
        loadLessons()
      }
    } else {
      const { error: insertError } = await supabase.from('lesson').insert([payload])
      if (insertError) setError(insertError.message)
      else {
        setMessage('Leçon créée avec succès!')
        resetForm()
        loadLessons()
      }
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 5000)
  }

  const handleEdit = (lesson: Lesson) => {
    setForm({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      faculty: lesson.faculty,
      matiere: lesson.matiere,
      year: lesson.year,
      lesson_type: lesson.lesson_type as LessonType,
      youtube_url: lesson.youtube_url || '',
      duration_minutes: lesson.duration_minutes || 0,
      material_url: lesson.material_url || '',
      is_published: lesson.is_published,
      sort_order: lesson.sort_order,
    })
    setEditingId(lesson.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: number) => {
    setDeleting(true)
    const { error } = await supabase.from('lesson').delete().eq('id', id)
    if (error) setError(error.message)
    else {
      setMessage('Leçon supprimée')
      loadLessons()
    }
    setDeleting(false)
    setDeleteConfirm(null)
    setTimeout(() => setMessage(''), 5000)
  }

  const togglePublish = async (id: number, currentState: boolean) => {
    const { error } = await supabase.from('lesson').update({ is_published: !currentState }).eq('id', id)
    if (!error) loadLessons()
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const handleMaterialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 50MB)')
      return
    }

    const fileName = `lesson_material_${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage.from('lessons').upload(fileName, file)
    if (uploadError) {
      setError('Erreur upload: ' + uploadError.message)
      return
    }
    const { data: urlData } = supabase.storage.from('lessons').getPublicUrl(fileName)
    setForm(prev => ({ ...prev, material_url: urlData.publicUrl }))
    setMessage('Fichier téléchargé avec succès')
    setTimeout(() => setMessage(''), 3000)
  }

  const typeInfo = (type: string) => LESSON_TYPES.find(t => t.value === type) || LESSON_TYPES[0]

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Gestion des Cours</h1>
            <p className="text-gray-600 mt-1">Créez et gérez les leçons, vidéos, quiz et matériels pédagogiques</p>
          </div>
          <button
            onClick={() => { showForm ? resetForm() : setShowForm(true) }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 ${
              showForm ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {showForm ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Fermer
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nouvelle Leçon
              </>
            )}
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center justify-between">
            <span className="font-medium">{message}</span>
            <button onClick={() => setMessage('')} className="font-bold">✕</button>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center justify-between">
            <span className="font-medium">{error}</span>
            <button onClick={() => setError('')} className="font-bold">✕</button>
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Modifier la Leçon' : 'Créer une Nouvelle Leçon'}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Row 1: Basic info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Titre *</label>
                  <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Titre de la leçon" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type *</label>
                  <select value={form.lesson_type} onChange={e => setForm({ ...form, lesson_type: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    {LESSON_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Faculty, Matiere, Year */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Faculté *</label>
                  <select value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value, matiere: '' })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    <option value="">-- Sélectionner --</option>
                    {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Matière *</label>
                  <select value={form.matiere} onChange={e => setForm({ ...form, matiere: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    <option value="">-- Sélectionner --</option>
                    {matieres.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {form.faculty && matieres.length === 0 && (
                    <input type="text" value={form.matiere} onChange={e => setForm({ ...form, matiere: e.target.value })}
                      className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Saisir la matière manuellement" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Année</label>
                  <select value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y}ère/ème année</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description courte</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-y"
                  rows={2} placeholder="Brève description de la leçon" />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contenu de la leçon</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-y font-mono text-sm"
                  rows={8} placeholder="Contenu détaillé de la leçon (supporte le texte formaté)" />
              </div>

              {/* Video section (shown for video type) */}
              {form.lesson_type === 'video' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-4">
                  <h3 className="font-bold text-red-800 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
                    </svg>
                    Vidéo YouTube
                  </h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lien YouTube *</label>
                    <input type="url" value={form.youtube_url} onChange={e => setForm({ ...form, youtube_url: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                      placeholder="https://www.youtube.com/watch?v=..." />
                    <p className="text-xs text-gray-500 mt-1">Le lien sera protégé: les étudiants ne pourront pas le copier ni voir le logo YouTube</p>
                  </div>
                  {form.youtube_url && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Aperçu:</p>
                      <div className="max-w-2xl">
                        <VideoPlayer youtubeUrl={form.youtube_url} title={form.title || 'Aperçu'} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Duration & Material */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Durée (minutes)</label>
                  <input type="number" value={form.duration_minutes || ''} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="0" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ordre d&apos;affichage</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="0" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Matériel pédagogique</label>
                  <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm text-gray-600">{form.material_url ? 'Remplacer le fichier' : 'Télécharger (PDF, DOC, etc.)'}</span>
                    <input type="file" onChange={handleMaterialUpload} className="hidden" />
                  </label>
                  {form.material_url && (
                    <p className="text-xs text-green-600 mt-1 truncate">✓ Fichier téléchargé</p>
                  )}
                </div>
              </div>

              {/* Publish toggle + Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })}
                      className="sr-only peer" />
                    <div className="w-12 h-6 bg-gray-300 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-all"></div>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-6"></div>
                  </div>
                  <span className="font-semibold text-gray-700">
                    {form.is_published ? 'Publié (visible aux étudiants)' : 'Brouillon (non visible)'}
                  </span>
                </label>
                <div className="flex gap-3">
                  <button onClick={resetForm}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition">
                    Annuler
                  </button>
                  <button onClick={handleSubmit} disabled={saving}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 shadow-lg">
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enregistrement...
                      </>
                    ) : editingId ? 'Mettre à Jour' : 'Créer la Leçon'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 mb-6 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              Filtrer
              <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <span className="text-sm text-gray-600 font-medium">{lessons.length} leçon(s) trouvée(s)</span>
          </div>

          {/* Active filter tags */}
          {(filterFaculty || filterType || filterYear) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filterFaculty && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {filterFaculty}
                  <button onClick={() => setFilterFaculty('')} className="font-bold">✕</button>
                </span>
              )}
              {filterType && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {typeInfo(filterType).label}
                  <button onClick={() => setFilterType('')} className="font-bold">✕</button>
                </span>
              )}
              {filterYear && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Année {filterYear}
                  <button onClick={() => setFilterYear('')} className="font-bold">✕</button>
                </span>
              )}
            </div>
          )}

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculté</label>
                <select value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
                  <option value="">-- Toutes --</option>
                  {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
                  <option value="">-- Tous --</option>
                  {LESSON_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
                  <option value="">-- Toutes --</option>
                  {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y}ère/ème année</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
                <input type="text" value={filterMatiere} onChange={e => setFilterMatiere(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Rechercher..." />
              </div>
              <div className="md:col-span-2 lg:col-span-4 flex gap-3">
                <button onClick={() => loadLessons()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                  Appliquer
                </button>
                <button onClick={() => { setFilterFaculty(''); setFilterType(''); setFilterYear(''); setFilterMatiere('') }}
                  className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-medium">
                  Réinitialiser
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lessons Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-md p-4 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-md">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">Aucune leçon trouvée</p>
            <p className="text-gray-400 mt-1">Créez votre première leçon pour commencer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map(lesson => {
              const ti = typeInfo(lesson.lesson_type)
              return (
                <div key={lesson.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
                  {/* Thumbnail / Type indicator */}
                  <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                    {lesson.lesson_type === 'video' && lesson.youtube_url ? (
                      <div className="w-full h-full cursor-pointer" onClick={() => setPreviewVideo(previewVideo === lesson.youtube_url ? null : lesson.youtube_url)}>
                        <img
                          src={`https://img.youtube.com/vi/${lesson.youtube_url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] || ''}/mqdefault.jpg`}
                          alt={lesson.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-14 h-14 bg-blue-600/90 rounded-full flex items-center justify-center">
                            <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-6xl">{ti.icon}</span>
                    )}
                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${lesson.is_published ? 'bg-green-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
                        {lesson.is_published ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ti.color}`}>
                        {ti.icon} {ti.label}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">{lesson.title}</h3>
                    {lesson.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">{lesson.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">{lesson.faculty}</span>
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md font-medium">{lesson.matiere}</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">Année {lesson.year}</span>
                      {lesson.duration_minutes > 0 && (
                        <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md font-medium">{lesson.duration_minutes} min</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      <button onClick={() => handleEdit(lesson)}
                        className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-medium text-sm transition flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                        Modifier
                      </button>
                      <button onClick={() => togglePublish(lesson.id, lesson.is_published)}
                        className={`flex-1 py-2 rounded-lg font-medium text-sm transition flex items-center justify-center gap-1 ${
                          lesson.is_published ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' : 'bg-green-50 hover:bg-green-100 text-green-700'
                        }`}>
                        {lesson.is_published ? 'Dépublier' : 'Publier'}
                      </button>
                      <button onClick={() => setDeleteConfirm(lesson.id)}
                        className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Video Preview Modal */}
        {previewVideo && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setPreviewVideo(null)}>
            <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-end mb-2">
                <button onClick={() => setPreviewVideo(null)} className="text-white hover:text-red-400 transition">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <VideoPlayer youtubeUrl={previewVideo} title="Aperçu" />
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm !== null && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer cette leçon ?</h3>
                <p className="text-gray-600 mb-6">Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)} disabled={deleting}
                    className="flex-1 px-4 py-3 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50">
                    Annuler
                  </button>
                  <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting}
                    className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50">
                    {deleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
