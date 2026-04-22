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
    
    // Check if session is expired
    if (session.exp && session.exp < Date.now()) {
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
    return null;
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

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
    
    // Check if user is authenticated
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

    // Get counts in parallel
    const [
      { count: total, error: totalError },
      { count: pending, error: pendingError },
      { count: approved, error: approvedError },
      { count: rejected, error: rejectedError },
      { count: completed, error: completedError }
    ] = await Promise.all([
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED'),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'REJECTED'),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED')
    ]);

    if (totalError || pendingError || approvedError || rejectedError || completedError) {
      console.error('Stats error:', { totalError, pendingError, approvedError, rejectedError, completedError });
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      total: total || 0,
      pending: pending || 0,
      approved: approved || 0,
      rejected: rejected || 0,
      completed: completed || 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
