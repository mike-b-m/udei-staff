-- ============================================
-- LESSON / COURSE CONTENT SYSTEM
-- ============================================

-- Main lessons table
CREATE TABLE IF NOT EXISTS lesson (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  faculty TEXT NOT NULL,
  matiere TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT 1,
  lesson_type TEXT NOT NULL DEFAULT 'lesson' CHECK (lesson_type IN ('lesson','lecture','video','quiz','audio')),
  youtube_url TEXT,
  duration_minutes INTEGER,
  material_url TEXT,
  thumbnail_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Student progress tracking
CREATE TABLE IF NOT EXISTS lesson_progress (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  lesson_id BIGINT NOT NULL REFERENCES lesson(id) ON DELETE CASCADE,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  completed BOOLEAN NOT NULL DEFAULT false,
  last_position_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, lesson_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lesson_faculty ON lesson(faculty);
CREATE INDEX IF NOT EXISTS idx_lesson_matiere ON lesson(matiere);
CREATE INDEX IF NOT EXISTS idx_lesson_year ON lesson(year);
CREATE INDEX IF NOT EXISTS idx_lesson_type ON lesson(lesson_type);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- RLS
ALTER TABLE lesson ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Lessons: anyone authenticated can read published lessons
CREATE POLICY "lesson_select_auth"
  ON lesson FOR SELECT
  TO authenticated
  USING (is_published = true OR auth.uid() = created_by);

-- Lessons: admin/editor can manage
CREATE POLICY "lesson_modify_admin"
  ON lesson FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','editor','prof')
    )
  );

-- Progress: students can manage their own progress
CREATE POLICY "progress_select_own"
  ON lesson_progress FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT s.id FROM student s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "progress_insert_own"
  ON lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT s.id FROM student s
      WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "progress_update_own"
  ON lesson_progress FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT s.id FROM student s
      WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Admin can see all progress
CREATE POLICY "progress_admin_all"
  ON lesson_progress FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','editor')
    )
  );

-- Updated_at trigger for lessons
CREATE OR REPLACE FUNCTION update_lesson_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lesson_updated_at
  BEFORE UPDATE ON lesson
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_updated_at();
