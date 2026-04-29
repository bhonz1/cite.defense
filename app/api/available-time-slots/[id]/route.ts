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
    const { time_slot, status } = body;

    const { data, error } = await supabase
      .from('available_time_slots')
      .update({ time_slot, status })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating available time slot:', error);
    return NextResponse.json({ error: 'Failed to update available time slot' }, { status: 500 });
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
      .from('available_time_slots')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting available time slot:', error);
    return NextResponse.json({ error: 'Failed to delete available time slot' }, { status: 500 });
  }
}
