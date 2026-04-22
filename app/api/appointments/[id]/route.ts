import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
const checkConflicts = async (supabase: any, date: string, timeDesc: string, room: string, excludeId?: number) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('id')
    .eq('room', room)
    .eq('date', date)
    .eq('time_desc', timeDesc)
    .in('status', ['PENDING', 'APPROVED']);

  if (error) return true;

  if (excludeId) {
    return data?.some((apt: any) => apt.id !== excludeId) || false;
  }
  return data && data.length > 0;
};

// GET single appointment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { id } = await params;

    // Get user from session to check auth
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
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Get members
    const { data: members } = await supabase
      .from('members')
      .select('*')
      .eq('appointment_id', id);

    return NextResponse.json({
      ...appointment,
      members: members || []
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

// PATCH update appointment (Admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { id } = await params;

    // Get user from session to check auth
    let userRole: string | null = null;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userRole = user.user_metadata?.role;
      }
    } catch (authError) {
      console.error('Supabase auth error:', authError);
    }
    
    // Fallback: Check custom session cookie
    if (!userRole) {
      const session = await parseSessionCookie(cookieStore);
      if (session) {
        userRole = session.role;
      }
    }
    
    if (!userRole) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, dateTime, roomName } = body;

    // Get current appointment
    const { data: currentAppt, error: fetchError } = await supabase
      .from('appointments')
      .select('room, date, time_desc')
      .eq('id', id)
      .single();

    if (fetchError || !currentAppt) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (roomName) updateData.room = roomName;

    if (dateTime) {
      const dt = new Date(dateTime);
      updateData.date = dt.toISOString().split('T')[0];
      const hour = dt.getHours();
      const timeDescMap: { [key: number]: string } = {
        8: '08:00 AM - 10:00 AM',
        10: '10:00 AM - 12:00 PM',
        13: '01:00 PM - 03:00 PM',
        15: '03:00 PM - 05:00 PM'
      };
      updateData.time_desc = timeDescMap[hour];

      // Check for conflicts if rescheduling
      const hasConflict = await checkConflicts(
        supabase,
        updateData.date,
        updateData.time_desc,
        roomName || currentAppt.room,
        parseInt(id)
      );

      if (hasConflict) {
        return NextResponse.json(
          { error: 'This time slot is already booked' },
          { status: 409 }
        );
      }
    }

    const { data: appointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !appointment) {
      console.error('Update appointment error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    // Get members
    const { data: members } = await supabase
      .from('members')
      .select('*')
      .eq('appointment_id', id);

    return NextResponse.json({
      ...appointment,
      members: members || []
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE appointment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { id } = await params;

    // Get user from session to check auth
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
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if appointment exists and get group_code and appointment_code
    const { data: existing, error: checkError } = await supabase
      .from('appointments')
      .select('id, group_code, appointment_code')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Delete panelists using group_code
    if (existing.group_code) {
      await supabase
        .from('panelist')
        .delete()
        .eq('group_code', existing.group_code);
    }

    // Delete students using appointment_code
    if (existing.appointment_code) {
      await supabase
        .from('students')
        .delete()
        .eq('appointment_code', existing.appointment_code);
    }

    // Delete appointment
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete appointment error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
