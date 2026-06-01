-- ============================================
-- ATTENDANCE / PRESENCE TRACKING SYSTEM
-- ============================================

-- Attendance Seances table (S1-S7 for each semester)
CREATE TABLE IF NOT EXISTS attendance_seance (
  id BIGSERIAL PRIMARY KEY,
  faculty TEXT NOT NULL,
  year_study INTEGER NOT NULL,
  session TEXT NOT NULL CHECK (session IN ('intra', 'final')),
  academic_year TEXT NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 7),
  seance_type TEXT NOT NULL DEFAULT 'seance' CHECK (seance_type IN ('seance', 'exam')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(faculty, year_study, session, academic_year, week_number)
);

-- Attendance Day table (D1-D7 for each day of week)
CREATE TABLE IF NOT EXISTS attendance_day (
  id BIGSERIAL PRIMARY KEY,
  seance_id BIGINT NOT NULL REFERENCES attendance_seance(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  date_day DATE NOT NULL,
  day_name TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(seance_id, day_of_week)
);

-- Attendance Records (actual presence/absence)
CREATE TABLE IF NOT EXISTS attendance_record (
  id BIGSERIAL PRIMARY KEY,
  day_id BIGINT NOT NULL REFERENCES attendance_day(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'excused')),
  notes TEXT,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(day_id, student_id)
);

-- Attendance Summary (cached for performance)
CREATE TABLE IF NOT EXISTS attendance_summary (
  id BIGSERIAL PRIMARY KEY,
  seance_id BIGINT NOT NULL REFERENCES attendance_seance(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  total_days INTEGER NOT NULL DEFAULT 0,
  total_present INTEGER NOT NULL DEFAULT 0,
  total_absent INTEGER NOT NULL DEFAULT 0,
  total_excused INTEGER NOT NULL DEFAULT 0,
  percentage_present NUMERIC(5,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(seance_id, student_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_seance_faculty_year ON attendance_seance(faculty, year_study);
CREATE INDEX IF NOT EXISTS idx_attendance_seance_session ON attendance_seance(session, academic_year);
CREATE INDEX IF NOT EXISTS idx_attendance_day_seance ON attendance_day(seance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_day_date ON attendance_day(date_day);
CREATE INDEX IF NOT EXISTS idx_attendance_record_day ON attendance_record(day_id);
CREATE INDEX IF NOT EXISTS idx_attendance_record_student ON attendance_record(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_record_status ON attendance_record(status);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_seance ON attendance_summary(seance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_student ON attendance_summary(student_id);

-- Enable RLS
ALTER TABLE attendance_seance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_day ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_summary ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES FOR ATTENDANCE TABLES
-- ============================================

-- Seances: Staff can manage, students and profs can read
CREATE POLICY "seance_all_staff"
  ON attendance_seance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','editor','administration')
    )
  );

CREATE POLICY "seance_select_prof"
  ON attendance_seance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'prof'
    )
  );

-- Days: Staff can manage, profs can read
CREATE POLICY "day_all_staff"
  ON attendance_day FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','editor','administration')
    )
  );

CREATE POLICY "day_select_prof"
  ON attendance_day FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'prof'
    )
  );

-- Records: Staff can manage, students/profs can read
CREATE POLICY "record_all_staff"
  ON attendance_record FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','editor','administration','prof')
    )
  );

CREATE POLICY "record_select_student"
  ON attendance_record FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT s.id FROM student s
      WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Summary: Staff can manage, students/profs can read
CREATE POLICY "summary_all_staff"
  ON attendance_summary FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','editor','administration','prof')
    )
  );

CREATE POLICY "summary_select_student"
  ON attendance_summary FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT s.id FROM student s
      WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ============================================
-- TRIGGER: Update attendance summary on record change
-- ============================================
CREATE OR REPLACE FUNCTION update_attendance_summary()
RETURNS TRIGGER AS $$
DECLARE
  seance_id BIGINT;
  student_id BIGINT;
  total_days INTEGER;
  total_present INTEGER;
  total_absent INTEGER;
  total_excused INTEGER;
BEGIN
  -- Get seance_id and student_id
  SELECT ad.seance_id, ar.student_id
  INTO seance_id, student_id
  FROM attendance_record ar
  JOIN attendance_day ad ON ad.id = ar.day_id
  WHERE ar.id = NEW.id;

  -- Calculate totals for this seance
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'present'),
    COUNT(*) FILTER (WHERE status = 'absent'),
    COUNT(*) FILTER (WHERE status = 'excused')
  INTO total_days, total_present, total_absent, total_excused
  FROM attendance_record ar
  JOIN attendance_day ad ON ad.id = ar.day_id
  WHERE ad.seance_id = seance_id AND ar.student_id = student_id;

  -- Update or insert summary
  INSERT INTO attendance_summary (seance_id, student_id, total_days, total_present, total_absent, total_excused, percentage_present)
  VALUES (seance_id, student_id, total_days, total_present, total_absent, total_excused,
    CASE WHEN total_days > 0 THEN (total_present::NUMERIC / total_days * 100) ELSE 0 END)
  ON CONFLICT (seance_id, student_id)
  DO UPDATE SET
    total_days = total_days,
    total_present = total_present,
    total_absent = total_absent,
    total_excused = total_excused,
    percentage_present = CASE WHEN total_days > 0 THEN (total_present::NUMERIC / total_days * 100) ELSE 0 END,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_summary_on_record_change
AFTER INSERT OR UPDATE ON attendance_record
FOR EACH ROW
EXECUTE FUNCTION update_attendance_summary();

