import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from('available_time_slots')
      .select('*')
      .order('time_slot', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    return NextResponse.json({ error: 'Failed to fetch available time slots' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const body = await request.json();
    const { time_slot, status } = body;

    const { data, error } = await supabase
      .from('available_time_slots')
      .insert([{ time_slot, status }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating available time slot:', error);
    return NextResponse.json({ error: 'Failed to create available time slot' }, { status: 500 });
  }
}
