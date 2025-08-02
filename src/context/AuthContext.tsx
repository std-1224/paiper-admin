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
import { ApprovalStatus } from "@/types/types";

export type UserRole = "client" | "admin" | "master" | "barman" | "manager";

interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  approval_status: ApprovalStatus;
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

  const getUserProfile = useCallback(async (userId: string) => {
    try {

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Database query timeout after 3 seconds'));
        }, 300);
      });

      // Race between the query and timeout
      const queryPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      let data, error;
      try {
        const result = await Promise.race([queryPromise, timeoutPromise]);
        data = result.data;
        error = result.error;
      } catch (timeoutError) {
        console.error("Query timed out:", timeoutError);
        // Return null on timeout to prevent hanging
        return null;
      }

      if (error) {
        // If profile doesn't exist, create one with pending status
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              role: 'client',
              approval_status: 'pending'
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating profile:", createError);
            return null;
          }
          return {
            role: newProfile.role as UserRole,
            approval_status: newProfile.approval_status as ApprovalStatus
          };
        }
        throw error;
      }

      return data ? {
        role: data.role as UserRole,
        approval_status: data.approval_status as ApprovalStatus
      } : null;
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return null;
    }
  }, []);

  const handleNewSession = useCallback(
    async (session: any) => {
      setTimeout(async () => {
      
      if (!session?.user) return;
      const profile = await getUserProfile(session.user.id);
      if (profile) {
        // Check if user is approved
        if (profile.approval_status === ApprovalStatus.Pending) {
          // User is not approved, sign them out and redirect to login with me
          // ssage
          await supabase.auth.signOut();
          setUser(null);
          router.push("/login?status=pending");
          return;
        }

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          role: profile.role,
          approval_status: profile.approval_status,
        });
      }
      }, 300);
    },
    [getUserProfile, router]
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
        // Get user profile to check approval status directly from supabase
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, approval_status")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            console.error("Profile error:", profileError);
            await supabase.auth.signOut();
            setUser(null);
            router.push("/login");
            return;
          }

          if (!profile) {
            console.error("No profile found");
            await supabase.auth.signOut();
            setUser(null);
            router.push("/login");
            return;
          }

          // Check if user is approved
          if (profile.approval_status === ApprovalStatus.Pending || profile.approval_status === 'pending') {
            // User is not approved, sign them out and redirect to login with message
            await supabase.auth.signOut();
            setUser(null);
            router.push("/login?status=pending");
            return;
          }

          // User is approved, set user data
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            role: profile.role,
            approval_status: profile.approval_status,
          });

          // Don't redirect if we're already on login or auth callback pages
          if (window.location.pathname === "/login" || window.location.pathname === "/auth/callback") {
            router.push("/dashboard");
          }
        } catch (profileError) {
          console.error("Error fetching profile:", profileError);
          await supabase.auth.signOut();
          setUser(null);
          router.push("/login");
        }
      } else {
        setUser(null);
        // No session, redirect to login if not already there
        if (window.location.pathname !== "/login" && window.location.pathname !== "/auth/callback") {
          router.push("/login");
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      setUser(null);
      if (window.location.pathname !== "/login" && window.location.pathname !== "/auth/callback") {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {

      // Only handle SIGNED_IN events that are not INITIAL_SESSION
      // INITIAL_SESSION is handled by initializeAuth
      if (event === "SIGNED_IN" && session) {
        // This handles new sign-ins (like OAuth callback)
        await handleNewSession(session);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        // Only redirect to login if we're not already there or on callback page
        if (window.location.pathname !== "/login" && window.location.pathname !== "/auth/callback") {
          router.push("/login");
        }
      }
      // Ignore INITIAL_SESSION - let initializeAuth handle it
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
