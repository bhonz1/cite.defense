import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const body = await request.json();

    // Validate required fields
    if (!body.panelists || !Array.isArray(body.panelists)) {
      return NextResponse.json(
        { error: 'Panelists array is required' },
        { status: 400 }
      );
    }

    // Validate each panelist
    for (const panelist of body.panelists) {
      if (!panelist.group_code || !panelist.name || !panelist.role) {
        return NextResponse.json(
          { error: 'Each panelist must have group_code, name, and role' },
          { status: 400 }
        );
      }

      if (!['CHAIRMAN', 'MEMBER'].includes(panelist.role)) {
        return NextResponse.json(
          { error: 'Role must be either CHAIRMAN or MEMBER' },
          { status: 400 }
        );
      }
    }

    // Insert panelists
    const { data, error } = await supabase
      .from('panelist')
      .insert(body.panelists)
      .select();

    if (error) {
      console.error('Insert panelists error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to insert panelists',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Panelists API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { searchParams } = new URL(request.url);
    const groupCode = searchParams.get('group_code');

    let query = supabase
      .from('panelist')
      .select('*')
      .order('role', { ascending: false }); // Chairman first, then members

    if (groupCode) {
      query = query.eq('group_code', groupCode);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Fetch panelists error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch panelists',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Panelists API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
