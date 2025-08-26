import { NextRequest, NextResponse } from "next/server";
import { ApprovalStatus } from "@/types/types";
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";

// GET - Fetch role permissions for a user OR all staff members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const email = searchParams.get("email");
    const getAllStaff = searchParams.get("all_staff");

    // If requesting all staff members
    if (getAllStaff === "true") {
      // Step 1: Get all role_permissions with their relationships
      const { data: rolePermissions, error: rolePermissionsError } =
        await supabaseServerClient
          .from("role_permissions")
          .select(
            `
          *,
          roles (
            id,
            name,
            description,
            level,
            transaction_limit
          )
        `
          )
          .order("created_at", { ascending: false });

      if (rolePermissionsError) {
        console.error("Error fetching role permissions:", rolePermissionsError);
        return NextResponse.json(
          { error: "Failed to fetch role permissions" },
          { status: 500 }
        );
      }

      if (!rolePermissions || rolePermissions.length === 0) {
        return NextResponse.json([]);
      }

      // Step 2: Get unique user_ids and role_ids
      const userIds = Array.from(
        new Set(rolePermissions.map((rp: any) => rp.user_id))
      );
      const roleIds = Array.from(
        new Set(rolePermissions.map((rp: any) => rp.role_id))
      );

      // Step 3: Fetch profiles using user_ids
      const { data: profiles, error: profilesError } =
        await supabaseServerClient
          .from("profiles")
          .select(
            `
          id,
          name,
          email,
          phone,
          created_at,
          updated_at
        `
          )
          .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return NextResponse.json(
          { error: "Failed to fetch profiles" },
          { status: 500 }
        );
      }

      // Step 4: Fetch roles using role_ids
      const { data: roles, error: rolesError } = await supabaseServerClient
        .from("roles")
        .select(
          `
          id,
          name,
          description,
          level,
          transaction_limit,
          created_at,
          updated_at
        `
        )
        .in("id", roleIds);

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        return NextResponse.json(
          { error: "Failed to fetch roles" },
          { status: 500 }
        );
      }

      // Step 5: Fetch permissions using role.id
      const { data: permissions, error: permissionsError } =
        await supabaseServerClient
          .from("permissions")
          .select(
            `
          id,
          module,
          role_id,
          created_at,
          updated_at
        `
          )
          .in("role_id", roleIds);

      if (permissionsError) {
        console.error("Error fetching permissions:", permissionsError);
        return NextResponse.json(
          { error: "Failed to fetch permissions" },
          { status: 500 }
        );
      }

      // Step 6: Create lookup maps for efficient data joining
      const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      const rolesMap = new Map(roles?.map((r) => [r.id, r]) || []);

      // Step 7: Group role_permissions by user_id to get unique staff members
      const staffMap = new Map();

      rolePermissions.forEach((rp: any) => {
        const profile = profilesMap.get(rp.user_id);
        const role = rolesMap.get(rp.role_id);

        if (profile && role) {
          if (!staffMap.has(rp.user_id)) {
            staffMap.set(rp.user_id, {
              id: profile.id,
              name: profile.name || profile.email.split("@")[0], // Use profile name or email prefix as fallback
              email: profile.email,
              phone: profile.phone || "",
              role: role.name,
              status: "active", // Default status
              avatar: "/placeholder.svg?height=40&width=40",
              joinDate: new Date(profile.created_at).toLocaleDateString(
                "es-ES"
              ),
              department: role.name || "Sin departamento",
              // Additional data for detailed view
              roleDetails: {
                id: role.id,
                name: role.name,
                description: role.description,
                level: role.level,
                transaction_limit: role.transaction_limit,
              },
              permissions: permissions?.map((p: any) => ({
                id: p.id,
                module: p.module,
                role_id: p.role_id,
              })),
              rolePermissions: rolePermissions.filter(
                (rp2: any) => rp2.user_id === rp.user_id
              ),
            });
          }
        }
      });

      // Step 8: Convert map to array and return
      const staffMembers = Array.from(staffMap.values());

      return NextResponse.json(staffMembers);
    }

    if (!userId && !email) {
      return NextResponse.json(
        { error: "User ID or email is required" },
        { status: 400 }
      );
    }

    // Step 1: Get role_permissions for the specific user
    let rolePermissionsQuery = supabaseServerClient
      .from("role_permissions")
      .select("*");

    if (userId) {
      rolePermissionsQuery = rolePermissionsQuery.eq("user_id", userId);
    } else if (email) {
      // First find the profile by email
      const { data: profile, error: profileError } = await supabaseServerClient
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }

      rolePermissionsQuery = rolePermissionsQuery.eq("user_id", profile.id);
    }

    // Execute the role_permissions query
    const { data: rolePermissions, error: rolePermissionsError } = await rolePermissionsQuery;

    if (rolePermissionsError) {
      console.error("Error fetching role permissions:", rolePermissionsError);
      return NextResponse.json(
        { error: "Failed to fetch role permissions" },
        { status: 500 }
      );
    }

    if (!rolePermissions || rolePermissions.length === 0) {
      return NextResponse.json([]);
    }

    // Step 2: Get unique role_ids from role_permissions
    const roleIds = Array.from(new Set(rolePermissions.map((rp: any) => rp.role_id)));

    // Step 3: Get roles using role_ids
    const { data: roles, error: rolesError } = await supabaseServerClient
      .from("roles")
      .select("*")
      .in("id", roleIds);

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      return NextResponse.json(
        { error: "Failed to fetch roles" },
        { status: 500 }
      );
    }

    // Step 4: Get permissions using role_ids
    const { data: permissions, error: permissionsError } = await supabaseServerClient
      .from("permissions")
      .select("*")
      .in("role_id", roleIds);

    if (permissionsError) {
      console.error("Error fetching permissions:", permissionsError);
      return NextResponse.json(
        { error: "Failed to fetch permissions" },
        { status: 500 }
      );
    }

    // Step 5: Combine the data
    const result = rolePermissions.map((rp: any) => {
      const role = roles?.find((r: any) => r.id === rp.role_id);
      const rolePermissionsList = permissions?.filter((p: any) => p.role_id === rp.role_id) || [];

      return {
        ...rp,
        roles: role,
        permissions: rolePermissionsList
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/role_permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create staff member with role assignment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, role_id } = body;

    // Validate required fields
    if (!email || !role_id) {
      return NextResponse.json(
        { error: "Email and role_id are required" },
        { status: 400 }
      );
    }

    // Step 1: Find profile by email
    const { data: profile, error: profileError } = await supabaseServerClient
      .from("profiles")
      .select("id, email, role")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found with the provided email" },
        { status: 404 }
      );
    }

    // Step 2: Get role information
    const { data: role, error: roleError } = await supabaseServerClient
      .from("roles")
      .select("id, name")
      .eq("id", role_id)
      .single();

    if (roleError || !role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Step 3: Update profile with role and phone
    const updateData: any = {
      phone: phone?.trim() || null,
      approval_status: ApprovalStatus.Approved,
      updated_at: new Date().toISOString(),
    };

    if (phone) {
      updateData.phone = phone.trim();
    }

    const { data: updatedProfile, error: updateError } =
      await supabaseServerClient
        .from("profiles")
        .update(updateData)
        .eq("id", profile.id)
        .select()
        .single();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }
    // Step 5: Create role_permissions entries
    const rolePermissionInserts = {
      user_id: profile.id,
      role_id: role_id,
    };

    // Delete existing role permissions for this user first
    await supabaseServerClient
      .from("role_permissions")
      .delete()
      .eq("user_id", profile.id);

    // Insert new role permissions
    const { error: insertError } = await supabaseServerClient
      .from("role_permissions")
      .insert(rolePermissionInserts);

    if (insertError) {
      console.error("Error creating role permissions:", insertError);
      return NextResponse.json(
        { error: "Failed to assign role permissions" },
        { status: 500 }
      );
    }
    // Return the created staff member information
    const staffMember = {
      id: profile.id,
      email: updatedProfile.email,
      phone: updatedProfile.phone,
      role: updatedProfile.role,
      role_id: role_id,
      created_at: updatedProfile.updated_at,
    };

    return NextResponse.json(staffMember, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/role_permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update staff member role
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, role_id } = body;

    // Validate required fields
    if (!user_id || !role_id) {
      return NextResponse.json(
        { error: "User ID or email, and role_id are required" },
        { status: 400 }
      );
    }
    // Insert new role permissions
    const { error: insertError } = await supabaseServerClient
      .from("role_permissions")
      .update({ role_id })
      .eq("user_id", user_id)

    if (insertError) {
      console.error("Error updating role permissions:", insertError);
      return NextResponse.json(
        { error: "Failed to update role permissions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      role_id: role_id
    });
  } catch (error) {
    console.error("Error in PUT /api/role_permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove staff member role permissions
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json(
        { error: "User ID or email is required" },
        { status: 400 }
      );
    }

    let profileId = userId;

    // If email provided, find the profile
    if (!userId && email) {
      const { data: profile, error: profileError } = await supabaseServerClient
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }

      profileId = profile.id;
    }

    // Step 1: Find profile using user_id (already done above)

    // Step 2: Update the approval_status to pending
    const { error: updateError } = await supabaseServerClient
      .from("profiles")
      .update({
        approval_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Step 3: Get the user's current role_permissions to find role_id
    const { data: currentRolePermissions, error: getRolePermissionsError } = await supabaseServerClient
      .from("role_permissions")
      .select("role_id")
      .eq("user_id", profileId)
      .limit(1);

    if (getRolePermissionsError) {
      console.error("Error fetching current role permissions:", getRolePermissionsError);
      return NextResponse.json(
        { error: "Failed to fetch current role permissions" },
        { status: 500 }
      );
    }

    // Step 4: Remove data from role_permissions using role_id and user_id
    if (currentRolePermissions && currentRolePermissions.length > 0) {
      const roleId = currentRolePermissions[0].role_id;

      const { error: deleteError } = await supabaseServerClient
        .from("role_permissions")
        .delete()
        .eq("user_id", profileId)
        .eq("role_id", roleId);

      if (deleteError) {
        console.error("Error deleting role permissions:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete role permissions" },
          { status: 500 }
        );
      }
    } else {
      // If no role permissions found, still delete any remaining ones for this user
      const { error: deleteError } = await supabaseServerClient
        .from("role_permissions")
        .delete()
        .eq("user_id", profileId);

      if (deleteError) {
        console.error("Error deleting role permissions:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete role permissions" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: "Staff member role removed successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/role_permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
