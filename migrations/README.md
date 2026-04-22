# Database Migrations

This directory contains SQL migration files for updating the database schema.

## Available Migrations

### create_panelists_table.sql
**Purpose:** Create panelist table for defense panel members
**Created:** 2026-04-22

**Changes:**
- Creates `panelist` table with id (INT4 auto-increment), group_code, name, role, created_at, updated_at
- Stores group_code reference to appointments (no foreign key constraint due to non-unique group_code)
- Creates indexes for better performance
- Adds trigger for auto-updating updated_at timestamp
- Enables RLS with policies allowing authenticated users to perform CRUD operations

**How to run:**
```sql
-- Run the migration
psql -d your_database -f migrations/create_panelists_table.sql
```

**Or run via Supabase SQL Editor:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `create_panelists_table.sql`
3. Paste and run the SQL

### add_student_fields.sql
**Purpose:** Add student_id and course_section fields to students table, remove email field
**Created:** 2026-04-22

**Changes:**
- Adds `student_id VARCHAR(20)` field for student ID numbers (format: 221-2223)
- Adds `course_section VARCHAR(20)` field for course and section (format: BSIT-3A)
- Removes `email` field from students table
- Creates indexes on new fields for better performance

**How to run:**
```sql
-- Run the migration
psql -d your_database -f migrations/add_student_fields.sql
```

### rollback_add_student_fields.sql
**Purpose:** Rollback the add_student_fields changes
**Created:** 2026-04-22

**Changes:**
- Removes `student_id` and `course_section` fields
- Adds back `email` field
- Restores original table structure

**How to run:**
```sql
-- Run the rollback
psql -d your_database -f migrations/rollback_add_student_fields.sql
```

## Migration Process

1. **Backup your database** before running any migrations
2. **Test migrations** on a development environment first
3. **Run migration** using the appropriate SQL file
4. **Verify changes** by checking the table structure
5. **Update application code** if needed to match new schema

## Verification

After running the migration, verify the changes:

```sql
-- Check table structure
\d students

-- Verify new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('student_id', 'course_section');

-- Verify email column is removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name = 'email';
```
