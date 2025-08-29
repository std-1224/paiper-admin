import { supabase as supabaseServerClient } from "@/lib/supabaseClient";

// Interface for audit log entry
export interface AuditLogEntry {
  id?: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  action: 'create' | 'update' | 'delete' | 'cancel';
  action_type: 'role' | 'staff_role_assignment' | 'permission' | 'balance_update' | 'order_cancellation' | 'stock_update';
  target_type: 'role' | 'user' | 'permission' | 'order' | 'product' | 'ingredient' | 'recipe';
  target_id: string;
  target_name: string;
  description: string;
  changes_before?: any;
  changes_after?: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  status?: 'success' | 'failed' | 'pending';
  error_message?: string;
}

// Helper function to create audit log entries
export async function createAuditLog(entry: AuditLogEntry): Promise<boolean> {
  try {
    const { error } = await supabaseServerClient
      .from('audit_log')
      .insert({
        user_id: entry.user_id,
        user_name: entry.user_name,
        user_email: entry.user_email,
        user_role: entry.user_role,
        action: entry.action,
        action_type: entry.action_type,
        target_type: entry.target_type,
        target_id: entry.target_id,
        target_name: entry.target_name,
        description: entry.description,
        changes_before: entry.changes_before,
        changes_after: entry.changes_after,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        session_id: entry.session_id,
        status: entry.status || 'success',
        error_message: entry.error_message
      })

    if (error) {
      console.error('Error creating audit log:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in createAuditLog helper:', error)
    return false
  }
}

// Helper function to get current user info for audit logging
export async function getCurrentUserInfo(userId?: string): Promise<{
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
} | null> {
  try {
    if (!userId) {
      // Try to get from auth context if available
      const { data: { user }, error: userError } = await supabaseServerClient.auth.getUser()
      if (userError || !user) {
        return null
      }
      userId = user.id
    }

    const { data: profile, error: profileError } = await supabaseServerClient
      .from('profiles')
      .select('id, name, email, role')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return null
    }

    return {
      user_id: profile.id,
      user_name: profile.name || profile.email.split('@')[0],
      user_email: profile.email,
      user_role: profile.role || 'user'
    }
  } catch (error) {
    console.error('Error getting current user info:', error)
    return null
  }
}

// Helper function to get user info by email
export async function getUserInfoByEmail(email: string): Promise<{
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
} | null> {
  try {
    const { data: profile, error: profileError } = await supabaseServerClient
      .from('profiles')
      .select('id, name, email, role')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (profileError || !profile) {
      return null
    }

    return {
      user_id: profile.id,
      user_name: profile.name || profile.email.split('@')[0],
      user_email: profile.email,
      user_role: profile.role || 'user'
    }
  } catch (error) {
    console.error('Error getting user info by email:', error)
    return null
  }
}
