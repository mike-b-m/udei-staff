-- ============================================
-- UDEI Migration 004: Fix "permission denied for table users"
-- The auth.users table is not readable by the authenticated role.
-- Fix: create a SECURITY DEFINER function to get the current user's email,
-- then update all RLS policies to use it instead of querying auth.users directly.
-- ============================================

-- ============================================
-- STEP 1: Create helper function (runs as superuser)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- STEP 2: Drop and recreate affected policies in migration 001
-- ============================================

-- student_select_own
DROP POLICY IF EXISTS "student_select_own" ON student;
CREATE POLICY "student_select_own"
  ON student FOR SELECT
  USING (
    email = public.get_auth_email()
  );

-- exam_select_student
DROP POLICY IF EXISTS "exam_select_student" ON exam;
CREATE POLICY "exam_select_student"
  ON exam FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM student WHERE email = public.get_auth_email()
    )
  );

-- enrollments_select_own
DROP POLICY IF EXISTS "enrollments_select_own" ON enrollments;
CREATE POLICY "enrollments_select_own"
  ON enrollments FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM student WHERE email = public.get_auth_email()
    )
  );

-- invoices_select_own
DROP POLICY IF EXISTS "invoices_select_own" ON invoices;
CREATE POLICY "invoices_select_own"
  ON invoices FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM student WHERE email = public.get_auth_email()
    )
  );

-- ============================================
-- STEP 3: Drop and recreate affected policies in migration 002
-- ============================================

-- homework_submission_select_own
DROP POLICY IF EXISTS "homework_submission_select_own" ON homework_submission;
CREATE POLICY "homework_submission_select_own"
  ON homework_submission FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM student WHERE email = public.get_auth_email()
    )
  );

-- homework_submission_insert_own
DROP POLICY IF EXISTS "homework_submission_insert_own" ON homework_submission;
CREATE POLICY "homework_submission_insert_own"
  ON homework_submission FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM student WHERE email = public.get_auth_email()
    )
  );

-- exam_1_select_student
DROP POLICY IF EXISTS "exam_1_select_student" ON exam_1;
CREATE POLICY "exam_1_select_student"
  ON exam_1 FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM student WHERE email = public.get_auth_email()
    )
  );

-- ============================================
-- STEP 4: Drop and recreate affected policies in migration 003
-- ============================================

-- exam_attempt_select_own
DROP POLICY IF EXISTS "exam_attempt_select_own" ON exam_attempt;
CREATE POLICY "exam_attempt_select_own"
  ON exam_attempt FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM student WHERE email = public.get_auth_email()
    )
  );

-- exam_attempt_insert_own
DROP POLICY IF EXISTS "exam_attempt_insert_own" ON exam_attempt;
CREATE POLICY "exam_attempt_insert_own"
  ON exam_attempt FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM student WHERE email = public.get_auth_email()
    )
  );

-- exam_attempt_update_own
DROP POLICY IF EXISTS "exam_attempt_update_own" ON exam_attempt;
CREATE POLICY "exam_attempt_update_own"
  ON exam_attempt FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM student WHERE email = public.get_auth_email()
    )
  );

-- exam_attempt_answer_select_own
DROP POLICY IF EXISTS "exam_attempt_answer_select_own" ON exam_attempt_answer;
CREATE POLICY "exam_attempt_answer_select_own"
  ON exam_attempt_answer FOR SELECT
  USING (
    attempt_id IN (
      SELECT ea.id FROM exam_attempt ea
      JOIN student s ON s.id = ea.student_id
      WHERE s.email = public.get_auth_email()
    )
  );

-- exam_attempt_answer_insert_own
DROP POLICY IF EXISTS "exam_attempt_answer_insert_own" ON exam_attempt_answer;
CREATE POLICY "exam_attempt_answer_insert_own"
  ON exam_attempt_answer FOR INSERT
  WITH CHECK (
    attempt_id IN (
      SELECT ea.id FROM exam_attempt ea
      JOIN student s ON s.id = ea.student_id
      WHERE s.email = public.get_auth_email()
    )
  );

-- exam_attempt_answer_update_own
DROP POLICY IF EXISTS "exam_attempt_answer_update_own" ON exam_attempt_answer;
CREATE POLICY "exam_attempt_answer_update_own"
  ON exam_attempt_answer FOR UPDATE
  USING (
    attempt_id IN (
      SELECT ea.id FROM exam_attempt ea
      JOIN student s ON s.id = ea.student_id
      WHERE s.email = public.get_auth_email()
    )
  );

-- exam_event_log_insert_own
DROP POLICY IF EXISTS "exam_event_log_insert_own" ON exam_event_log;
CREATE POLICY "exam_event_log_insert_own"
  ON exam_event_log FOR INSERT
  WITH CHECK (
    attempt_id IN (
      SELECT ea.id FROM exam_attempt ea
      JOIN student s ON s.id = ea.student_id
      WHERE s.email = public.get_auth_email()
    )
  );
