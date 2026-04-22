import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getTimeSlotByHour } from '@/lib/time-slots';

interface SessionData {
  id: number;
  username: string;
  name: string;
  role: string;
  exp: number;
}

async function parseSessionCookie(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<SessionData | null> {
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie?.value) return null;
  
  try {
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    const session = JSON.parse(decoded) as SessionData;
    
    if (session.exp && session.exp < Date.now()) {
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
    return null;
  }
}

// Helper to check for conflicts
const checkConflicts = async (supabase: any, date: string, timeCode: string, room: string, excludeId?: number) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('id')
    .eq('room', room)
    .eq('date', date)
    .eq('time_desc', timeCode)
    .in('status', ['PENDING', 'APPROVED']);

  if (error) return true;

  if (excludeId) {
    return data?.some((apt: any) => apt.id !== excludeId) || false;
  }
  return data && data.length > 0;
};

// GET appointments (with filters)
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { searchParams } = new URL(request.url);
    const acadYear = searchParams.get('acadYear');
    const researchType = searchParams.get('researchType');
    const defenseType = searchParams.get('defenseType');
    const status = searchParams.get('status');
    const studentName = searchParams.get('studentName');
    const trackingNumber = searchParams.get('trackingNumber');

    // Get user from session to check auth (skip for tracking requests)
    let isAuthenticated = false;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) isAuthenticated = true;
    } catch (authError) {
      console.error('Supabase auth error:', authError);
    }
    
    // Fallback: Check custom session cookie
    if (!isAuthenticated) {
      const session = await parseSessionCookie(cookieStore);
      if (session) isAuthenticated = true;
    }
    
    if (!isAuthenticated && !trackingNumber) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let query = supabase
      .from('appointments')
      .select('*');

    if (acadYear) query = query.eq('acad_year', acadYear);
    if (researchType) query = query.eq('research_type', researchType);
    if (defenseType) query = query.eq('defense_type', defenseType);
    if (status) query = query.eq('status', status);
    if (studentName) query = query.eq('student_name', studentName);
    if (trackingNumber) query = query.eq('tracking_number', trackingNumber);

    query = query.order('created_at', { ascending: false });

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Get appointments error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    // Get students for each appointment
    const appointmentsWithStudents = await Promise.all(
      (appointments || []).map(async (apt) => {
        const { data: students } = await supabase
          .from('students')
          .select('*')
          .eq('appointment_code', apt.appointment_code);
        return { ...apt, students: students || [] };
      })
    );

    return NextResponse.json(appointmentsWithStudents);
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST create appointment (public - no auth required)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const body = await request.json();
    console.log('Received appointment data:', body);
    
    const {
      acadYear,
      researchType,
      defenseType,
      researchTitle,
      dateTime,
      timeDesc,
      adviserName,
      groupCode,
      roomName,
      studentName,
      trackingNumber,
      students,
      members
    } = body;

    console.log('Extracted fields:', {
      acadYear,
      researchType,
      defenseType,
      researchTitle,
      dateTime,
      adviserName,
      groupCode,
      roomName,
      studentName,
      trackingNumber,
      students,
      members
    });

    if (!roomName || !dateTime) {
      console.error('Missing required fields:', { roomName, dateTime });
      return NextResponse.json(
        { error: 'Room and date/time are required' },
        { status: 400 }
      );
    }

    // Parse date and time from dateTime string
    const dt = new Date(dateTime);
    const dateStr = dt.toISOString().split('T')[0];

    // Use timeDesc from body if provided, otherwise calculate from hour
    let finalTimeDesc = timeDesc;
    if (!finalTimeDesc) {
      const hour = dt.getHours();
      const timeDescMap: { [key: number]: string } = {
        8: '08:00 AM - 10:00 AM',
        10: '10:00 AM - 12:00 PM',
        13: '01:00 PM - 03:00 PM',
        15: '03:00 PM - 05:00 PM'
      };
      finalTimeDesc = timeDescMap[hour];
    }

    if (!finalTimeDesc) {
      return NextResponse.json(
        { error: 'Invalid time slot' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const hasConflict = await checkConflicts(supabase, dateStr, finalTimeDesc, roomName);
    if (hasConflict) {
      return NextResponse.json(
        { error: 'This time slot is already booked for this room' },
        { status: 409 }
      );
    }

    // Generate appointment code
    const appointmentCode = trackingNumber || `APT${Date.now()}`;

    // Insert appointment
    const insertData: any = {
      appointment_code: appointmentCode,
      research_type: researchType,
      defense_type: defenseType,
      research_title: researchTitle,
      date: dateStr,
      time_desc: finalTimeDesc,
      room: roomName,
      status: 'PENDING',
      adviser_name: adviserName,
      group_code: groupCode,
      acad_year: acadYear,
      tracking_number: trackingNumber
    };

    console.log('Insert data prepared:', insertData);

    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert(insertData)
      .select()
      .single();

    console.log('Insert result:', { appointment, insertError });

    if (insertError || !appointment) {
      console.error('Create appointment error details:', {
        error: insertError,
        message: insertError?.message,
        details: insertError?.details,
        hint: insertError?.hint,
        code: insertError?.code
      });
      return NextResponse.json(
        { 
          error: 'Failed to create appointment',
          details: insertError?.message || 'Unknown database error'
        },
        { status: 500 }
      );
    }

    // Insert all students in students table
    if (students && students.length > 0) {
      const studentsToInsert = students.map((student: any) => ({
        appointment_code: appointment.appointment_code,
        name: student.name,
        student_id: student.student_id || null,
        course_section: student.course_section || null,
        role: student.role || 'MEMBER'
      })).filter((student: any) => student.name && student.student_id && student.course_section);

      if (studentsToInsert.length > 0) {
        await supabase.from('students').insert(studentsToInsert);
      }
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
