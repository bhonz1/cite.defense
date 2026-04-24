import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { toApiFormat } from '@/lib/time-slots';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const room = searchParams.get('room');

    if (!date || !room) {
      return NextResponse.json(
        { error: 'Date and room are required' },
        { status: 400 }
      );
    }

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json([]);
    }

    // Get time slots from centralized configuration
    const timeSlots = toApiFormat();

    // Get booked time slots for this date and room
    const { data: bookedSlots, error: slotsError } = await supabase
      .from('appointments')
      .select('time_desc')
      .eq('room', room)
      .in('status', ['PENDING', 'APPROVED'])
      .eq('date', date);

    if (slotsError) {
      console.error('Get available slots error:', slotsError);
      return NextResponse.json(
        { error: 'Failed to fetch available slots' },
        { status: 500 }
      );
    }

    const bookedTimeDescs = bookedSlots?.map(row => row.time_desc) || [];
    const availableSlots = timeSlots.filter(slot => !bookedTimeDescs.includes(slot.time));

    return NextResponse.json(availableSlots);
  } catch (error) {
    console.error('Get available slots error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}
