import { NextRequest, NextResponse } from 'next/server'
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";

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
      permissions = [] 
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
      permissions = [] 
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

    // Delete the role (permissions will be deleted automatically due to CASCADE)
    const { error } = await supabaseServerClient
      .from('roles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting role:', error)
      return NextResponse.json(
        { error: 'Failed to delete role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/roles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
