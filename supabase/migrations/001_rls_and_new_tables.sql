-- ============================================
-- UDEI Row-Level Security & New Tables
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================

-- ============================================
-- STEP 1: Enable RLS on all existing tables
-- ============================================
ALTER TABLE student ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_price ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spent_in_company ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Helper function to check user role
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- STEP 3: Profiles policies
-- ============================================
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (public.get_user_role() IN ('admin', 'administration'));

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'administration'));

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- STEP 4: Student table policies
-- ============================================
CREATE POLICY "student_all_staff"
  ON student FOR ALL
  USING (public.get_user_role() IN ('admin', 'administration', 'editor'));

CREATE POLICY "student_select_prof"
  ON student FOR SELECT
  USING (public.get_user_role() = 'prof');

CREATE POLICY "student_select_own"
  ON student FOR SELECT
  USING (
    email = public.get_auth_email()
  );

-- ============================================
-- STEP 5: Student status policies
-- ============================================
CREATE POLICY "student_status_all_staff"
  ON student_status FOR ALL
  USING (public.get_user_role() IN ('admin', 'administration', 'editor'));

CREATE POLICY "student_status_select_prof"
  ON student_status FOR SELECT
  USING (public.get_user_role() = 'prof');

-- ============================================
-- STEP 6: Student payment policies
-- ============================================
CREATE POLICY "student_payment_all_staff"
  ON student_payment FOR ALL
  USING (public.get_user_role() IN ('admin', 'administration', 'editor'));

CREATE POLICY "student_payment_select_prof"
  ON student_payment FOR SELECT
  USING (public.get_user_role() = 'prof');

-- ============================================
-- STEP 7: Faculty price policies
-- ============================================
CREATE POLICY "faculty_price_select_auth"
  ON faculty_price FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "faculty_price_modify_admin"
  ON faculty_price FOR ALL
  USING (public.get_user_role() IN ('admin', 'administration'));

-- ============================================
-- STEP 8: Exam (grades) policies
-- ============================================
CREATE POLICY "exam_all_staff"
  ON exam FOR ALL
  USING (public.get_user_role() IN ('admin', 'administration', 'editor', 'prof'));

CREATE POLICY "exam_select_student"
  ON exam FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM student
      WHERE email = public.get_auth_email()
    )
  );

-- ============================================
-- STEP 9: Course program policies
-- ============================================
CREATE POLICY "course_program_select_auth"
  ON course_program FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "course_program_modify_admin"
  ON course_program FOR ALL
  USING (public.get_user_role() IN ('admin', 'administration'));

-- ============================================
-- STEP 10: Expense policies
-- ============================================
CREATE POLICY "spent_all_admin"
  ON spent_in_company FOR ALL
  USING (public.get_user_role() IN ('admin', 'administration'));

CREATE POLICY "spent_select_editor"
  ON spent_in_company FOR SELECT
  USING (public.get_user_role() = 'editor');

-- ============================================
-- NEW TABLE: audit_logs
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_only"
  ON audit_logs FOR SELECT
  USING (public.get_user_role() IN ('admin', 'administration'));

CREATE POLICY "audit_logs_insert_auth"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- NEW TABLE: semesters
-- ============================================
CREATE TABLE IF NOT EXISTS semesters (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "semesters_select_auth"
  ON semesters FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "semesters_modify_admin"
  ON semesters FOR ALL
  USING (public.get_user_role() IN ('admin', 'administration'));

-- ============================================
-- NEW TABLE: enrollments
-- ============================================
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES student(id) ON DELETE CASCADE,
  semester_id INTEGER REFERENCES semesters(id),
  faculty TEXT NOT NULL,
  year_study INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(student_id, semester_id)
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_all_staff"
  ON enrollments FOR ALL
  USING (public.get_user_role() IN ('admin', 'administration', 'editor'));

CREATE POLICY "enrollments_select_prof"
  ON enrollments FOR SELECT
  USING (public.get_user_role() = 'prof');

CREATE POLICY "enrollments_select_own"
  ON enrollments FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM student
      WHERE email = public.get_auth_email()
    )
  );

-- ============================================
-- NEW TABLE: invoices
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES student(id) ON DELETE CASCADE,
  semester_id INTEGER REFERENCES semesters(id),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_all_staff"
  ON invoices FOR ALL
  USING (public.get_user_role() IN ('admin', 'administration', 'editor'));

CREATE POLICY "invoices_select_own"
  ON invoices FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM student
      WHERE email = public.get_auth_email()
    )
  );

