import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const body = await request.json();
    const { room_code, room_name, available } = body;

    const { data, error } = await supabase
      .from('available_rooms')
      .update({ room_code, room_name, available })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating available room:', error);
    return NextResponse.json({ error: 'Failed to update available room' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
      .from('available_rooms')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting available room:', error);
    return NextResponse.json({ error: 'Failed to delete available room' }, { status: 500 });
  }
}
