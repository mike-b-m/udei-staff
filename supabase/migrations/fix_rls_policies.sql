-- ============================================================
-- FIX 1: Drop policies that touch auth.users directly
-- and replace them with safer versions using auth.uid() only
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS "seance_all_staff"      ON attendance_seance;
DROP POLICY IF EXISTS "seance_select_prof"    ON attendance_seance;
DROP POLICY IF EXISTS "day_all_staff"         ON attendance_day;
DROP POLICY IF EXISTS "day_select_prof"       ON attendance_day;
DROP POLICY IF EXISTS "record_all_staff"      ON attendance_record;
DROP POLICY IF EXISTS "record_select_student" ON attendance_record;
DROP POLICY IF EXISTS "summary_all_staff"     ON attendance_summary;
DROP POLICY IF EXISTS "summary_select_student" ON attendance_summary;

-- ── attendance_seance ──────────────────────────────────────
-- Full access for admin/editor/administration/prof
CREATE POLICY "seance_staff_all"
  ON attendance_seance FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid())
    IN ('admin','editor','administration','prof')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid())
    IN ('admin','editor','administration','prof')
  );

-- ── attendance_day ─────────────────────────────────────────
CREATE POLICY "day_staff_all"
  ON attendance_day FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid())
    IN ('admin','editor','administration','prof')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid())
    IN ('admin','editor','administration','prof')
  );

-- ── attendance_record ──────────────────────────────────────
-- Staff: full access
CREATE POLICY "record_staff_all"
  ON attendance_record FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid())
    IN ('admin','editor','administration','prof')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid())
    IN ('admin','editor','administration','prof')
  );

-- Students: read their own records only
-- Uses student.email matched to auth email — avoids touching auth.users directly
CREATE POLICY "record_student_select"
  ON attendance_record FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM student
      WHERE student_code = (
        SELECT email FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ── attendance_summary ─────────────────────────────────────
CREATE POLICY "summary_staff_all"
  ON attendance_summary FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid())
    IN ('admin','editor','administration','prof')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid())
    IN ('admin','editor','administration','prof')
  );

-- ============================================================
-- FIX 2: Remove auth.users FK from attendance tables
-- (the confirmed_by column caused the permission denied)
-- ============================================================

-- Drop the FK constraint on confirmed_by in attendance_record
ALTER TABLE attendance_record
  DROP CONSTRAINT IF EXISTS attendance_record_confirmed_by_fkey;

-- Drop the FK constraint on created_by in attendance_seance
ALTER TABLE attendance_seance
  DROP CONSTRAINT IF EXISTS attendance_seance_created_by_fkey;

-- Keep the columns but make them plain UUID (no FK)
-- This means confirmed_by still stores who confirmed, just no referential integrity
-- which avoids the permission check on auth.users

-- ============================================================
-- FIX 3: Fix the trigger function — it used NEW.id before knowing
-- which table it came from. Also avoid auth.users reference.
-- ============================================================

CREATE OR REPLACE FUNCTION update_attendance_summary()
RETURNS TRIGGER AS $$
DECLARE
  v_seance_id  BIGINT;
  v_student_id BIGINT;
  v_total      INTEGER;
  v_present    INTEGER;
  v_absent     INTEGER;
  v_excused    INTEGER;
BEGIN
  -- Get seance_id from the day
  SELECT ad.seance_id INTO v_seance_id
  FROM attendance_day ad
  WHERE ad.id = NEW.day_id;

  v_student_id := NEW.student_id;

  -- Recount across all days in this seance for this student
  SELECT
    COUNT(*)                                         ,
    COUNT(*) FILTER (WHERE ar.status = 'present')   ,
    COUNT(*) FILTER (WHERE ar.status = 'absent')    ,
    COUNT(*) FILTER (WHERE ar.status = 'excused')
  INTO v_total, v_present, v_absent, v_excused
  FROM attendance_record ar
  JOIN attendance_day    ad ON ad.id = ar.day_id
  WHERE ad.seance_id   = v_seance_id
    AND ar.student_id  = v_student_id;

  INSERT INTO attendance_summary (
    seance_id, student_id,
    total_days, total_present, total_absent, total_excused,
    percentage_present
  )
  VALUES (
    v_seance_id, v_student_id,
    v_total, v_present, v_absent, v_excused,
    CASE WHEN v_total > 0 THEN ROUND((v_present::NUMERIC / v_total) * 100, 2) ELSE 0 END
  )
  ON CONFLICT (seance_id, student_id) DO UPDATE SET
    total_days         = EXCLUDED.total_days,
    total_present      = EXCLUDED.total_present,
    total_absent       = EXCLUDED.total_absent,
    total_excused      = EXCLUDED.total_excused,
    percentage_present = EXCLUDED.percentage_present,
    updated_at         = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIX 4: Grant read access on student and student_status
-- so authenticated users (profs/admins) can fetch them
-- ============================================================

-- If student table has RLS enabled, make sure staff can read it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'student'
  ) THEN
    -- Only add if not already there
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'student' AND policyname = 'student_read_staff'
    ) THEN
      EXECUTE $pol$
        CREATE POLICY "student_read_staff"
          ON student FOR SELECT
          TO authenticated
          USING (
            (SELECT role FROM profiles WHERE id = auth.uid())
            IN ('admin','editor','administration','prof')
          )
      $pol$;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'student_status'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'student_status' AND policyname = 'student_status_read_staff'
    ) THEN
      EXECUTE $pol$
        CREATE POLICY "student_status_read_staff"
          ON student_status FOR SELECT
          TO authenticated
          USING (
            (SELECT role FROM profiles WHERE id = auth.uid())
            IN ('admin','editor','administration','prof')
          )
      $pol$;
    END IF;
  END IF;
END $$;
