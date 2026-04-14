'use client'
import { supabase } from "@/app/component/db"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFaculties } from "@/app/component/student-infos/useFaculties"
import type { OnlineExam, ExamQuestion, ExamAnswerOption } from "@/app/component/exam/types"

// ============ Question Form Component ============
function QuestionForm({
  question,
  index,
  onUpdate,
  onRemove,
}: {
  question: { text: string; marks: number; options: { text: string; is_correct: boolean }[] }
  index: number
  onUpdate: (q: typeof question) => void
  onRemove: () => void
}) {
  const addOption = () => {
    onUpdate({ ...question, options: [...question.options, { text: '', is_correct: false }] })
  }

  const removeOption = (oi: number) => {
    onUpdate({ ...question, options: question.options.filter((_, i) => i !== oi) })
  }

  const updateOption = (oi: number, field: string, value: string | boolean) => {
    const opts = [...question.options]
    if (field === 'is_correct') {
      // Only one correct answer
      opts.forEach((o, i) => { o.is_correct = i === oi })
    } else {
      opts[oi] = { ...opts[oi], [field]: value }
    }
    onUpdate({ ...question, options: opts })
  }

  return (
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h4 className="font-semibold text-gray-800">Question {index + 1}</h4>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Points:</label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={question.marks}
            onChange={e => onUpdate({ ...question, marks: parseFloat(e.target.value) || 1 })}
            className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center"
          />
          <button onClick={onRemove} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      <textarea
        value={question.text}
        onChange={e => onUpdate({ ...question, text: e.target.value })}
        placeholder="Texte de la question..."
        rows={2}
        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 mb-4 resize-none"
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-600">Options (cochez la bonne réponse) :</p>
        {question.options.map((opt, oi) => (
          <div key={oi} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct-${index}`}
              checked={opt.is_correct}
              onChange={() => updateOption(oi, 'is_correct', true)}
              className="w-4 h-4 text-green-600"
            />
            <input
              type="text"
              value={opt.text}
              onChange={e => updateOption(oi, 'text', e.target.value)}
              placeholder={`Option ${oi + 1}`}
              className={`flex-1 px-3 py-2 border-2 rounded-lg text-sm focus:outline-none transition-colors ${
                opt.is_correct ? 'border-green-400 bg-green-50' : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            {question.options.length > 2 && (
              <button onClick={() => removeOption(oi)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {question.options.length < 6 && (
          <button onClick={addOption} className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1">
            + Ajouter une option
          </button>
        )}
      </div>
    </div>
  )
}

// ============ Main Page ============
export default function CreateExamPage() {
  const router = useRouter()
  const { facultyNames } = useFaculties()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [courses, setCourses] = useState<{ courses: string; faculty: string }[]>([])

  // Exam metadata
  const [exam, setExam] = useState({
    title: '',
    description: '',
    faculty: '',
    year_study: 1,
    matiere: '',
    session: 1,
    duration_minutes: 60,
    pass_mark: 50,
    instructions: '',
    randomize_questions: true,
    shuffle_answers: true,
    allow_back_nav: true,
    max_tab_switches: 3,
    start_date: '',
    end_date: '',
  })

  // Questions
  const [questions, setQuestions] = useState<
    { text: string; marks: number; options: { text: string; is_correct: boolean }[] }[]
  >([])

  useEffect(() => {
    supabase.from('course_program').select('courses, faculty').then(({ data }) => {
      if (data) setCourses(data)
    })
  }, [])

  const filteredCourses = exam.faculty
    ? [...new Set(courses.filter(c => c.faculty === exam.faculty).map(c => c.courses))]
    : []

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      text: '',
      marks: 1,
      options: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ],
    }])
  }

  const updateQuestion = (idx: number, q: typeof questions[0]) => {
    setQuestions(prev => prev.map((p, i) => i === idx ? q : p))
  }

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  const validate = (): string | null => {
    if (!exam.title.trim()) return 'Le titre est requis'
    if (!exam.faculty) return 'La faculté est requise'
    if (!exam.matiere) return 'La matière est requise'
    if (questions.length === 0) return 'Ajoutez au moins une question'
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) return `La question ${i + 1} est vide`
      if (q.options.filter(o => o.text.trim()).length < 2) return `La question ${i + 1} doit avoir au moins 2 options`
      if (!q.options.some(o => o.is_correct)) return `La question ${i + 1} n'a pas de bonne réponse`
      if (!q.options.find(o => o.is_correct)?.text.trim()) return `La bonne réponse de la question ${i + 1} est vide`
    }
    return null
  }

  const handleSave = async (publish: boolean) => {
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)

      // 1. Create the exam
      const { data: examData, error: examErr } = await supabase
        .from('online_exam')
        .insert({
          title: exam.title.trim(),
          description: exam.description.trim() || null,
          faculty: exam.faculty,
          year_study: exam.year_study,
          matiere: exam.matiere,
          session: exam.session,
          duration_minutes: exam.duration_minutes,
          pass_mark: exam.pass_mark,
          total_marks: totalMarks,
          instructions: exam.instructions.trim() || null,
          is_published: publish,
          randomize_questions: exam.randomize_questions,
          shuffle_answers: exam.shuffle_answers,
          allow_back_nav: exam.allow_back_nav,
          max_tab_switches: exam.max_tab_switches,
          start_date: exam.start_date || null,
          end_date: exam.end_date || null,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (examErr) throw examErr
      const examId = examData.id

      // 2. Create questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        const { data: qData, error: qErr } = await supabase
          .from('exam_question')
          .insert({
            exam_id: examId,
            question_text: q.text.trim(),
            question_order: i + 1,
            marks: q.marks,
          })
          .select('id')
          .single()

        if (qErr) throw qErr

        // 3. Create answer options
        const validOptions = q.options.filter(o => o.text.trim())
        const { error: optErr } = await supabase
          .from('exam_answer_option')
          .insert(
            validOptions.map((o, oi) => ({
              question_id: qData.id,
              option_text: o.text.trim(),
              is_correct: o.is_correct,
              option_order: oi + 1,
            }))
          )

        if (optErr) throw optErr
      }

      router.push('/admin/exam')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-blue-600 mb-2 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Retour
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Créer un Examen en Ligne</h1>
        <p className="text-gray-600 mt-1">Définissez l&apos;examen, ajoutez des questions et publiez</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
      )}

      {/* Exam Metadata */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de l&apos;examen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              type="text"
              value={exam.title}
              onChange={e => setExam(p => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Examen Final - Algorithmique"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Faculté *</label>
            <select
              value={exam.faculty}
              onChange={e => setExam(p => ({ ...p, faculty: e.target.value, matiere: '' }))}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Sélectionner...</option>
              {facultyNames.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
            <select
              value={exam.matiere}
              onChange={e => setExam(p => ({ ...p, matiere: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Sélectionner...</option>
              {filteredCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Année d&apos;étude</label>
            <select
              value={exam.year_study}
              onChange={e => setExam(p => ({ ...p, year_study: parseInt(e.target.value) }))}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>Année {y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
            <select
              value={exam.session}
              onChange={e => setExam(p => ({ ...p, session: parseInt(e.target.value) }))}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value={1}>Session 1</option>
              <option value={2}>Session 2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durée (minutes)</label>
            <input
              type="number"
              min="5"
              max="300"
              value={exam.duration_minutes}
              onChange={e => setExam(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 60 }))}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note de passage (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={exam.pass_mark}
              onChange={e => setExam(p => ({ ...p, pass_mark: parseFloat(e.target.value) || 50 }))}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input
              type="datetime-local"
              value={exam.start_date}
              onChange={e => setExam(p => ({ ...p, start_date: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
            <input
              type="datetime-local"
              value={exam.end_date}
              onChange={e => setExam(p => ({ ...p, end_date: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={exam.description}
              onChange={e => setExam(p => ({ ...p, description: e.target.value }))}
              placeholder="Description de l'examen..."
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions pour les étudiants</label>
            <textarea
              value={exam.instructions}
              onChange={e => setExam(p => ({ ...p, instructions: e.target.value }))}
              placeholder="Lisez toutes les questions avant de commencer..."
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Settings */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Paramètres de sécurité</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={exam.randomize_questions}
                onChange={e => setExam(p => ({ ...p, randomize_questions: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-600"
              />
              Mélanger les questions
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={exam.shuffle_answers}
                onChange={e => setExam(p => ({ ...p, shuffle_answers: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-600"
              />
              Mélanger les réponses
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={exam.allow_back_nav}
                onChange={e => setExam(p => ({ ...p, allow_back_nav: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-600"
              />
              Navigation arrière
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <label>Max changements d&apos;onglet:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={exam.max_tab_switches}
                onChange={e => setExam(p => ({ ...p, max_tab_switches: parseInt(e.target.value) || 3 }))}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Questions ({questions.length})
            {questions.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                Total: {questions.reduce((s, q) => s + q.marks, 0)} points
              </span>
            )}
          </h2>
          <button
            onClick={addQuestion}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Ajouter une question
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 opacity-50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-lg font-medium">Aucune question ajoutée</p>
            <p className="text-sm mt-1">Cliquez sur &quot;Ajouter une question&quot; pour commencer</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, i) => (
              <QuestionForm
                key={i}
                question={q}
                index={i}
                onUpdate={updated => updateQuestion(i, updated)}
                onRemove={() => removeQuestion(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="flex-1 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder (Brouillon)'}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Publication...' : 'Publier l\'examen'}
        </button>
      </div>
    </div>
  )
}
