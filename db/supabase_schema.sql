-- Defense Appointment System - Complete Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop all existing tables if they exist
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    fullname VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'ADMIN', 'SUPERADMIN', 'PANEL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rooms Table
DROP TABLE IF EXISTS rooms CASCADE;
CREATE TABLE rooms (
    id INT4 PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    room_code VARCHAR(50) UNIQUE NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointments Table (Updated with time_desc)
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    appointment_code VARCHAR(50) UNIQUE NOT NULL,
    research_type VARCHAR(50) NOT NULL CHECK (research_type IN ('CAPSTONE', 'THESIS')),
    defense_type VARCHAR(50) NOT NULL CHECK (defense_type IN ('PROPOSAL', 'FINAL')),
    research_title TEXT NOT NULL,
    date DATE NOT NULL,
    time_desc VARCHAR(50) NOT NULL CHECK (time_desc IN (
        '08:00 AM - 10:00 AM',
        '10:00 AM - 12:00 PM', 
        '01:00 PM - 03:00 PM',
        '03:00 PM - 05:00 PM'
    )),
    room VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'NOT APPROVED')),
    adviser_name VARCHAR(100) NOT NULL,
    group_code VARCHAR(50) NOT NULL,
    acad_year VARCHAR(20) NOT NULL,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    student_email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Students Table (Updated with appointment_code reference)
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    appointment_code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    student_id VARCHAR(50),
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_rooms_room_code ON rooms(room_code);
CREATE INDEX idx_rooms_available ON rooms(available);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_room ON appointments(room);
CREATE INDEX idx_appointments_code ON appointments(appointment_code);
CREATE INDEX idx_appointments_acad_year ON appointments(acad_year);
CREATE INDEX idx_appointments_group_code ON appointments(group_code);
CREATE INDEX idx_appointments_tracking_number ON appointments(tracking_number);
CREATE INDEX idx_appointments_time_desc ON appointments(time_desc);
CREATE INDEX idx_appointments_research_type ON appointments(research_type);
CREATE INDEX idx_appointments_defense_type ON appointments(defense_type);
CREATE INDEX idx_students_appointment_code ON students(appointment_code);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_role ON students(role);

-- Set up Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Allow public read access to users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Allow admin insert on users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin update on users" ON users
    FOR UPDATE USING (true);

CREATE POLICY "Allow admin delete on users" ON users
    FOR DELETE USING (true);

-- Rooms table policies
CREATE POLICY "Allow public read access to rooms" ON rooms
    FOR SELECT USING (true);

CREATE POLICY "Allow admin insert on rooms" ON rooms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin update on rooms" ON rooms
    FOR UPDATE USING (true);

CREATE POLICY "Allow admin delete on rooms" ON rooms
    FOR DELETE USING (true);

-- Students table policies
CREATE POLICY "Allow public read access to students" ON students
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on students" ON students
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin update on students" ON students
    FOR UPDATE USING (true);

CREATE POLICY "Allow admin delete on students" ON students
    FOR DELETE USING (true);

-- Appointments table policies
CREATE POLICY "Allow public read access to appointments" ON appointments
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on appointments" ON appointments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin update on appointments" ON appointments
    FOR UPDATE USING (true);

CREATE POLICY "Allow admin delete on appointments" ON appointments
    FOR DELETE USING (true);

-- Insert default admin user
INSERT INTO users (username, password, name, fullname, role) VALUES
    ('admin', 'admin123', 'Administrator', 'System Administrator', 'ADMIN');

-- Insert default rooms
INSERT INTO rooms (room_code, room_name) VALUES
    ('ITE102', 'ITE102'),
    ('DEFENSE_ROOM', 'DEFENSE ROOM'),
    ('ITE201', 'ITE201'),
    ('ITE202', 'ITE202'),
    ('ITE203', 'ITE203');

-- Insert sample appointments (for testing)
INSERT INTO appointments (
    appointment_code, research_type, defense_type, research_title, date, time_desc, room, status,
    adviser_name, group_code, acad_year, tracking_number, student_name, student_email
) VALUES
    ('APT20240511001', 'CAPSTONE', 'PROPOSAL', 'IoT-Based Home Automation System', '2026-05-11', '08:00 AM - 10:00 AM', 'ITE102', 'PENDING',
     'Dr. Smith', 'GRP001', '2024-2025', 'TRK-20240511001', 'John Doe', 'john.doe@example.com'),
    ('APT20240512001', 'CAPSTONE', 'PROPOSAL', 'Machine Learning for Healthcare', '2026-05-12', '10:00 AM - 12:00 PM', 'ITE201', 'APPROVED',
     'Dr. Johnson', 'GRP002', '2024-2025', 'TRK-20240512001', 'Jane Smith', 'jane.smith@example.com'),
    ('APT20240518001', 'THESIS', 'FINAL', 'Advanced AI Algorithms', '2026-05-18', '01:00 PM - 03:00 PM', 'DEFENSE_ROOM', 'PENDING',
     'Dr. Brown', 'GRP003', '2024-2025', 'TRK-20240518001', 'Mike Wilson', 'mike.wilson@example.com');

-- Insert sample students (for testing)
INSERT INTO students (appointment_code, name, email, student_id, role) VALUES
    ('APT20240511001', 'John Doe', 'john.doe@example.com', '2021001', 'primary'),
    ('APT20240511001', 'Alice Johnson', 'alice.johnson@example.com', '2021002', 'member'),
    ('APT20240511001', 'Bob Smith', 'bob.smith@example.com', '2021003', 'member'),
    ('APT20240512001', 'Jane Smith', 'jane.smith@example.com', '2021004', 'primary'),
    ('APT20240512001', 'Carol Davis', 'carol.davis@example.com', '2021005', 'member'),
    ('APT20240518001', 'Mike Wilson', 'mike.wilson@example.com', '2021006', 'primary'),
    ('APT20240518001', 'Tom Anderson', 'tom.anderson@example.com', '2021007', 'member'),
    ('APT20240518001', 'Sarah Miller', 'sarah.miller@example.com', '2021008', 'member');

-- Comments for documentation
COMMENT ON TABLE users IS 'Users table for authentication and role management';
COMMENT ON TABLE rooms IS 'Rooms table for defense venue management';
COMMENT ON TABLE appointments IS 'Appointments table for defense scheduling with all variables';
COMMENT ON TABLE students IS 'Students table for all team members in appointments';
COMMENT ON COLUMN appointments.status IS 'Appointment status: PENDING, APPROVED, or NOT APPROVED';
COMMENT ON COLUMN appointments.time_desc IS 'Time slot descriptions: 08:00 AM - 10:00 AM, 10:00 AM - 12:00 PM, 01:00 PM - 03:00 PM, 03:00 PM - 05:00 PM';
COMMENT ON COLUMN appointments.group_code IS 'Group code for the appointment team';
COMMENT ON COLUMN appointments.tracking_number IS 'Unique tracking number for appointment tracking';
COMMENT ON COLUMN students.role IS 'Student role: primary (leader) or member (team member)';
COMMENT ON COLUMN students.appointment_code IS 'Reference to appointment_code in appointments table';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for appointment details with students
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
    a.*,
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'id', s.id,
            'name', s.name,
            'email', s.email,
            'student_id', s.student_id,
            'role', s.role,
            'created_at', s.created_at
        ) ORDER BY s.role DESC, s.name ASC
    ) AS students,
    COUNT(s.id) as team_size
FROM appointments a
LEFT JOIN students s ON a.appointment_code = s.appointment_code
GROUP BY a.id, a.appointment_code, a.research_type, a.defense_type, a.research_title, 
         a.date, a.time_desc, a.room, a.status, a.adviser_name, a.group_code, 
         a.acad_year, a.tracking_number, a.student_name, a.student_email, 
         a.created_at, a.updated_at;

COMMENT ON VIEW appointment_details IS 'View of appointments with associated students and team size';

-- Schema setup complete
