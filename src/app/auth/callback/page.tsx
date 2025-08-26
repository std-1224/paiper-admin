"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ApprovalStatus } from "@/types/types";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          router.push("/login");
          return;
        }

        if (!session?.user) {
          router.push("/login");
          return;
        }

        // Check user approval status
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("approval_status")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          console.error("Profile error:", profileError);
          router.push("/login");
          return;
        }

        // If user is not approved, sign them out and redirect to login with message
        if (!profile || profile.approval_status === ApprovalStatus.Pending) {
          await supabase.auth.signOut();
          router.push("/login?status=pending");
          return;
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        router.push("/login");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Verificando tu cuenta...</p>
      </div>
    </div>
  );
}
