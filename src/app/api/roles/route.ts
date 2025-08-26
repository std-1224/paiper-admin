import { NextRequest, NextResponse } from 'next/server'
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";
import { createAuditLog, getCurrentUserInfo, getUserInfoByEmail } from '@/lib/auditLogger';

// GET - Fetch all roles with their permissions
export async function GET() {
  try {
    // Fetch roles with their permissions
    const { data: roles, error: rolesError } = await supabaseServerClient
      .from('roles')
      .select(`
        *,
        permissions (
          module
        )
      `)
      .order('created_at', { ascending: false })

    if (rolesError) {
      console.error('Error fetching roles:', rolesError)
      return NextResponse.json(
        { error: 'Failed to fetch roles' },
        { status: 500 }
      )
    }

    // Transform the data to match the frontend interface
    const transformedRoles = roles?.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description || '',
      permissions: role.permissions?.map((p: any) => p.module) || [],
      accessLevel: role.level,
      maxTransactionAmount: parseFloat(role.transaction_limit) || 0,
      color: 'bg-blue-100 text-blue-800', // Default color
      canOverride: false, // Default value
      workingHours: { start: '09:00', end: '18:00' }, // Default hours
      allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], // Default days
      created_at: role.created_at,
      updated_at: role.updated_at
    })) || []

    return NextResponse.json(transformedRoles)
  } catch (error) {
    console.error('Error in GET /api/roles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      accessLevel,
      maxTransactionAmount,
      permissions = [],
      current_user_id,
      current_user_email
    } = body

    // Validate required fields
    if (!name || !accessLevel) {
      return NextResponse.json(
        { error: 'Name and access level are required' },
        { status: 400 }
      )
    }

    // Validate access level
    const validLevels = ['full', 'departmental', 'limited']
    if (!validLevels.includes(accessLevel)) {
      return NextResponse.json(
        { error: 'Invalid access level' },
        { status: 400 }
      )
    }

    // Get current user info for audit logging
    let userInfo = null
    if (current_user_id) {
      userInfo = await getCurrentUserInfo(current_user_id)
    } else if (current_user_email) {
      userInfo = await getUserInfoByEmail(current_user_email)
    }

    // Create the role
    const { data: role, error: roleError } = await supabaseServerClient
      .from('roles')
      .insert({
        name: name.trim(),
        description: description?.trim() || '',
        level: accessLevel,
        transaction_limit: parseFloat(maxTransactionAmount) || 0
      })
      .select()
      .single()

    if (roleError) {
      console.error('Error creating role:', roleError)

      // Log failed attempt
      if (userInfo) {
        await createAuditLog({
          user_id: userInfo.user_id,
          user_name: userInfo.user_name,
          user_email: userInfo.user_email,
          user_role: userInfo.user_role,
          action: 'create',
          action_type: 'role',
          target_type: 'role',
          target_id: '00000000-0000-0000-0000-000000000000', // Placeholder since creation failed
          target_name: name.trim(),
          description: `Failed to create role: ${name.trim()}`,
          changes_after: {
            name: name.trim(),
            description: description?.trim() || '',
            level: accessLevel,
            transaction_limit: parseFloat(maxTransactionAmount) || 0,
            permissions: permissions
          },
          status: 'failed',
          error_message: roleError.message
        })
      }

      if (roleError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A role with this name already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to create role' },
        { status: 500 }
      )
    }

    // Create permissions for the role
    if (permissions.length > 0) {
      const permissionInserts = permissions.map((module: string) => ({
        role_id: role.id,
        module: module
      }))

      const { error: permissionsError } = await supabaseServerClient
        .from('permissions')
        .insert(permissionInserts)

      if (permissionsError) {
        console.error('Error creating permissions:', permissionsError)
        // If permissions fail, we should clean up the role
        await supabaseServerClient.from('roles').delete().eq('id', role.id)
        return NextResponse.json(
          { error: 'Failed to create role permissions' },
          { status: 500 }
        )
      }
    }

    // Log successful role creation (no "before" state for new roles)
    if (userInfo) {
      await createAuditLog({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_email: userInfo.user_email,
        user_role: userInfo.user_role,
        action: 'create',
        action_type: 'role',
        target_type: 'role',
        target_id: role.id,
        target_name: role.name,
        description: `Created new role: ${role.name}`,
        changes_before: null, // No previous state for new role
        changes_after: {
          name: role.name,
          description: role.description,
          level: role.level,
          transaction_limit: parseFloat(role.transaction_limit),
          permissions: permissions
        },
        status: 'success'
      })
    }

    // Return the created role with permissions
    const createdRole = {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: permissions,
      accessLevel: role.level,
      maxTransactionAmount: parseFloat(role.transaction_limit),
      color: 'bg-blue-100 text-blue-800',
      canOverride: false,
      workingHours: { start: '09:00', end: '18:00' },
      allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      created_at: role.created_at,
      updated_at: role.updated_at
    }

    return NextResponse.json(createdRole, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/roles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update an existing role
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      description,
      accessLevel,
      maxTransactionAmount,
      permissions = [],
      current_user_id,
      current_user_email
    } = body

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      )
    }

    if (!name || !accessLevel) {
      return NextResponse.json(
        { error: 'Name and access level are required' },
        { status: 400 }
      )
    }

    // Get current user info for audit logging
    let userInfo = null
    if (current_user_id) {
      userInfo = await getCurrentUserInfo(current_user_id)
    } else if (current_user_email) {
      userInfo = await getUserInfoByEmail(current_user_email)
    }

    // Get the current role data before updating for audit log
    const { data: currentRole, error: currentRoleError } = await supabaseServerClient
      .from('roles')
      .select(`
        *,
        permissions (
          module
        )
      `)
      .eq('id', id)
      .single()

    if (currentRoleError || !currentRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    const currentPermissions = currentRole.permissions?.map((p: any) => p.module) || []

    // Update the role
    const { data: role, error: roleError } = await supabaseServerClient
      .from('roles')
      .update({
        name: name.trim(),
        description: description?.trim() || '',
        level: accessLevel,
        transaction_limit: parseFloat(maxTransactionAmount) || 0
      })
      .eq('id', id)
      .select()
      .single()

    if (roleError) {
      console.error('Error updating role:', roleError)
      if (roleError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A role with this name already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      )
    }

    // Delete existing permissions
    const { error: deleteError } = await supabaseServerClient
      .from('permissions')
      .delete()
      .eq('role_id', id)

    if (deleteError) {
      console.error('Error deleting old permissions:', deleteError)
      return NextResponse.json(
        { error: 'Failed to update role permissions' },
        { status: 500 }
      )
    }

    // Create new permissions
    if (permissions.length > 0) {
      const permissionInserts = permissions.map((module: string) => ({
        role_id: id,
        module: module
      }))

      const { error: permissionsError } = await supabaseServerClient
        .from('permissions')
        .insert(permissionInserts)

      if (permissionsError) {
        console.error('Error creating new permissions:', permissionsError)
        return NextResponse.json(
          { error: 'Failed to update role permissions' },
          { status: 500 }
        )
      }
    }

    // Log successful role update
    if (userInfo) {
      await createAuditLog({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_email: userInfo.user_email,
        user_role: userInfo.user_role,
        action: 'update',
        action_type: 'role',
        target_type: 'role',
        target_id: role.id,
        target_name: role.name,
        description: `Updated role: ${role.name}`,
        changes_before: {
          name: currentRole.name,
          description: currentRole.description,
          level: currentRole.level,
          transaction_limit: parseFloat(currentRole.transaction_limit),
          permissions: currentPermissions
        },
        changes_after: {
          name: role.name,
          description: role.description,
          level: role.level,
          transaction_limit: parseFloat(role.transaction_limit),
          permissions: permissions
        },
        status: 'success'
      })
    }

    // Return the updated role with permissions
    const updatedRole = {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: permissions,
      accessLevel: role.level,
      maxTransactionAmount: parseFloat(role.transaction_limit),
      color: 'bg-blue-100 text-blue-800',
      canOverride: false,
      workingHours: { start: '09:00', end: '18:00' },
      allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      created_at: role.created_at,
      updated_at: role.updated_at
    }

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error('Error in PUT /api/roles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a role
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      )
    }

    // Get current user info for audit logging
    const userInfo = await getCurrentUserInfo()

    // Get the role data before deletion for audit log
    const { data: roleToDelete, error: getRoleError } = await supabaseServerClient
      .from('roles')
      .select(`
        *,
        permissions (
          module
        )
      `)
      .eq('id', id)
      .single()

    if (getRoleError || !roleToDelete) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    const rolePermissionsData = roleToDelete.permissions?.map((p: any) => p.module) || []

    // Step 1: Get all users with this role_id from role_permissions
    const { data: rolePermissions, error: getRolePermissionsError } = await supabaseServerClient
      .from('role_permissions')
      .select('user_id')
      .eq('role_id', id)

    if (getRolePermissionsError) {
      console.error('Error fetching role permissions:', getRolePermissionsError)
      return NextResponse.json(
        { error: 'Failed to fetch role permissions' },
        { status: 500 }
      )
    }

    // Step 2: Update approval_status to pending for all users with this role
    if (rolePermissions && rolePermissions.length > 0) {
      const userIds = rolePermissions.map(rp => rp.user_id)

      const { error: updateProfilesError } = await supabaseServerClient
        .from('profiles')
        .update({
          approval_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .in('id', userIds)

      if (updateProfilesError) {
        console.error('Error updating profiles approval status:', updateProfilesError)
        return NextResponse.json(
          { error: 'Failed to update user approval status' },
          { status: 500 }
        )
      }
    }

    // Step 3: Remove all data from role_permissions that has this role_id
    const { error: deleteRolePermissionsError } = await supabaseServerClient
      .from('role_permissions')
      .delete()
      .eq('role_id', id)

    if (deleteRolePermissionsError) {
      console.error('Error deleting role permissions:', deleteRolePermissionsError)
      return NextResponse.json(
        { error: 'Failed to delete role permissions' },
        { status: 500 }
      )
    }

    // Step 4: Remove all data from permissions that has this role_id
    const { error: deletePermissionsError } = await supabaseServerClient
      .from('permissions')
      .delete()
      .eq('role_id', id)

    if (deletePermissionsError) {
      console.error('Error deleting permissions:', deletePermissionsError)
      return NextResponse.json(
        { error: 'Failed to delete permissions' },
        { status: 500 }
      )
    }

    // Step 5: Remove data from roles
    const { error: deleteRoleError } = await supabaseServerClient
      .from('roles')
      .delete()
      .eq('id', id)

    if (deleteRoleError) {
      console.error('Error deleting role:', deleteRoleError)
      return NextResponse.json(
        { error: 'Failed to delete role' },
        { status: 500 }
      )
    }

    // Log successful role deletion
    if (userInfo) {
      await createAuditLog({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_email: userInfo.user_email,
        user_role: userInfo.user_role,
        action: 'delete',
        action_type: 'role',
        target_type: 'role',
        target_id: roleToDelete.id,
        target_name: roleToDelete.name,
        description: `Deleted role: ${roleToDelete.name} (affected ${rolePermissions?.length || 0} users)`,
        changes_before: {
          name: roleToDelete.name,
          description: roleToDelete.description,
          level: roleToDelete.level,
          transaction_limit: parseFloat(roleToDelete.transaction_limit),
          permissions: rolePermissionsData,
          affected_users: rolePermissions?.length || 0
        },
        status: 'success'
      })
    }

    return NextResponse.json({
      message: 'Role deleted successfully',
      affectedUsers: rolePermissions?.length || 0
    })
  } catch (error) {
    console.error('Error in DELETE /api/roles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
