import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

interface Client {
  id: string;
  email: string;
  tenantId: string;
  companyName: string;
  role: string;
}

interface AuthContextType {
  client: Client | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchClient = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching client:', error);
        setClient(null);
      } else if (data) {
        setClient({
          id: data.id,
          email: data.email,
          tenantId: data.tenant_id,
          companyName: data.company_name,
          role: data.role,
        });
      }
    } catch (error) {
      console.error('Unexpected error fetching client:', error);
      setClient(null);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData && sessionData.session && sessionData.session.user) {
          await fetchClient(sessionData.session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      if (session && session.user) {
        await fetchClient(session.user.id);
      } else {
        setClient(null);
      }
      setIsLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchClient]);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }

      if (data.session && data.user) {
        await fetchClient(data.user.id);
      }
    } catch (error) {
      console.error('Error during sign-in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchClient]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setClient(null);
    } catch (error) {
      console.error('Error during sign-out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ client, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};