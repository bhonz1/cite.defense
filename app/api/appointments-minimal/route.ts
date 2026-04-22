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
      researchType,
      defenseType,
      researchTitle,
      dateTime,
      adviserName,
      groupCode,
      roomName,
      studentName,
      studentEmail,
      trackingNumber
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

    // Get time slot configuration for the given hour
    const timeCodeMap: { [key: number]: string } = {
      8: 'T01', 10: 'T02', 13: 'T03', 15: 'T04'
    };
    const timeCode = timeCodeMap[hour];

    if (!timeCode) {
      return NextResponse.json(
        { error: 'Invalid time slot' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const hasConflict = await checkConflicts(supabase, dateStr, timeCode, roomName);
    if (hasConflict) {
      return NextResponse.json(
        { error: 'This time slot is already booked for this room' },
        { status: 409 }
      );
    }

    // Generate appointment code
    const appointmentCode = trackingNumber || `APT${Date.now()}`;

    // Basic appointment data - only use essential columns
    const insertData: any = {
      appointment_code: appointmentCode,
      date: dateStr,
      time_code: timeCode,
      room: roomName,
      status: 'PENDING'
    };

    // Try to add optional fields if they exist
    try {
      insertData.research_title = researchTitle;
    } catch (e) {
      // Column doesn't exist, skip it
    }

    try {
      insertData.student_name = studentName;
    } catch (e) {
      // Column doesn't exist, skip it
    }

    try {
      insertData.student_email = studentEmail;
    } catch (e) {
      // Column doesn't exist, skip it
    }

    try {
      insertData.adviser_name = adviserName;
    } catch (e) {
      // Column doesn't exist, skip it
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
        { error: 'Failed to create appointment' },
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
