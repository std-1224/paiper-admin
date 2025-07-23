"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export type UserRole = "client" | "admin" | "master" | "barman";

interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserWithRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data?.role as UserRole;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  }, []);

  const handleNewSession = useCallback(
    async (session: any) => {
      if (!session?.user) return;

      const role = await getUserRole(session.user.id);
      if (role) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          role: role,
        });
      }
    },
    [getUserRole]
  );

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await handleNewSession(session);
        if (window.location.pathname === "/login") {
          router.push("/dashboard");
        }
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [handleNewSession, router]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        await handleNewSession(session);
        if (window.location.pathname === "/login") {
          router.push("/dashboard");
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        router.push("/login");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [handleNewSession, router]);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
