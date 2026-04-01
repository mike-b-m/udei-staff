# UDEI — University Administration System: Implementation Instructions

> This document maps the full project roadmap to the existing codebase.
> **Rule #1:** All existing code stays as-is. New work builds on top of or alongside it.
> Generated: 2026-03-29

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Tech Stack Completion](#2-tech-stack-completion)
3. [Phase 1 — Setup & Infrastructure](#3-phase-1--setup--infrastructure)
4. [Phase 2 — Auth & Security](#4-phase-2--auth--security)
5. [Phase 3 — Academic System](#5-phase-3--academic-system)
6. [Phase 4 — Payment System](#6-phase-4--payment-system)
7. [Phase 5 — Testing & Launch](#7-phase-5--testing--launch)
8. [Bug Fixes (Existing Code)](#8-bug-fixes-existing-code)
9. [Database Schema](#9-database-schema)
10. [File Map](#10-file-map)
11. [Implementation Order](#11-implementation-order)

---

## 1. Current State Summary

### What Exists and MUST Be Preserved

| File | What It Does | Status |
|------|-------------|--------|
| `app/component/db.ts` | Client-side Supabase client | ✅ Keep |
| `app/component/db-server.ts` | Server-side Supabase client (SSR cookies) | ✅ Keep |
| `app/component/provider/AuthProvider.tsx` | Auth context: user, role, loading | ✅ Keep |
| `app/component/login/login.tsx` | Email/password login with role redirect | ✅ Keep |
| `app/component/nav/nav.tsx` | Role-based sidebar (8 items) | ✅ Keep |
| `app/component/header/header.tsx` | Dashboard header | ✅ Keep |
| `app/component/footer/fouter.tsx` | Dashboard footer | ✅ Keep |
| `app/component/student-input/page.tsx` | Student registration form (all fields + photo) | ✅ Keep |
| `app/component/student-infos/studeninfos.tsx` | Student profile display + export + edit | ✅ Keep |
| `app/component/student-infos/types.ts` | Centralized TS types | ✅ Keep |
| `app/component/student-infos/constants.ts` | Roles + 17 faculties | ✅ Keep |
| `app/component/student-infos/useStudentData.ts` | Student data hooks | ✅ Keep |
| `app/component/export/exportUtils.ts` | CSV export + print utilities | ✅ Keep |
| `app/component/teacher/teacher.tsx` | Grade display (ReadNote) + export | ✅ Keep |
| `app/component/add-payment/addpayment.tsx` | Payment recording + history + export | ✅ Keep |
| `app/component/sign_up/page.tsx` | Account management + edit profile modal | ✅ Keep |
| `app/component/spend/spend.tsx` | Expense tracking + chart | ✅ Keep |
| `app/component/add-dept/page.tsx` | Add expense form | ✅ Keep |
| `app/component/chart components/chartComponent.tsx` | Recharts line chart | ✅ Keep |
| `app/component/code/code.tsx` | Student code generator (e.g. FGC-25-0001) | ✅ Keep |
| `app/component/filter/filter.tsx` | Student status filters | ✅ Keep |
| `app/component/notation/notation.tsx` | Grade letter logic | ⚠️ Keep but fix bug (see §8) |
| `app/component/input/input-comp.tsx` | Reusable input component | ✅ Keep |
| `app/component/loading/loading.tsx` | Loading skeletons (Loading, Loading2) | ✅ Keep |
| `app/component/time/time.tsx` | Date/time formatter | ✅ Keep |
| `app/component/lect_input/lecture.tsx` | Read-only key/value display | ✅ Keep |
| `app/component/add-buuton/add_button.tsx` | Add/Delete button components | ✅ Keep |
| `app/admin/layout.tsx` | Admin layout (AuthProvider + Nav + Header + Footer) | ✅ Keep |
| `app/admin/page.tsx` | Admin home — student list by faculty with cards | ✅ Keep |
| `app/admin/inscription/page.tsx` | Inscription page (wraps Student_input) | ✅ Keep |
| `app/admin/program/page.tsx` | Course program CRUD (faculty/year/session) | ✅ Keep |
| `app/admin/payment/page.tsx` | Payment 3-tab page (Tarification/Étudiants/Transactions) | ✅ Keep |
| `app/admin/teacher/page.tsx` | Grade entry with faculty/year/session/matière filters | ✅ Keep |
| `app/admin/exam/page.tsx` | Exam listing (basic prototype) | ✅ Keep |
| `app/admin/search/page.tsx` | Student search (uses StudentInfos) | ✅ Keep |
| `app/admin/spend/page.tsx` | Expense page (wraps Spend) | ✅ Keep |
| `app/admin/create/page.tsx` | Account creation (wraps SignUp) | ✅ Keep |
| `app/student/page.tsx` | Student portal — code lookup, info, notes, program | ✅ Keep |
| `app/student/layout.tsx` | Student layout (footer only, nav commented out) | ✅ Keep |
| `app/login/page.tsx` | Login page with session check | ✅ Keep |
| `app/login/layout.tsx` | Login layout | ✅ Keep |

### Existing Database Tables (observed from queries in code)

| Table | Key Columns Used |
|-------|-----------------|
| `student` | id, first_name, last_name, faculty, student_code, email, phone_number, photo_url, date_birth, place_of_birth, nif_cin, sex, marital_status, adress, mother_name/birth/residence/phone/profesion, father_name/birth/residence/phone/profesion, diploma, enrol_date, seen_by, academy |
| `student_status` | id, student_id, enroll_year, year_study, faculty, faculty_completion, year_completed |
| `student_payment` | id, student_id, amount, payment method, date fields |
| `faculty_price` | id, faculty, year, amount |
| `exam` | id, student_id, matière, intra, final, reprise, session, year, faculty |
| `course_program` | id, faculty, year, session, course name, credits, hours |
| `profiles` | id (UUID → auth.users), full_name, role |
| `spent_in_company` | id, date_time, amount, name, pay_method, describe_motive |

### Existing Roles (defined in constants.ts)

- `admin` — Full access to everything
- `administration` — Administrative access (similar to admin)
- `editor` — Can modify data but limited admin operations
- `prof` — Grade entry and viewing

### Existing Faculties (17 total, defined in constants.ts)

Génie Civil, Médecine Générale, Odontologie, Sciences Infirmières, Sciences Administratives, Sciences Comptables, Gestion des affaires, Sciences Agronomiques, Sciences Economiques, Sciences de l'Education, Sciences Juridiques, Science Informatique, Pharmacologies, Médecine vétérinaire, Laboratoire Médicale, Physiothérapie, Jardinières d'enfants

---

## 2. Tech Stack Completion

### Already Installed

- [x] Next.js 16+ (App Router) — `"next": "^16.1.6"`
- [x] React 19 — `"react": "^19.1.0"`
- [x] TypeScript 5 — `"typescript": "^5"`
- [x] Supabase Client — `"@supabase/supabase-js": "^2.91.1"`
- [x] Supabase SSR — `"@supabase/ssr": "^0.8.0"`
- [x] Tailwind CSS v4 — `"@tailwindcss/postcss": "^4.1.18"`
- [x] Recharts — `"recharts": "^3.8.0"`
- [x] html2pdf.js — `"html2pdf.js": "^0.14.0"`
- [x] QR Scanner — `"@yudiel/react-qr-scanner": "^2.5.1"`

### To Install (add only when you reach the feature that needs it)

```bash
# UI Components (optional — recommended by roadmap for consistent UI)
npm install class-variance-authority clsx tailwind-merge lucide-react
npx shadcn@latest init

# State Management (when prop drilling becomes painful)
npm install zustand

# Server State & Caching (for complex data fetching)
npm install @tanstack/react-query

# PDF Generation — server-side transcripts & receipts (Phase 3)
npm install @react-pdf/renderer

# Email Service (Phase 5)
npm install resend

# Payment SDKs — only when approaching production (Phase 4)
# MonCash — REST API via fetch (no official npm package needed)
# PayPal:
npm install @paypal/react-paypal-js
# NatCash — REST API via fetch (no official npm package needed)

# Testing (Phase 5)
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Error Monitoring (Phase 5)
npm install @sentry/nextjs
```

---

## 3. Phase 1 — Setup & Infrastructure

### 3.1 Environment Variables — TO DO

Create `env.example` at the project root to document required vars:

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email — Phase 5
RESEND_API_KEY=

# Payments — Phase 4
MONCASH_CLIENT_ID=
MONCASH_CLIENT_SECRET=
MONCASH_BASE_URL=

PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.2 Validate Env at Build Time — TO DO

Create `app/lib/env.ts`:

```ts
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env variable: ${name}`)
  return value
}

export const env = {
  supabaseUrl: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}
```

### 3.3 Service-Role Client for Admin Operations — TO DO

Create `app/lib/supabase-admin.ts`:

```ts
import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// Server-only client with service-role privileges
// NEVER import this in client components
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceKey)
```

### 3.4 New Folder Structure — TO DO

Add these folders/files as you build each feature:

```
app/
  api/                          ← NEW: Server-side API routes
    auth/
      callback/route.ts         ← Supabase auth callback handler
    pdf/
      transcript/route.ts       ← Transcript PDF generation
      receipt/route.ts          ← Payment receipt PDF generation
    webhooks/
      payment/
        moncash/route.ts        ← MonCash payment callback
        paypal/route.ts         ← PayPal payment callback
  lib/                          ← NEW: Shared server utilities
    env.ts                      ← Env validation
    supabase-admin.ts           ← Service-role client
    gpa.ts                      ← GPA calculation engine
    audit.ts                    ← Audit logging utility
  admin/
    enrollment/page.tsx         ← NEW: Enrollment management
  reset-password/
    page.tsx                    ← NEW: Password reset page
middleware.ts                   ← NEW: Route protection (project root)
```

---

## 4. Phase 2 — Auth & Security

### 4.1 Middleware — Route Protection — TO DO ⚠️ PRIORITY: HIGH

**Why:** Currently anyone can type `/admin` in the browser and access the dashboard without auth. The `AuthProvider` checks on client side, but the page still loads before redirecting.

Create `middleware.ts` at the **project root** (same level as `app/`):

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not remove this — it refreshes the auth token
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // --- Not logged in: redirect to login (except login page itself) ---
  if (!user && !pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // --- Logged in on login page: redirect to dashboard ---
  if (user && pathname.startsWith('/login')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()
    url.pathname = profile?.role === 'student' ? '/student' : '/admin'
    return NextResponse.redirect(url)
  }

  // --- Role-based route protection ---
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const staffRoles = ['admin', 'editor', 'administration', 'prof']
    if (!profile || !staffRoles.includes(profile.role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/student'
      return NextResponse.redirect(url)
    }
  }

  if (user && pathname.startsWith('/student')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Students stay on /student, staff can also access /student for testing
    // But non-authenticated are already caught above
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all routes except static assets
    '/((?!_next/static|_next/image|favicon.ico|public|image).*)',
  ],
}
```

### 4.2 Row-Level Security (RLS) — TO DO ⚠️ PRIORITY: HIGH

**Why:** Without RLS, anyone with your Supabase anon key can read/write ALL data directly via the Supabase REST API, completely bypassing your UI.

Run these SQL commands in the **Supabase SQL Editor** (Dashboard → SQL Editor):

```sql
-- ============================================
-- STEP 1: Enable RLS on all tables
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

-- ============================================
-- STEP 3: Profiles policies
-- ============================================

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (public.get_user_role() IN ('admin', 'administration'));

-- Admins can update any profile
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'administration'));

-- Users can update their own profile (name only, not role)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- STEP 4: Student table policies
-- ============================================

-- Staff can do everything with students
CREATE POLICY "student_all_staff"
  ON student FOR ALL
  USING (public.get_user_role() IN ('admin', 'administration', 'editor'));

-- Professors can read students (for grading)
CREATE POLICY "student_select_prof"
  ON student FOR SELECT
  USING (public.get_user_role() = 'prof');

-- Students can read their own record (link via student_code or email)
-- Adjust the WHERE condition based on how you link auth users to students
CREATE POLICY "student_select_own"
  ON student FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
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

-- Anyone authenticated can read prices
CREATE POLICY "faculty_price_select_auth"
  ON faculty_price FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admin/administration can modify prices
CREATE POLICY "faculty_price_modify_admin"
  ON faculty_price FOR ALL
  USING (public.get_user_role() IN ('admin', 'administration'));

-- ============================================
-- STEP 8: Exam (grades) policies
-- ============================================

-- Staff can manage grades
CREATE POLICY "exam_all_staff"
  ON exam FOR ALL
  USING (public.get_user_role() IN ('admin', 'administration', 'editor', 'prof'));

-- Students can read their own grades
-- (requires joining through student table — adjust if your schema differs)
CREATE POLICY "exam_select_student"
  ON exam FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM student
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ============================================
-- STEP 9: Course program policies
-- ============================================

-- Anyone authenticated can read programs
CREATE POLICY "course_program_select_auth"
  ON course_program FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admin/administration can modify programs
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
```

> ⚠️ **IMPORTANT:** Test these policies carefully after applying. If something breaks:
> 1. Use the Supabase Dashboard → Authentication → check your user's role in profiles
> 2. You can always use the **service-role key** (in `supabase-admin.ts`) to bypass RLS for emergency fixes
> 3. To remove a policy: `DROP POLICY "policy_name" ON table_name;`

### 4.3 Auth Callback Route — TO DO

Create `app/api/auth/callback/route.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

### 4.4 Password Reset Flow — TO DO

**Step 1:** Add a "Mot de passe oublié?" link in `app/login/page.tsx` (existing file — add alongside current login form):

```tsx
// Add this function inside the LogIn component:
const handleForgotPassword = async () => {
  if (!email) { setError('Entrez votre email d\'abord'); return }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
  })
  if (error) setError(error.message)
  else setSuccess(true) // Show "Check your email" message
}
```

**Step 2:** Create `app/reset-password/page.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/app/component/db'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (password.length < 8) { setError('Minimum 8 caractères'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else router.push('/login?message=password_reset_success')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleReset} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Nouveau mot de passe</h1>
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        <input type="password" placeholder="Nouveau mot de passe" value={password}
          onChange={e => setPassword(e.target.value)} required minLength={8}
          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg" />
        <input type="password" placeholder="Confirmer le mot de passe" value={confirm}
          onChange={e => setConfirm(e.target.value)} required minLength={8}
          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg" />
        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Chargement...' : 'Réinitialiser'}
        </button>
      </form>
    </div>
  )
}
```

### 4.5 Audit Logging — TO DO (PRIORITY: MEDIUM)

**Step 1:** Create the table in Supabase SQL Editor:

```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,           -- 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,       -- which table was affected
  record_id TEXT,                 -- ID of the affected record
  old_data JSONB,                 -- previous values (for UPDATE/DELETE)
  new_data JSONB,                 -- new values (for INSERT/UPDATE)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: only admins can read audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_admin_only"
  ON audit_logs FOR SELECT
  USING (public.get_user_role() IN ('admin', 'administration'));

-- Allow inserts from any authenticated user (for logging)
CREATE POLICY "audit_logs_insert_auth"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

**Step 2:** Create `app/lib/audit.ts`:

```ts
import { supabase } from '@/app/component/db'

export async function logAudit(
  action: string,
  tableName: string,
  recordId: string,
  oldData?: unknown,
  newData?: unknown
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action,
    table_name: tableName,
    record_id: recordId,
    old_data: oldData ?? null,
    new_data: newData ?? null,
  })
}
```

**Step 3:** Use it in existing components by adding calls after data operations. Example for student-input:

```ts
// After a successful student insert:
import { logAudit } from '@/app/lib/audit'
await logAudit('INSERT', 'student', newStudentId.toString(), null, formData)
```

---

## 5. Phase 3 — Academic System

### 5.1 Semester / Academic Year Management — TO DO

**Database — run in Supabase SQL Editor:**

```sql
CREATE TABLE semesters (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,              -- e.g. 'Semestre 1 2025-2026'
  academic_year TEXT NOT NULL,     -- e.g. '2025-2026'
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
```

**UI:** Add a semester selector dropdown to:
- `app/admin/teacher/page.tsx` — alongside existing session/year filters
- `app/admin/program/page.tsx` — alongside existing session/year filters

The current `session` field in `course_program` can map to semesters. No need to change the existing session logic — just add semester awareness on top.

### 5.2 Enrollment System — TO DO

**Database:**

```sql
CREATE TABLE enrollments (
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
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
```

**UI:** Create `app/admin/enrollment/page.tsx`:

1. Show all pending enrollments with student info
2. Admin can approve/reject with optional notes
3. Approved enrollments update `student_status` accordingly
4. Filter by faculty, semester, status

**Also:** Add a new nav item in `app/component/nav/nav.tsx`:

```tsx
// Add to the nav items array (between Inscription and Recherche):
{
  titre: "Inscription Semestrielle",
  href: "/admin/enrollment",
  icon: /* choose an appropriate icon */,
  access: ['admin', 'administration', 'editor']
}
```

### 5.3 GPA Calculation Engine — TO DO

Create `app/lib/gpa.ts`:

```ts
/**
 * Grade scale for UDEI:
 *   A = 90-100 (4.0) — Excellent
 *   B = 80-89  (3.0) — Très Bien
 *   C = 65-79  (2.0) — Bien
 *   D = 50-64  (1.0) — Reprise
 *   E = 0-49   (0.0) — Échec
 */

export interface GradeEntry {
  score: number
  credits: number
}

const GRADE_SCALE = [
  { min: 90, letter: 'A', label: 'Excellent', points: 4.0, status: 'Réussite' },
  { min: 80, letter: 'B', label: 'Très Bien', points: 3.0, status: 'Réussite' },
  { min: 65, letter: 'C', label: 'Bien',      points: 2.0, status: 'Réussite' },
  { min: 50, letter: 'D', label: 'Passable',  points: 1.0, status: 'Reprise' },
  { min: 0,  letter: 'E', label: 'Insuffisant', points: 0.0, status: 'Échec' },
] as const

export function getGradeInfo(score: number) {
  const clamped = Math.max(0, Math.min(100, score))
  const grade = GRADE_SCALE.find(g => clamped >= g.min)!
  return grade
}

export function getLetterGrade(score: number): string {
  return getGradeInfo(score).letter
}

export function getGradePoint(score: number): number {
  return getGradeInfo(score).points
}

export function calculateGPA(grades: GradeEntry[]): number {
  if (grades.length === 0) return 0
  const totalPoints = grades.reduce((sum, g) => sum + getGradePoint(g.score) * g.credits, 0)
  const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0)
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0
}

export function calculateCumulativeGPA(semesterGPAs: { gpa: number; credits: number }[]): number {
  const totalPoints = semesterGPAs.reduce((sum, s) => sum + s.gpa * s.credits, 0)
  const totalCredits = semesterGPAs.reduce((sum, s) => sum + s.credits, 0)
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0
}
```

> **This replaces the buggy notation.tsx logic** (see §8). Import `getGradeInfo()` wherever you currently use `<Notation>`.

### 5.4 Transcript PDF Generation — TO DO

**Install:** `npm install @react-pdf/renderer`

Create `app/api/pdf/transcript/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get('student_id')
  if (!studentId) {
    return NextResponse.json({ error: 'student_id required' }, { status: 400 })
  }

  // Use service-role client for server-side data fetching
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch student + grades + courses
  const [studentRes, gradesRes, statusRes] = await Promise.all([
    supabase.from('student').select('*').eq('id', studentId).single(),
    supabase.from('exam').select('*').eq('student_id', studentId),
    supabase.from('student_status').select('*').eq('student_id', studentId),
  ])

  if (studentRes.error || !studentRes.data) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // TODO: Generate PDF using @react-pdf/renderer
  // For now, return JSON. Replace with actual PDF generation.
  return NextResponse.json({
    student: studentRes.data,
    grades: gradesRes.data,
    status: statusRes.data,
  })
}
```

**UI integration:** Add a "Télécharger Relevé de Notes" (Download Transcript) button in `app/component/student-infos/studeninfos.tsx`:

```tsx
<button onClick={() => window.open(`/api/pdf/transcript?student_id=${studentData.id}`, '_blank')}>
  📄 Relevé de Notes PDF
</button>
```

### 5.5 Complete the Exam Page — TO DO

The current `app/admin/exam/page.tsx` is a basic prototype. Expand it to include:

1. **Exam Schedule Management** — Create/edit/delete exam dates per faculty/semester/course
2. **Link to Grade Entry** — Button that navigates to `/admin/teacher` with pre-filled filters
3. **Exam Results Overview** — Summary showing pass/fail rates per course
4. **Filter Controls** — Faculty, semester, course dropdowns (follow the same pattern as `teacher/page.tsx`)

### 5.6 Student Self-Service Portal Improvements — TO DO

The current `app/student/page.tsx` uses manual code lookup. Improve it step by step:

**Step 1:** Auto-load student data after login
```tsx
// Instead of manual code entry, look up by auth email:
const { data: { user } } = await supabase.auth.getUser()
const { data: student } = await supabase
  .from('student')
  .select('*')
  .eq('email', user?.email)
  .single()
```

**Step 2:** Add sections to the student dashboard:
- Enrollment status (from `enrollments` table)
- Payment history (from `student_payment`)
- GPA display (calculated from `exam` table using `gpa.ts`)
- Transcript download button (calls `/api/pdf/transcript`)

**Step 3:** Uncomment and configure `<Nav />` in `app/student/layout.tsx`:
- Create a `StudentNav` component with student-relevant links: Dashboard, Notes, Paiements, Programme, Profil

---

## 6. Phase 4 — Payment System

### 6.1 Invoice Generation — TO DO

**Database:**

```sql
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES student(id) ON DELETE CASCADE,
  semester_id INTEGER REFERENCES semesters(id),
  description TEXT NOT NULL,           -- e.g. 'Frais de scolarité - Semestre 1'
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
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Auto-update status based on payments
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices SET
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM student_payment
      WHERE student_id = NEW.student_id
    ),
    status = CASE
      WHEN paid_amount >= amount THEN 'paid'
      WHEN paid_amount > 0 THEN 'partial'
      ELSE status
    END,
    updated_at = NOW()
  WHERE student_id = NEW.student_id AND status != 'cancelled';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice
  AFTER INSERT ON student_payment
  FOR EACH ROW EXECUTE FUNCTION update_invoice_status();
```

**UI:** Add to `app/admin/payment/page.tsx` (as a 4th tab or section in existing tabs):
- Auto-generate invoices when a student enrolls (based on `faculty_price`)
- Show invoice list per student with status badges
- Mark as paid/partial when payments are recorded
- Overdue invoice alerts

### 6.2 Payment Gateway Integration — TO DO (PRIORITY: LOW)

> **Note:** The existing manual payment recording in `addpayment.tsx` covers the core need. Add gateway integration only when approaching production.

**MonCash Integration:**

Create `app/lib/moncash.ts`:
```ts
const MONCASH_BASE = process.env.MONCASH_BASE_URL || 'https://sandbox.moncashbutton.digicelgroup.com'

export async function createMonCashPayment(amount: number, orderId: string) {
  // 1. Get access token
  const tokenRes = await fetch(`${MONCASH_BASE}/Api/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(
        `${process.env.MONCASH_CLIENT_ID}:${process.env.MONCASH_CLIENT_SECRET}`
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'scope=read,write&grant_type=client_credentials',
  })
  const { access_token } = await tokenRes.json()

  // 2. Create payment
  const paymentRes = await fetch(`${MONCASH_BASE}/Api/v1/CreatePayment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, orderId }),
  })

  return paymentRes.json()
}
```

Create `app/api/webhooks/payment/moncash/route.ts` to handle callbacks.

**PayPal Integration:**

```bash
npm install @paypal/react-paypal-js
```

Add PayPal button in student payment view. Create `app/api/webhooks/payment/paypal/route.ts`.

**NatCash:** Similar pattern to MonCash — REST API integration.

### 6.3 Receipt PDF Generation — TO DO

Create `app/api/pdf/receipt/route.ts`:
- Accept payment_id as query param
- Fetch payment + student data
- Generate PDF with university header, payment details, signature line
- Return as downloadable PDF

Add a "Reçu" (Receipt) button next to each payment in the history table in `addpayment.tsx`.

### 6.4 Financial Reports — TO DO

Create `app/admin/reports/page.tsx` or expand existing spend page:

1. **Income Overview** — Total payments received, grouped by faculty/month
2. **Outstanding Balances** — Students with unpaid/partial invoices
3. **Collection Rate** — Percentage of expected vs. received per faculty
4. **Income vs. Expenses** — Combined chart using existing Recharts setup
5. **Export** — Reuse `exportToCSV` and `printHTML` from `exportUtils.ts`

Add a nav item for reports in `nav.tsx`.

---

## 7. Phase 5 — Testing & Launch

### 7.1 Unit Tests — TO DO

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
})
```

**Priority test targets (pure logic — easiest to test):**

| File | What to Test |
|------|-------------|
| `app/lib/gpa.ts` | `getLetterGrade()`, `calculateGPA()` with various scores |
| `app/component/export/exportUtils.ts` | CSV generation format |
| `app/component/code/code.tsx` | Code format generation |

Example test file `app/lib/__tests__/gpa.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getLetterGrade, calculateGPA } from '../gpa'

describe('getLetterGrade', () => {
  it('returns A for 90-100', () => {
    expect(getLetterGrade(95)).toBe('A')
    expect(getLetterGrade(90)).toBe('A')
    expect(getLetterGrade(100)).toBe('A')
  })
  it('returns E for below 50', () => {
    expect(getLetterGrade(49)).toBe('E')
    expect(getLetterGrade(0)).toBe('E')
  })
})

describe('calculateGPA', () => {
  it('returns 4.0 for all A grades', () => {
    expect(calculateGPA([
      { score: 95, credits: 3 },
      { score: 92, credits: 4 },
    ])).toBe(4.0)
  })
  it('returns 0 for empty array', () => {
    expect(calculateGPA([])).toBe(0)
  })
})
```

### 7.2 Integration / E2E Tests — TO DO

Use Playwright for E2E:
```bash
npm install -D @playwright/test
npx playwright install
```

Test flows:
1. Login → correct redirect based on role
2. Student registration → code generated → appears in student list
3. Grade entry → grades saved → visible in ReadNote component
4. Payment recording → appears in payment history → export works

### 7.3 Error Monitoring — TO DO

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Follow the setup wizard to configure Sentry for Next.js.

### 7.4 Performance Optimization — TO DO

1. **Route-level loading states:** Add `loading.tsx` to each route folder:
   - `app/admin/loading.tsx`
   - `app/student/loading.tsx`
   - `app/admin/payment/loading.tsx`
   - etc.

2. **Dynamic imports** for heavy components:
   ```tsx
   import dynamic from 'next/dynamic'
   const Chart = dynamic(() => import('@/app/component/chart components/chartComponent'), {
     loading: () => <Loading2 />,
     ssr: false,
   })
   ```

3. **Image optimization:** Use `next/image` for student photos instead of `<img>`:
   ```tsx
   import Image from 'next/image'
   <Image src={photoUrl} width={200} height={200} alt="Student photo" />
   ```

4. **Suspense boundaries** around data-heavy sections.

### 7.5 Deployment to Vercel — TO DO

1. Push to GitHub (already connected based on terminal history)
2. Connect repo to Vercel: `npx vercel`
3. Set environment variables in Vercel Dashboard → Settings → Environment Variables
4. Configure custom domain
5. Enable Vercel Analytics + Speed Insights
6. Set up preview deployments for PRs

---

## 8. Bug Fixes (Existing Code)

### 8.1 ⚠️ CRITICAL: `app/component/notation/notation.tsx` — Logic Bug

**Problem:** All `if` conditions use `||` (OR) instead of `&&` (AND). This means EVERY condition evaluates to `true` for ANY number, because any number is either `≤ 100` OR `≥ 90`.

**Current (broken):**
```ts
if (id <= 100 || id >= 90)  // ALWAYS TRUE — any number satisfies at least one side
```

**Fix — Option A (quick fix):** Change `||` to `&&`:
```ts
if (id <= 100 && id >= 90)  { setLett('A'); setNote('Excellent') }
else if (id <= 89 && id >= 80)  { setLett('B'); setNote('Très Bien') }
else if (id <= 79 && id >= 65)  { setLett('C'); setNote('Bien') }
else if (id <= 64 && id >= 50)  { setLett('D'); setPass('Reprise') }
else if (id <= 49 && id >= 0)   { setLett('E'); setPass('Echec') }
// Set pass status separately
if (id >= 65) setPass('Réussite')
```

**Fix — Option B (recommended):** Replace the entire component with `getGradeInfo()` from `app/lib/gpa.ts` (see §5.3). The current component uses `useEffect` + `useState` for what should be a pure function — no side effects needed.

```tsx
import { getGradeInfo } from '@/app/lib/gpa'

export default function Notation({ id }: { id: number }) {
  const grade = getGradeInfo(id)
  return (
    <div>
      <div>{id} {grade.letter} {grade.status}</div>
    </div>
  )
}
```

### 8.2 MINOR: Student Portal Nav — `app/student/layout.tsx`

The `<Nav />` component is commented out. Two options:
- **Option A:** Uncomment it and pass student-specific nav config
- **Option B:** Create a separate `StudentNav` component with links: Tableau de bord, Notes, Paiements, Programme, Profil

---

## 9. Database Schema

### Existing Tables — DO NOT DROP (add columns if needed)

```
student
├── id (PK)
├── first_name, last_name, faculty, student_code
├── date_birth, place_of_birth, nif_cin, sex, email, phone_number
├── marital_status, adress, diploma, enrol_date, seen_by, academy
├── photo_url
├── mother_name, mother_birth, mother_residence, mother_phone, mother_profesion
└── father_name, father_birth, father_residence, father_phone, father_profesion

student_status
├── id (PK)
├── student_id (FK → student)
├── enroll_year, year_study, faculty, faculty_completion, year_completed
└──

student_payment
├── id (PK)
├── student_id (FK → student)
├── amount, payment method, date fields
└──

faculty_price
├── id (PK)
├── faculty, year, amount
└──

exam
├── id (PK)
├── student_id (FK → student)
├── matière, intra, final, reprise, session, year, faculty
└──

course_program
├── id (PK)
├── faculty, year, session, course name, credits, hours
└──

profiles
├── id (PK, UUID → auth.users)
├── full_name, role
└──

spent_in_company
├── id (PK)
├── date_time, amount, name, pay_method, describe_motive
└──
```

### New Tables to Create

| Table | Purpose | Phase | SQL |
|-------|---------|-------|-----|
| `semesters` | Academic year/semester periods | Phase 3 | See §5.1 |
| `enrollments` | Student enrollment per semester | Phase 3 | See §5.2 |
| `invoices` | Payment invoices per student | Phase 4 | See §6.1 |
| `audit_logs` | Track all data modifications | Phase 2 | See §4.5 |
| `notifications` | System alerts for users | Phase 5 | Design when needed |

---

## 10. File Map

### Existing Files — PRESERVE ALL

```
app/
├── globals.css
├── component/
│   ├── db.ts                             ← Client Supabase
│   ├── db-server.ts                      ← Server Supabase (SSR)
│   ├── provider/AuthProvider.tsx          ← Auth context
│   ├── login/login.tsx                   ← Login form
│   ├── nav/nav.tsx                       ← Role-based navigation
│   ├── header/header.tsx                 ← Dashboard header
│   ├── footer/fouter.tsx                 ← Dashboard footer
│   ├── student-input/page.tsx            ← Student registration form
│   ├── student-infos/
│   │   ├── studeninfos.tsx               ← Student profile + export + edit
│   │   ├── types.ts                      ← TypeScript types
│   │   ├── constants.ts                  ← Roles + faculties
│   │   └── useStudentData.ts             ← Data fetching hooks
│   ├── export/exportUtils.ts             ← CSV + print utilities
│   ├── teacher/teacher.tsx               ← Grade display + export
│   ├── add-payment/addpayment.tsx        ← Payment recording + export
│   ├── sign_up/page.tsx                  ← Account management + edit modal
│   ├── spend/spend.tsx                   ← Expense tracking + chart
│   ├── add-dept/page.tsx                 ← Add expense form
│   ├── chart components/chartComponent.tsx ← Recharts chart
│   ├── code/code.tsx                     ← Student code generator
│   ├── filter/filter.tsx                 ← Status filters
│   ├── notation/notation.tsx             ← Grade letters (⚠️ BUG — §8)
│   ├── input/input-comp.tsx              ← Reusable input
│   ├── loading/loading.tsx               ← Loading skeletons
│   ├── time/time.tsx                     ← Date formatter
│   ├── lect_input/lecture.tsx            ← Key/value display
│   └── add-buuton/add_button.tsx         ← Add/Delete buttons
├── admin/
│   ├── globals.css
│   ├── layout.tsx                        ← Admin layout (AuthProvider+Nav+Header+Footer)
│   ├── page.tsx                          ← Admin home (student list by faculty)
│   ├── inscription/page.tsx              ← Registration (wraps Student_input)
│   ├── program/page.tsx                  ← Course program CRUD
│   ├── payment/page.tsx                  ← Payment (3 tabs)
│   ├── teacher/page.tsx                  ← Grade entry with filters
│   ├── exam/page.tsx                     ← Exam listing (basic)
│   ├── search/page.tsx                   ← Student search
│   ├── spend/page.tsx                    ← Expenses (wraps Spend)
│   └── create/page.tsx                   ← Account creation (wraps SignUp)
├── student/
│   ├── layout.tsx                        ← Student layout
│   └── page.tsx                          ← Student portal
└── login/
    ├── layout.tsx                        ← Login layout
    └── page.tsx                          ← Login page
```

### New Files to Create (in order of priority)

```
middleware.ts                              ← Route protection (Phase 2) — HIGH PRIORITY
app/
├── lib/
│   ├── env.ts                            ← Env validation (Phase 1)
│   ├── supabase-admin.ts                 ← Service-role client (Phase 2)
│   ├── gpa.ts                            ← GPA engine (Phase 3)
│   └── audit.ts                          ← Audit logging (Phase 2)
├── api/
│   ├── auth/callback/route.ts            ← Auth callback (Phase 2)
│   ├── pdf/
│   │   ├── transcript/route.ts           ← Transcript PDF (Phase 3)
│   │   └── receipt/route.ts              ← Payment receipt PDF (Phase 4)
│   └── webhooks/payment/
│       ├── moncash/route.ts              ← MonCash callback (Phase 4)
│       └── paypal/route.ts               ← PayPal callback (Phase 4)
├── admin/
│   ├── enrollment/page.tsx               ← Enrollment management (Phase 3)
│   ├── reports/page.tsx                  ← Financial reports (Phase 4)
│   └── loading.tsx                       ← Route loading state (Phase 5)
├── student/
│   └── loading.tsx                       ← Route loading state (Phase 5)
└── reset-password/
    └── page.tsx                          ← Password reset (Phase 2)
```

---

## 11. Implementation Order

Recommended sequence — each step builds on the previous:

| # | Task | Phase | Priority | Depends On |
|---|------|-------|----------|------------|
| 1 | Fix `notation.tsx` bug (§8.1) | Bug Fix | 🔴 Critical | Nothing |
| 2 | Create `middleware.ts` (§4.1) | Phase 2 | 🔴 Critical | Nothing |
| 3 | Apply RLS policies in Supabase (§4.2) | Phase 2 | 🔴 Critical | Nothing |
| 4 | Create `app/lib/env.ts` (§3.2) | Phase 1 | 🟡 Medium | Nothing |
| 5 | Create `app/lib/supabase-admin.ts` (§3.3) | Phase 1 | 🟡 Medium | #4 |
| 6 | Create auth callback route (§4.3) | Phase 2 | 🟡 Medium | Nothing |
| 7 | Add password reset flow (§4.4) | Phase 2 | 🟡 Medium | #6 |
| 8 | Create `app/lib/audit.ts` + table (§4.5) | Phase 2 | 🟡 Medium | #5 |
| 9 | Create `semesters` table + UI (§5.1) | Phase 3 | 🟡 Medium | #3 |
| 10 | Create `app/lib/gpa.ts` (§5.3) | Phase 3 | 🟡 Medium | Nothing |
| 11 | Build enrollment system (§5.2) | Phase 3 | 🟡 Medium | #9 |
| 12 | Add transcript PDF generation (§5.4) | Phase 3 | 🟢 Normal | #5, #10 |
| 13 | Complete exam page (§5.5) | Phase 3 | 🟢 Normal | #9 |
| 14 | Improve student portal (§5.6) | Phase 3 | 🟢 Normal | #10, #11 |
| 15 | Uncomment/create student nav (§8.2) | Phase 3 | 🟢 Normal | #14 |
| 16 | Create invoice system (§6.1) | Phase 4 | 🟢 Normal | #9, #11 |
| 17 | Add financial reports (§6.4) | Phase 4 | 🟢 Normal | #16 |
| 18 | Receipt PDF generation (§6.3) | Phase 4 | 🟢 Normal | #5, #16 |
| 19 | Payment gateway integration (§6.2) | Phase 4 | 🔵 Low | #16 |
| 20 | Add unit tests (§7.1) | Phase 5 | 🟢 Normal | #10 |
| 21 | Add E2E tests (§7.2) | Phase 5 | 🔵 Low | #20 |
| 22 | Add error monitoring (§7.3) | Phase 5 | 🟢 Normal | Nothing |
| 23 | Performance optimization (§7.4) | Phase 5 | 🔵 Low | Nothing |
| 24 | Deploy to Vercel (§7.5) | Phase 5 | 🟢 Normal | #1-#3 minimum |

---

*Update this file as features are completed. Check off items and add notes about deviations from the plan.*
*Last updated: 2026-03-29*
