-- Rollback Migration: Remove student_id and course_section fields, add back email field
-- Created: 2026-04-22

-- Drop the new columns
ALTER TABLE students 
DROP COLUMN IF EXISTS student_id,
DROP COLUMN IF EXISTS course_section;

-- Add back the email column
ALTER TABLE students 
ADD COLUMN email VARCHAR(255);

-- Update existing records to have default email (if needed)
UPDATE students 
SET email = 'temp@example.com' 
WHERE email IS NULL;

-- Make email NOT NULL after updating existing records
ALTER TABLE students 
ALTER COLUMN email SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN students.email IS 'Student email address';
