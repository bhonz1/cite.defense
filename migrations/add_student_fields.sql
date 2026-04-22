-- Migration: Add student_id and course_section fields to students table
-- Remove email field from students table
-- Created: 2026-04-22

-- Add student_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'student_id'
    ) THEN
        ALTER TABLE students ADD COLUMN student_id VARCHAR(20);
        RAISE NOTICE 'Added student_id column';
    END IF;
END $$;

-- Add course_section column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'course_section'
    ) THEN
        ALTER TABLE students ADD COLUMN course_section VARCHAR(20);
        RAISE NOTICE 'Added course_section column';
    END IF;
END $$;

-- Update existing records to have default values (if needed)
UPDATE students 
SET student_id = COALESCE(student_id, 'TEMP-ID'), 
    course_section = COALESCE(course_section, 'TEMP-SECTION');

-- Make student_id NOT NULL if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'student_id'
    ) THEN
        ALTER TABLE students ALTER COLUMN student_id SET NOT NULL;
    END IF;
END $$;

-- Make course_section NOT NULL if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'course_section'
    ) THEN
        ALTER TABLE students ALTER COLUMN course_section SET NOT NULL;
    END IF;
END $$;

-- Drop the dependent view first
DROP VIEW IF EXISTS appointment_details;

-- Remove the email column from students table
ALTER TABLE students 
DROP COLUMN IF EXISTS email;

-- Remove student_name and student_email from appointments table
ALTER TABLE appointments 
DROP COLUMN IF EXISTS student_name,
DROP COLUMN IF EXISTS student_email;

-- Add comments for documentation
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'student_id'
    ) THEN
        COMMENT ON COLUMN students.student_id IS 'Student ID number in format like 221-2223';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'course_section'
    ) THEN
        COMMENT ON COLUMN students.course_section IS 'Course and section in format like BSIT-3A';
    END IF;
END $$;

-- Create indexes for better performance
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'student_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'course_section'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_students_course_section ON students(course_section);
    END IF;
END $$;
