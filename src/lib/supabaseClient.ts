import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { UserRole } from "@/context/AuthContext";
import { ApprovalStatus } from "@/types/types";

// Type definitions
type SupabaseClient = ReturnType<typeof createBrowserClient>;
type Profile = {
  id: string;
  role: UserRole;
  approval_status: ApprovalStatus;
};

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create a single browser client instance
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Create a server client instance
export const supabaseServerClient = createClient(supabaseUrl, supabaseAnonKey);

// Cache for role checks (TTL: 5 minutes)
const roleCache = new Map<string, { role: UserRole; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper function to check if user is admin with caching
export const isUserAdmin = async (): Promise<boolean> => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return false;

    // Check cache first
    const cachedRole = roleCache.get(user.id);
    if (cachedRole && Date.now() - cachedRole.timestamp < CACHE_TTL) {
      return cachedRole.role === "admin";
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) return false;

    // Update cache
    roleCache.set(user.id, { role: profile.role, timestamp: Date.now() });
    return profile.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Helper function to get current user's role with caching
export const getUserRole = async (): Promise<UserRole | null> => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return null;

    // Check cache first
    const cachedRole = roleCache.get(user.id);
    if (cachedRole && Date.now() - cachedRole.timestamp < CACHE_TTL) {
      return cachedRole.role;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, approval_status")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) return null;

    // Update cache
    roleCache.set(user.id, { role: profile.role, timestamp: Date.now() });
    return profile.role;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

// Get user profile with approval status
export const getUserProfile = async (): Promise<Profile | null> => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, approval_status")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) return null;

    return {
      id: user.id,
      role: profile.role,
      approval_status: profile.approval_status,
    };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// Clear role cache when user signs out
export const clearRoleCache = () => {
  roleCache.clear();
};

// Helper to create a new client instance if needed
export const createSupaClient = (): SupabaseClient => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// export const getUser = async () => {
// 	const {
// 		data: { user },
// 	} = await supabase.auth.getUser();
// 	return user;
// };

// export const signOut = async () => {
// 	const { error } = await supabase.auth.signOut();
// 	if (error) {
// 		console.error('Error signing out:', error.message);
// 	}
// };

// export const getCurrentSession = async () => {
// 	const {
// 		data: { session },
// 	} = await supabase.auth.getSession();
// 	return session;
// };
