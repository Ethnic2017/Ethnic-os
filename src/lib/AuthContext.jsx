import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({ id: 'ethnic-os' });

  // Apply a session: flip auth state IMMEDIATELY (closes the first-login race),
  // then enrich the user with their role fetched from module_permissions.
  const applySession = async (session) => {
    if (session?.user) {
      const su = session.user;
      // Minimal user right away so guards pass and the UI can render
      setUser(prev => prev || {
        id: su.id,
        email: su.email,
        full_name: su.user_metadata?.full_name || su.email,
        role: 'user',
      });
      setIsAuthenticated(true);
      const u = await buildUser(su);
      setUser(u);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    // Check current session on mount
    supabase.auth.getSession()
      .then(({ data: { session } }) => applySession(session))
      .finally(() => setIsLoadingAuth(false));

    // React to login / logout / token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const buildUser = async (supabaseUser) => {
    try {
      const { data: perms } = await supabase
        .from('module_permissions')
        .select('account_type')
        .eq('user_email', supabaseUser.email)
        .single();

      const role = perms?.account_type === 'admin' ? 'admin' : 'user';

      return {
        id: supabaseUser.id,
        email: supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
        role,
      };
    } catch {
      return {
        id: supabaseUser.id,
        email: supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
        role: 'user',
      };
    }
  };

  const logout = async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    const from = encodeURIComponent(window.location.href);
    window.location.href = `/login?from=${from}`;
  };

  const checkAppState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const u = await buildUser(session.user);
      setUser(u);
      setIsAuthenticated(true);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
