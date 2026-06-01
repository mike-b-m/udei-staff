# Attendance/Presence Tracking System

A comprehensive attendance management system for tracking student presence/absence across seances (weeks).

## Features

### 📊 Dashboard Overview
- **Summary Statistics**: Display total students, present, absent, excused, and attendance percentage
- **Real-time Updates**: Automatic calculation of attendance metrics
- **Status Indicators**: Visual color-coded representation (Green=Present, Red=Absent, Yellow=Excused)

### 🔍 Advanced Filtering
- Filter by **Faculty**
- Filter by **Year of Study** (1-6)
- Filter by **Session Type** (Intra, Final)
- Filter by **Academic Year**
- Non-cascading filters for flexibility

### 📋 Attendance Tracking
- **Seance Selection**: Choose specific week (S1-S7) for Intra or Final sessions
- **7-Day Weeks**: Track attendance for 7 consecutive days per seance
- **Column Headers**: Display day name and date for each column
- **Status Per Student**: View attendance for each student across all days
- **Daily Statistics**: See total present/absent for each day

### ✏️ Attendance Management
- **Click-to-Toggle**: Click cells to cycle through: Absent → Present → Excused
- **Date-Based Editing**: Only allow modifications for current and future dates
- **Confirm Functionality**: Lock seance after confirming to prevent modifications
- **Undo Option**: Skip button to revert changes (if not confirmed)

### 📤 Export Options
- **PDF Export**: Generate professional PDF reports with statistics
- **Excel/CSV Export**: Download as CSV for spreadsheet processing
- **Print**: Direct browser print functionality
- **Summary Included**: All exports include summary statistics

### 📱 Responsive Design
- **Laptop**: Full-featured table with all columns visible
- **Tablet**: Scrollable table with key information visible
- **Mobile**: Optimized layout with essential data
- **Sticky Headers**: Column headers remain visible while scrolling

## Data Structure

### Tables

#### `attendance_seance`
```sql
{
  id: number
  faculty: string
  year_study: number
  session: 'intra' | 'final'
  academic_year: string
  week_number: number (1-7)
  start_date: date
  end_date: date
  is_locked: boolean
}
```

#### `attendance_day`
```sql
{
  id: number
  seance_id: number
  day_of_week: number (1-7: Mon-Sun)
  date_day: date
  day_name: string
  is_completed: boolean
}
```

#### `attendance_record`
```sql
{
  id: number
  day_id: number
  student_id: number
  status: 'present' | 'absent' | 'excused'
  notes: string (optional)
  confirmed: boolean
  confirmed_at: timestamp (optional)
  confirmed_by: uuid (optional)
}
```

#### `attendance_summary`
```sql
{
  id: number
  seance_id: number
  student_id: number
  total_days: number
  total_present: number
  total_absent: number
  total_excused: number
  percentage_present: number
}
```

## Component Architecture

### Page Component
- **Location**: `app/admin/attendance/page.tsx`
- **Role**: Main container managing state and orchestrating sub-components

### Sub-Components

#### AttendanceFilter
- Manages filter controls for Faculty, Year, Session, Academic Year
- Updates parent state on change
- Loads dynamic options from database

#### AttendanceSummary
- Displays 5-card statistics grid
- Shows: Total Students, Present, Absent, Excused, % Present
- Color-coded based on percentage thresholds

#### AttendanceTable
- Main data grid showing all students and their attendance
- Horizontal scrolling for day columns
- Click-to-change status functionality
- Sticky headers for easy navigation

#### AttendanceActions
- Seance selection buttons
- Confirm/Skip action buttons
- Export buttons (PDF, Excel, Print)
- Modal confirmation for seance locking

### Hooks

#### useAttendance
- Manages all attendance data fetching and state
- Handles status updates and confirmations
- Provides loading/error states
- Auto-recalculates statistics on data changes

### Utilities

#### `utils.ts`
- `fetchSeances()` - Get seances by filters
- `fetchDaysForSeance()` - Get days for a seance
- `calculateStats()` - Compute statistics
- `isSeanceLocked()` - Check if past modification deadline

#### `exportAttendance.ts`
- `generateAttendanceHTML()` - Create printable HTML
- `downloadAttendanceAsCSV()` - Export to CSV
- `downloadAttendanceAsPDF()` - Export to PDF format
- `generateAttendanceTableHTML()` - Create data table HTML

## Usage

### Navigate to Attendance Page
```
Admin Dashboard → Attendance
```

### Select Filters
1. Choose Faculty
2. Select Year of Study
3. Choose Session (Intra/Final)
4. Select Academic Year

### Select Seance
Click on a week button (1-7) to view attendance for that week

### Record Attendance
1. Click a cell to toggle status (A → P → E → A)
2. Changes are saved automatically
3. Cell rings when confirmed (blue border)

### Confirm Seance
1. Review all data for the week
2. Click "Confirm Presence" button
3. Select the seance from dropdown
4. Click "Confirm" in modal (WARNING: Cannot be undone!)

### Export Data
1. Select desired format: PDF, Excel, or Print
2. Browser will download or open print dialog
3. For PDF: Save from print dialog
4. For Excel: Open CSV in spreadsheet application

## Limitations & Constraints

- ❌ Cannot modify attendance after seance end date
- ❌ Cannot modify attendance after confirmation
- ✅ Can only confirm seances with data
- ✅ Must have at least one day in seance to track
- ✅ Summary updates automatically on each change

## Row-Level Security (RLS)

- **Admin/Editor**: Full access to all operations
- **Professor**: Can view and edit attendance for their classes
- **Students**: Can view only their own attendance records

## Performance Optimizations

- ✅ Indexed queries on `seance_id`, `student_id`, `date`
- ✅ Cached summary table for quick statistics
- ✅ Automatic trigger updates on record changes
- ✅ Lazy loading of large datasets
- ✅ Table virtualization for 1000+ students

## Future Enhancements

- [ ] Bulk import from Excel
- [ ] Email notifications for low attendance
- [ ] Attendance trends/analytics
- [ ] Mobile app for QR code scanning
- [ ] API integration with external systems
- [ ] Attendance policies enforcement
- [ ] Parent notifications
- [ ] Archive old attendance data

## Database Migrations

The attendance system requires the migration file:
```sql
supabase/migrations/006_attendance_system.sql
```

Apply with:
```bash
supabase migration up
```

## Troubleshooting

### No seances appear
- Check if academic year exists in student_status table
- Verify year_study and faculty match

### Cannot edit cells
- Seance may be locked (check end date)
- Your role may not have permission
- Day may be in the past

### Export not working
- Ensure pop-ups are allowed
- Check browser console for errors
- Verify rows have data

### Statistics not updating
- Refresh the page
- Check database trigger execution
- Verify RLS policies allow updates

## API Endpoints (Supabase)

All data is managed via Supabase PostgREST API:
- `POST /rest/v1/attendance_seance` - Create seance
- `GET /rest/v1/attendance_seance` - Get seances
- `GET /rest/v1/attendance_record` - Get records
- `POST /rest/v1/attendance_record` - Record attendance
- `GET /rest/v1/attendance_summary` - Get summary stats

## Support

For issues or questions, contact the development team or check the system logs.
