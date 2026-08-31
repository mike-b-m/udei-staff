# UDEI University Administration System

UDEI is a web-based university administration and academic management platform. It centralizes student records, enrollment, academic programs, teaching activities, assessments, attendance, payments, expenses, reporting, and student self-service in one responsive application.

The platform is designed for university administrators, academic staff, professors, and students. It uses role-based access control so each user sees the workflows and data appropriate to their responsibilities.

## Core Capabilities

### Administration

- Dashboard for browsing students and filtering by faculty, study level, and academic year.
- Student registration with personal, contact, identification, academic, and family information.
- Student profile management, search, editing, photo upload, and printable student information sheets.
- Student code generation and student-card QR code generation.
- Staff account creation and profile management.
- Faculty and academic configuration.

### Enrollment and Academic Programs

- Semester creation and management.
- Enrollment tracking and approval workflows.
- Student status management, including study year, academic year, faculty, and completion status.
- Course-program management by faculty, study year, and session.
- Course credits, session counts, teaching hours, and total-hour tracking.
- Important academic dates and program information.

### Teaching and Learning

- Professor assignment to faculty, courses, and academic contexts.
- Lecture and course-content uploads.
- Lesson management with video playback support, including YouTube content.
- Student lesson access and lesson-progress tracking.
- Homework creation and homework submission workflows.
- Teacher and administrator grade entry and grade review.
- Grade-letter conversion, GPA calculation, and academic result presentation.

### Exams

- Exam creation with questions and answer options.
- Exam configuration by faculty, study year, subject, session, and duration.
- Student exam attempts with answer saving.
- Question and option randomization where configured.
- Exam submission and score calculation.
- Exam result viewing for students and staff.
- Attempt-event logging for actions such as tab changes and fullscreen events.

### Attendance

- Attendance session and seance creation.
- Seven-week and seven-day attendance organization.
- Filtering by faculty, study year, session, and academic year.
- Attendance states for present, absent, and excused.
- Attendance summaries and percentage calculations.
- Seance confirmation and protection of finalized records.
- CSV, PDF, and print-ready attendance exports.

### Payments and Finance

- Faculty pricing configuration.
- Three-versement payment structure with configurable amounts.
- Student payment recording with balance updates and payment history.
- Student discounts and adjusted balances.
- Payment status by versement, including paid, partial, and unpaid states.
- Payment history lookup with printable, CSV, and PDF-style exports.
- QR scanning for fast student payment lookup.
- QR results display the student photo, full name, faculty, academic year, and each versement's completion state or remaining balance.
- Expense recording with payment method, date, amount, and description.
- Expense visualization and financial reporting.
- MonCash helper integration for payment status and sandbox communication.

### Reports and Exports

- Enrollment, revenue, spending, and distribution reports.
- Reusable CSV export and browser print utilities.
- Printable student profiles, payment histories, grade reports, and attendance reports.
- Student-card generation with QR codes.
- GPA and transcript data services.

## User Roles

- **Admin:** broad access to administration, accounts, academic configuration, finance, reports, and operational workflows.
- **Administration:** access to student, enrollment, payment, expense, and university operations.
- **Editor:** access to permitted student, enrollment, academic-content, exam, homework, and grade-editing workflows.
- **Professor:** access to assigned teaching, grades, exams, homework, lessons, and attendance workflows.
- **Student:** access to personal profile, academic status, grades, GPA, lessons, exams, payment information, and results.

## Application Routes

### Public and Account

- `/login` - authentication and session-aware login.
- `/sign-up` - account registration flow.
- `/reset-password` - password reset flow.
- `/result` - student-code-based result lookup.
- `/api/auth/callback` - authentication callback handler.

### Administration

- `/admin` - student administration dashboard.
- `/admin/inscription` - student registration.
- `/admin/search` - student search and profile details.
- `/admin/create` - staff account management.
- `/admin/enrollment` - semesters and enrollment status.
- `/admin/program` - course-program management.
- `/admin/teacher` - grades and teaching records.
- `/admin/exam` - exam administration.
- `/admin/exam/create` - exam, question, and option creation.
- `/admin/exam/results` - exam result management.
- `/admin/homework` - homework administration.
- `/admin/lessons` - lesson and course-content management.
- `/admin/manage` - professor assignments and lecture uploads.
- `/admin/attendance` - attendance management.
- `/admin/payment` - pricing, student payments, transactions, and QR scanning.
- `/admin/spend` - expense management.
- `/admin/reports` - operational and financial reports.

### Student and Teacher Portals

- `/student` - student dashboard and academic overview.
- `/student/profile` - profile and photo management.
- `/student/lessons` - lesson catalog and progress.
- `/student/exam` - available online exams.
- `/student/exam/[examId]/attempt/[attemptId]` - exam attempt interface.
- `/student/exam/[examId]/result/[attemptId]` - exam result view.
- `/teacher` - teacher-facing academic and grade workflows.

## Security and Access Control

- Supabase Authentication manages user sessions.
- Server-side authentication uses Supabase SSR cookies.
- Middleware protects authenticated routes and redirects users according to their roles.
- Administration routes are restricted to authorized staff roles.
- Supabase Row Level Security policies protect database records using the authenticated user, profile role, and user identity.
- Audit logging is supported through `audit_logs` and the shared audit utility.
- A server-only Supabase service-role client is available for trusted server operations.

## Technology Stack

- Next.js 16 with the App Router.
- React 19 and TypeScript 5.
- Tailwind CSS 4 for responsive styling.
- Supabase for PostgreSQL data, authentication, Row Level Security, SSR sessions, and storage URLs.
- Recharts for reporting visualizations.
- `@yudiel/react-qr-scanner` for QR scanning.
- `qrcode.react` for student-card QR generation.
- `html2canvas-pro`, `html2pdf.js`, `jspdf`, and `react-to-print` for document and print workflows.
- Vitest and Testing Library dependencies for automated tests.

## Database Modules

The SQL migrations in [`supabase/migrations`](supabase/migrations) establish and secure the platform's main modules:

- Core student, status, payment, pricing, academic, and profile records.
- Audit logs, semesters, enrollments, and invoices.
- Homework, homework submissions, professor assignments, and lecture uploads.
- Online exams, questions, answer options, attempts, answers, and event logs.
- Lessons and lesson progress.
- Attendance seances, days, records, and summaries.
- Row Level Security policies, indexes, and summary/update triggers.

Apply migrations in sequence through the Supabase SQL editor or Supabase CLI. Some legacy core table definitions are external to this repository, so the deployment database should be reviewed before applying changes.

## Getting Started
npm start         # Start the production server
npx vitest run    # Run the test suite
```

The development server is available at [http://localhost:3000](http://localhost:3000).

## Implementation Notes

- Browser camera access is required for QR scanning and must be permitted by the user.
- Payment and versement calculations depend on the configured `faculty_price` records and the student's payment record.
- The MonCash helper is configured for sandbox-style communication unless production configuration is supplied.
- The transcript and receipt API endpoints currently provide structured response data; they should be validated before being described or deployed as final PDF-file services.
- PayPal, NatCash, email delivery, and production payment orchestration are not documented as complete integrations in this repository.

## Project Structure

```text
app/
	admin/       Administrative pages and workflows
	api/         Authentication and document-related API routes
	component/  Shared UI, data, academic, finance, and export components
	login/       Login experience
	student/     Student portal
	teacher/     Teacher portal
	result/      Public result lookup
lib/           GPA, audit, environment, payment, and Supabase helpers
supabase/      Database migrations and Row Level Security policies
__tests__/     Automated tests
```

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
