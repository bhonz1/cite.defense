"use client";

import { createClient } from "@/utils/supabase/client";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

interface AuthUser extends User {
  user_metadata: {
    id?: number;
    username?: string;
    name?: string;
    role?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Fetch session from API
async function getSessionFromAPI(): Promise<{ id: string; username: string; name: string; role: string } | null> {
  try {
    const res = await fetch('/api/auth/session');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return null;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Enhance user with metadata if available
          setUser(authUser as AuthUser);
        } else {
          // Fallback: Check session API
          const session = await getSessionFromAPI();
          if (session) {
            // Create a mock user object from session
            const mockUser = {
              id: session.id,
              email: `${session.username}@placeholder.com`,
              user_metadata: {
                id: parseInt(session.id),
                username: session.username,
                name: session.name,
                role: session.role,
              },
            } as AuthUser;
            setUser(mockUser);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
        // Fallback: Check session API
        const session = await getSessionFromAPI();
        if (session) {
          const mockUser = {
            id: session.id,
            email: `${session.username}@placeholder.com`,
            user_metadata: {
              id: parseInt(session.id),
              username: session.username,
              name: session.name,
              role: session.role,
            },
          } as AuthUser;
          setUser(mockUser);
        } else {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as AuthUser ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Supabase signout error:', error);
    }
    // Clear session via API
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
      console.error('Session delete error:', error);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
