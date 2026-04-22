import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface SessionData {
  id: number;
  username: string;
  name: string;
  role: string;
  exp: number;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ user: null });
    }
    
    // Decode session
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    const session = JSON.parse(decoded) as SessionData;
    
    // Check expiration
    if (session.exp && session.exp < Date.now()) {
      return NextResponse.json({ user: null });
    }
    
    return NextResponse.json({
      user: {
        id: session.id.toString(),
        username: session.username,
        name: session.name,
        role: session.role,
      }
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ user: null });
  }
}

export async function DELETE() {
  // Clear session cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
