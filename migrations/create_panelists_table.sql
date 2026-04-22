-- Create panelist table for defense panel members
-- This migration creates a table to store panelist information for each approved defense

-- Drop existing table if it exists to ensure clean slate
DROP TABLE IF EXISTS panelist CASCADE;

-- Create the function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create panelist table
CREATE TABLE panelist (
    id INT4 PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    group_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('CHAIRMAN', 'MEMBER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_panelist_group_code ON panelist(group_code);
CREATE INDEX idx_panelist_role ON panelist(role);
CREATE INDEX idx_panelist_name ON panelist(name);

-- Enable row-level security for panelist table
ALTER TABLE panelist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for panelist table

-- Allow authenticated users to insert panelists
CREATE POLICY "Allow authenticated insert" ON panelist
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to select panelists
CREATE POLICY "Allow authenticated select" ON panelist
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update panelists
CREATE POLICY "Allow authenticated update" ON panelist
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete panelists
CREATE POLICY "Allow authenticated delete" ON panelist
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_panelist_updated_at 
    BEFORE UPDATE ON panelist 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to the table and columns
COMMENT ON TABLE panelist IS 'Stores defense panel members for each approved defense appointment';
COMMENT ON COLUMN panelist.id IS 'Unique identifier for the panelist record (auto-incrementing integer)';
COMMENT ON COLUMN panelist.group_code IS 'Group code of the appointment this panelist is assigned to';
COMMENT ON COLUMN panelist.name IS 'Name of the panelist';
COMMENT ON COLUMN panelist.role IS 'Role of the panelist (CHAIRMAN or MEMBER)';
COMMENT ON COLUMN panelist.created_at IS 'Timestamp when the panelist record was created';
COMMENT ON COLUMN panelist.updated_at IS 'Timestamp when the panelist record was last updated';

-- Fallback: Disable RLS if policies don't work
-- Run this separately if you still get RLS errors
-- ALTER TABLE panelist DISABLE ROW LEVEL SECURITY;
