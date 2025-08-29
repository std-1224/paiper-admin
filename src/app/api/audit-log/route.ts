import { NextRequest, NextResponse } from 'next/server'
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";
import { AuditLogEntry } from "@/lib/auditLogger";

// GET - Fetch audit log entries with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters for filtering
    const user = searchParams.get('user') || ''
    const role = searchParams.get('role') || ''
    const action = searchParams.get('action') || ''
    const actionType = searchParams.get('action_type') || ''
    const dateFrom = searchParams.get('date_from') || ''
    const dateTo = searchParams.get('date_to') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build the query
    let query = supabaseServerClient
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (user) {
      query = query.or(`user_name.ilike.%${user}%,user_email.ilike.%${user}%,target_name.ilike.%${user}%`)
    }
    
    if (role) {
      query = query.eq('user_role', role)
    }
    
    if (action) {
      query = query.eq('action', action)
    }
    
    if (actionType) {
      query = query.eq('action_type', actionType)
    }
    
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: auditLogs, error } = await query

    if (error) {
      console.error('Error fetching audit logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      )
    }

    // Transform the data to match the frontend interface
    const transformedLogs = auditLogs?.map(log => ({
      id: log.id,
      user: log.user_name,
      userRole: log.user_role,
      action: log.action,
      actionType: log.action_type,
      targetName: log.target_name,
      details: log.description,
      timestamp: new Date(log.created_at).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(',', ''),
      ipAddress: log.ip_address || 'N/A',
      status: log.status,
      changes: {
        before: log.changes_before,
        after: log.changes_after
      }
    })) || []

    return NextResponse.json(transformedLogs)
  } catch (error) {
    console.error('Error in GET /api/audit-log:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new audit log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      user_name,
      user_email,
      user_role,
      action,
      action_type,
      target_type,
      target_id,
      target_name,
      description,
      changes_before,
      changes_after,
      ip_address,
      user_agent,
      session_id,
      status = 'success',
      error_message
    }: AuditLogEntry = body

    // Validate required fields
    if (!user_id || !user_name || !user_email || !user_role || !action || !action_type || !target_type || !target_id || !target_name || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate enum values
    const validActions = ['create', 'update', 'delete', 'cancel']
    const validActionTypes = ['role', 'staff_role_assignment', 'permission', 'balance_update', 'order_cancellation', 'stock_update', 'recipe_update', 'ingredient_update']
    const validTargetTypes = ['role', 'user', 'permission', 'order', 'product', 'ingredient', 'recipe']
    const validStatuses = ['success', 'failed', 'pending']

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action value' },
        { status: 400 }
      )
    }

    if (!validActionTypes.includes(action_type)) {
      return NextResponse.json(
        { error: 'Invalid action_type value' },
        { status: 400 }
      )
    }

    if (!validTargetTypes.includes(target_type)) {
      return NextResponse.json(
        { error: 'Invalid target_type value' },
        { status: 400 }
      )
    }

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Create the audit log entry
    const { data: auditLog, error: auditError } = await supabaseServerClient
      .from('audit_log')
      .insert({
        user_id,
        user_name,
        user_email,
        user_role,
        action,
        action_type,
        target_type,
        target_id,
        target_name,
        description,
        changes_before,
        changes_after,
        ip_address,
        user_agent,
        session_id,
        status,
        error_message
      })
      .select()
      .single()

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      return NextResponse.json(
        { error: 'Failed to create audit log entry' },
        { status: 500 }
      )
    }

    return NextResponse.json(auditLog, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/audit-log:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}