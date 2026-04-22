import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

interface SessionData {
  id: number;
  username: string;
  role: string;
  name: string;
  exp: number;
}

function parseSessionCookie(request: NextRequest): SessionData | null {
  const sessionCookie = request.cookies.get('session');
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

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const path = request.nextUrl.pathname;

  // If supabase client couldn't be created, just return the response
  if (!supabase) {
    return response;
  }

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  let user = null;
  let userRole = null;
  
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      user = authUser;
      userRole = authUser.user_metadata?.role;
    }
  } catch (error) {
    console.error("Supabase auth error:", error);
  }

  // Fallback: Check custom session cookie
  if (!user) {
    const session = parseSessionCookie(request);
    if (session) {
      user = { id: session.id } as any; // Mock user object
      userRole = session.role;
    }
  }

  // Protect admin routes - check if user has admin role
  if (path.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/student", request.url));
    }
  }

  // Note: Student route is now public for scheduling defenses without login
  // Only tracking/status check requires auth (handled client-side)

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
