import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from('available_dates')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return NextResponse.json({ error: 'Failed to fetch available dates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const body = await request.json();
    const { research_type, defense_type, date, status } = body;

    const { data, error } = await supabase
      .from('available_dates')
      .insert([{ research_type, defense_type, date, status }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating available date:', error);
    return NextResponse.json({ error: 'Failed to create available date' }, { status: 500 });
  }
}
