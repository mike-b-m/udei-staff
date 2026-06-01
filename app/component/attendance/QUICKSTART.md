# 🎯 Attendance System - Quick Start Guide

## Installation & Setup

### Step 1: Apply Database Migration
```bash
# Navigate to your project
cd f:\Barry\program\react\udei.admin\udei

# Apply the new migration
supabase migration up
```

The migration creates:
- `attendance_seance` - Tracks weeks/seances
- `attendance_day` - Tracks individual days
- `attendance_record` - Student attendance records
- `attendance_summary` - Cached statistics
- RLS policies and triggers

### Step 2: Navigate to the Feature
1. Open the admin panel
2. Click **"Attendance"** in the navigation menu
3. You'll see the attendance page at `/admin/attendance`

### Step 3: Create Sample Data (Optional)
Insert sample seances to test:
```sql
INSERT INTO attendance_seance (
  faculty, year_study, session, academic_year, 
  week_number, start_date, end_date
) VALUES
  ('Engineering', 1, 'intra', '2024-2025', 1, '2024-09-01', '2024-09-07'),
  ('Engineering', 1, 'intra', '2024-2025', 2, '2024-09-08', '2024-09-14'),
  ('Medicine', 2, 'final', '2024-2025', 1, '2024-12-01', '2024-12-07');
```

Then create days:
```sql
INSERT INTO attendance_day (
  seance_id, day_of_week, date_day, day_name
) VALUES
  (1, 1, '2024-09-02', 'Monday'),
  (1, 2, '2024-09-03', 'Tuesday'),
  -- ... and so on for each day
```

## Using the Attendance System

### 🔍 Filter Section
```
┌─────────────────────────────────┐
│ Faculty: [Dropdown ▼]           │
│ Year: [1-6 ▼]                   │
│ Session: [Intra/Final ▼]        │
│ Academic Year: [2024-2025 ▼]    │
└─────────────────────────────────┘
```
- Select filters to narrow down data
- Changes apply immediately
- Not cascading - select independently

### 📊 Statistics Dashboard
```
┌──────────────────────────────────────────────────────────┐
│  Students  │  Present  │  Absent  │  Excused  │  % Pres. │
│    45      │    38     │    6     │     1     │   84.4%  │
└──────────────────────────────────────────────────────────┘
```
- Updates in real-time
- Color coded for quick scanning
- Shows daily breakdowns

### 📋 Seance Selection
```
[Week 1] [Week 2] [Week 3] [Week 4] [Week 5] [Week 6] [Week 7]
```
- Click a week to view/edit attendance
- Shows Intra or Final session type
- Only available weeks are active

### 📊 Main Table
```
┌────────────────────────────────────────────────┐
│ # │ ID │ Last Name │ First Name │ Mon  │ Tue  │
├────────────────────────────────────────────────┤
│ 1 │ 501│ Doe       │ John       │  ✓   │  ✗   │
│ 2 │ 502│ Smith     │ Jane       │  ✓   │  ✓   │
└────────────────────────────────────────────────┘
```

**Status Symbols:**
- `✓` = Present (Green)
- `✗` = Absent (Red)
- `~` = Excused (Yellow)
- `-` = Not recorded

**Actions:**
- Click a cell to cycle through statuses
- Changes save automatically
- Confirmed cells show blue ring
- Cannot edit past dates

### ✅ Confirm Attendance
1. Click **"✓ Confirm Presence"** button
2. Select seance from dropdown
3. Review warning message
4. Click **"Confirm"** to lock

⚠️ **Once confirmed, attendance cannot be modified!**

### 📤 Export Data
```
┌─────────────────────┐
│ 📄 PDF    📊 Excel  │  🖨️ Print
└─────────────────────┘
```

- **PDF**: Professional report with stats and table
- **Excel**: CSV file for spreadsheet processing
- **Print**: Opens print dialog for physical copies

All exports include:
- Summary statistics
- Filter criteria
- Full attendance table
- Date generated
- Page numbers (PDF/Print)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Move to next cell |
| `Space` | Toggle status in current cell |
| `Ctrl+P` | Print |
| `Ctrl+S` | Save (auto on change) |

## Common Tasks

### Track Student Presence for a Week
1. Select Faculty: "Engineering"
2. Select Year: "1"
3. Select Session: "Intra"
4. Select Academic Year: "2024-2025"
5. Click "Week 1"
6. Click cells: Absent→Present→Excused→Absent
7. Click "✓ Confirm Presence" when done

### Generate Report for Leadership
1. Apply filters
2. Select seance
3. Click "📄 PDF"
4. Save file
5. Share report

### Find All Students Present on Monday
1. Look at Monday column (Mon)
2. Count green cells (✓)
3. Or use summary stats below table

### Fix Attendance Error
1. Find incorrect cell
2. Click to correct (if not confirmed)
3. ⚠️ If confirmed, must contact admin to unlock

## Status Colors & Meanings

```
Green (#c8e6c9)   - Present (✓)      - Student attended
Red (#ffcdd2)     - Absent (✗)       - Student did not attend
Yellow (#fff9c4)  - Excused (~)      - Legitimate absence
Gray (default)    - Not recorded (—) - No data entered
```

## Tips & Tricks

💡 **Mobile Users**: Scroll table horizontally to see all days
💡 **Bulk Changes**: Edit one student's week, then copy pattern to others
💡 **Data Backup**: Export to Excel before confirming important seances
💡 **Quick Entry**: Use Tab+Space to quickly go through cells
💡 **Check Stats**: Watch % Present change as you mark students

## Troubleshooting

### ❌ "No seances found"
- Check if academic year exists in student database
- Verify student_status records have matching year/faculty
- Check date filters are correct

### ❌ "Cannot edit cells"
- Seance may be locked (confirmed)
- Date may be in the past
- Your user role may not have permission

### ❌ "Export not working"
- Allow pop-ups in browser settings
- Check if table has data
- Try different export format

### ❌ "Statistics not updating"
- Refresh the page (F5)
- Check if changes were saved (save indicator)
- Verify database trigger is working

## Performance Tips

- 📈 **Large Classes (500+ students)**: Use filters to narrow data
- 🚀 **Speed up**: Export to Excel for offline work, then batch upload
- 💾 **Save bandwidth**: Archive old seances to separate view

## Security & Permissions

✅ **Admins/Editors**: Full access
✅ **Professors**: Can manage their own classes
❌ **Students**: Can only view their records
❌ **Public**: No access

## Data Backup

```bash
# Backup before major changes
supabase db pull > attendance_backup.sql

# Restore if needed
supabase db push < attendance_backup.sql
```

## Support & Issues

1. Check browser console for errors (F12)
2. Verify database migration applied
3. Check RLS policies in Supabase
4. Review system logs
5. Contact development team

---

**Need Help?** See the full documentation in [README.md](./README.md)
