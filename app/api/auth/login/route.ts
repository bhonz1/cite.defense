import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { username, password } = await request.json();

    console.log('Login attempt for username:', username);

    if (!username || !password) {
      console.log('Missing username or password');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Query user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, name, role, password')
      .eq('username', username)
      .single();

    console.log('User query result:', { user, error });

    if (error || !user) {
      console.log('User not found or database error:', error);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    console.log('User found:', { id: user.id, username: user.username, name: user.name, role: user.role });
    console.log('Stored password hash:', user.password);

    // Check if password is stored as bcrypt hash or plaintext
    let isPasswordValid = false;

    if (user.password.startsWith('$2')) {
      // Password is bcrypt hashed
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Bcrypt password validation result:', isPasswordValid);
    } else {
      // Password is stored as plaintext (for legacy users)
      isPasswordValid = password === user.password;
      console.log('Plaintext password validation result:', isPasswordValid);
    }

    if (!isPasswordValid) {
      console.log('Invalid password');
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create a session token for the user
    const sessionToken = Buffer.from(JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    })).toString('base64');

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      }
    });

    // Set the session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    console.log('Login successful, session token length:', sessionToken.length);
    console.log('User role:', user.role);
    console.log('Response cookies set');

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
