// Shared types for the online exam system

export interface OnlineExam {
  id: number
  title: string
  description: string | null
  faculty: string
  year_study: number
  matiere: string
  session: number
  duration_minutes: number
  pass_mark: number
  total_marks: number
  instructions: string | null
  is_published: boolean
  randomize_questions: boolean
  shuffle_answers: boolean
  allow_back_nav: boolean
  max_tab_switches: number
  start_date: string | null
  end_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ExamQuestion {
  id: number
  exam_id: number
  question_text: string
  question_order: number
  marks: number
  created_at: string
  options?: ExamAnswerOption[]
}

export interface ExamAnswerOption {
  id: number
  question_id: number
  option_text: string
  is_correct: boolean
  option_order: number
}

export interface ExamAttempt {
  id: number
  exam_id: number
  student_id: number
  start_time: string
  end_time: string | null
  submitted_at: string | null
  final_score: number | null
  status: 'in_progress' | 'submitted' | 'graded' | 'abandoned'
  tab_switch_count: number
  fullscreen_exit_count: number
  suspicion_score: number
  flagged_for_review: boolean
  created_at: string
  online_exam?: OnlineExam
  student?: { first_name: string; last_name: string; student_code: string; faculty: string }
}

export interface ExamAttemptAnswer {
  id: number
  attempt_id: number
  question_id: number
  selected_option_id: number | null
  is_correct: boolean | null
  awarded_marks: number | null
  answered_at: string
}

export interface ExamEventLog {
  id: number
  attempt_id: number
  event_type: 'tab_switch' | 'fullscreen_exit' | 'copy_paste' | 'right_click' | 'warning_shown' | 'force_submit'
  severity: 'info' | 'warning' | 'critical'
  details: string | null
  created_at: string
}
