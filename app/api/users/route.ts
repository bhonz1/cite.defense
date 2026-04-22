import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

interface SessionData {
  id: number;
  username: string;
  name: string;
  role: 'ADMIN' | 'SUPERADMIN' | 'PANEL';
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

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get user from session to check auth
    let isAuthenticated = false;
    let userRole: string | null = null;
    let sessionData: SessionData | null = null;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        isAuthenticated = true;
        userRole = user.user_metadata?.role;
      }
    } catch (authError) {
      console.error('Supabase auth error:', authError);
    }
    
    // Fallback: Check custom session cookie
    if (!isAuthenticated) {
      const session = await parseSessionCookie(cookieStore);
      if (session) {
        isAuthenticated = true;
        userRole = session.role;
        sessionData = session;
      }
    }
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch all users from database
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Fetch users error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(users || [], { status: 200 });

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    
    if (!userRole) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.username || !body.password || !body.fullname) {
      return NextResponse.json(
        { error: 'Username, password, and full name are required' },
        { status: 400 }
      );
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Insert user into database
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        username: body.username,
        password: hashedPassword,
        name: body.fullname,
        fullname: body.fullname,
        role: body.role || 'PANEL'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert user error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create user', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
