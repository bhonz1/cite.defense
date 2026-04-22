import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('id, room, capacity')
      .order('room', { ascending: true });

    if (error) {
      console.error('Get rooms error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rooms', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(rooms || []);
  } catch (error) {
    console.error('Get rooms error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}
