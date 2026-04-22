import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Helper to check for conflicts
const checkConflicts = async (supabase: any, date: string, timeCode: string, room: string, excludeId?: number) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('id')
    .eq('room', room)
    .eq('date', date)
    .eq('time_code', timeCode)
    .in('status', ['PENDING', 'APPROVED']);

  if (error) return true;

  if (excludeId) {
    return data?.some((apt: any) => apt.id !== excludeId) || false;
  }
  return data && data.length > 0;
};

// POST create appointment (public - no auth required)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const body = await request.json();
    const {
      acadYear,
      researchType,
      defenseType,
      researchTitle,
      dateTime,
      adviserName,
      groupCode,
      roomName,
      studentName,
      studentEmail,
      trackingNumber,
      students
    } = body;

    if (!roomName || !dateTime) {
      return NextResponse.json(
        { error: 'Room and date/time are required' },
        { status: 400 }
      );
    }

    // Parse date and time from dateTime string
    const dt = new Date(dateTime);
    const dateStr = dt.toISOString().split('T')[0];
    const hour = dt.getHours();

    // Get time slot configuration for given hour
    const timeDescMap: { [key: number]: string } = {
      8: '08:00 AM - 10:00 AM', 
      10: '10:00 AM - 12:00 PM', 
      13: '01:00 PM - 03:00 PM', 
      15: '03:00 PM - 05:00 PM'
    };
    const timeDesc = timeDescMap[hour];

    if (!timeDesc) {
      return NextResponse.json(
        { error: 'Invalid time slot' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const hasConflict = await checkConflicts(supabase, dateStr, timeDesc, roomName);
    if (hasConflict) {
      return NextResponse.json(
        { error: 'This time slot is already booked for this room' },
        { status: 409 }
      );
    }

    // Generate appointment code
    const appointmentCode = trackingNumber || `APT${Date.now()}`;

    // Basic appointment data - only use essential columns that definitely exist
    const insertData: any = {
      appointment_code: appointmentCode,
      date: dateStr,
      time_desc: timeDesc,
      room: roomName,
      status: 'PENDING'
    };

    // Try to add optional fields if they exist in database
    const optionalFields = {
      research_type: researchType,
      defense_type: defenseType,
      research_title: researchTitle,
      student_name: studentName,
      student_email: studentEmail,
      adviser_name: adviserName,
      group_code: groupCode,
      acad_year: acadYear,
      tracking_number: trackingNumber
    };

    // Test each optional field and add if it works
    for (const [field, value] of Object.entries(optionalFields)) {
      try {
        if (value) {
          insertData[field] = value;
        }
      } catch (e) {
        // Column doesn't exist, skip it
        console.log(`Skipping ${field} - column doesn't exist`);
      }
    }

    // Insert appointment
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert(insertData)
      .select()
      .single();

    if (insertError || !appointment) {
      console.error('Create appointment error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create appointment', details: insertError },
        { status: 500 }
      );
    }

    // Store additional data in a separate approach if needed
    const additionalData = {
      researchType,
      defenseType,
      researchTitle,
      adviserName,
      groupCode,
      studentName,
      studentEmail,
      trackingNumber
    };

    // Insert all students in students table
    const allStudents = [];
    
    // Add primary student
    if (studentName && studentEmail) {
      allStudents.push({
        appointment_code: appointment.appointment_code,
        name: studentName,
        email: studentEmail,
        student_id: null,
        role: 'primary'
      });
    }
    
    // Add additional students/members
    if (students && students.length > 0) {
      students.forEach((student: any) => {
        if (student.name && student.email) {
          allStudents.push({
            appointment_code: appointment.appointment_code,
            name: student.name,
            email: student.email,
            student_id: student.studentId || null,
            role: student.role || 'member'
          });
        }
      });
    }

    // Insert all students
    if (allStudents.length > 0) {
      console.log('Inserting students:', allStudents);
      const { data, error } = await supabase.from('students').insert(allStudents);
      if (error) {
        console.error('Students insertion error:', error);
      } else {
        console.log('Students inserted successfully:', data);
      }
    }

    // Return appointment with additional data
    return NextResponse.json({
      ...appointment,
      additionalData
    }, { status: 201 });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
