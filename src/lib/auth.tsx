import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setLoading(false);
      }
    };

    // Fallback: never stay stuck on the loading spinner
    const timeout = window.setTimeout(finish, 2000);

    try {
      supabase.auth
        .getSession()
        .then(({ data, error }) => {
          if (!error) setSession(data.session);
        })
        .catch(() => {})
        .finally(finish);

      const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
        (async () => {
          setSession(sess);
          finish();
        })();
      });

      return () => {
        window.clearTimeout(timeout);
        sub.subscription.unsubscribe();
      };
    } catch {
      finish();
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const value = useMemo<AuthCtx>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    signIn,
    signUp,
    signOut,
  }), [session, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
