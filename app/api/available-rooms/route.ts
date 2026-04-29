import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from('available_rooms')
      .select('*')
      .order('room_code', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch available rooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const body = await request.json();
    const { room_code, room_name, available } = body;

    const { data, error } = await supabase
      .from('available_rooms')
      .insert([{ room_code, room_name, available }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating available room:', error);
    return NextResponse.json({ error: 'Failed to create available room' }, { status: 500 });
  }
}
