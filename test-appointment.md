# Test Appointment Scheduling

## Purpose
Test that appointment data is being saved to both:
1. **appointments table** - core appointment details
2. **students table** - all team members with individual info

## Test Steps

### 1. Navigate to http://localhost:3000/schedule

### 2. Fill Out Form

**Step 1: Select Date, Room, Time**
- Research Type: CAPSTONE
- Defense Type: PROPOSAL  
- Date: May 11, 2026
- Room: DEFENSE ROOM
- Time: 08:00 AM - 10:00 AM

**Step 2: Enter Team Information**
- Group Code: TEST-GROUP-001
- Research Title: "Test Capstone Project"
- Adviser Name: "DR. SMITH"

**Team Members:**
1. **Team Leader:**
   - Name: "JOHN DOE"
   - Student ID: "221-1234"
   - Course-Section: "BSIT-3A"
   - Role: "TEAM LEADER"

2. **Member 1:**
   - Name: "JANE SMITH"
   - Student ID: "221-5678"
   - Course-Section: "BSIT-3A"
   - Role: "MEMBER"

3. **Member 2:**
   - Name: "BOB JOHNSON"
   - Student ID: "221-9012"
   - Course-Section: "BSIT-3B"
   - Role: "MEMBER"

### 3. Submit Appointment

Click "Submit & Generate Tracking" button

### 4. Expected Results

**appointments table should contain:**
```sql
{
  appointment_code: "CP123456",
  research_type: "CAPSTONE",
  defense_type: "PROPOSAL",
  research_title: "TEST CAPSTONE PROJECT",
  date: "2026-05-11",
  time_desc: "08:00 AM - 10:00 AM",
  room: "DEFENSE ROOM",
  status: "PENDING",
  adviser_name: "DR. SMITH",
  group_code: "TEST-GROUP-001",
  acad_year: "2026",
  tracking_number: "CP123456"
}
```

**students table should contain:**
```sql
[
  {
    appointment_code: "CP123456",
    name: "JOHN DOE",
    student_id: "221-1234",
    course_section: "BSIT-3A",
    role: "TEAM LEADER"
  },
  {
    appointment_code: "CP123456",
    name: "JANE SMITH",
    student_id: "221-5678",
    course_section: "BSIT-3A",
    role: "MEMBER"
  },
  {
    appointment_code: "CP123456",
    name: "BOB JOHNSON",
    student_id: "221-9012",
    course_section: "BSIT-3B",
    role: "MEMBER"
  }
]
```

### 5. Verification Queries

After submission, run these queries to verify:

```sql
-- Check appointment record
SELECT * FROM appointments WHERE tracking_number = 'CP123456';

-- Check students records
SELECT * FROM students WHERE appointment_code = 'CP123456';

-- Count team members
SELECT COUNT(*) FROM students WHERE appointment_code = 'CP123456';
```

### 6. Success Criteria

✅ **Appointment saved** with tracking number generated
✅ **3 student records** created in students table
✅ **Correct roles** (1 TEAM LEADER, 2 MEMBERS)
✅ **All required fields** populated (student_id, course_section)
✅ **No duplicate** student data
✅ **Proper relationships** via appointment_code

This test demonstrates that the appointment system correctly saves data to both tables as intended.
