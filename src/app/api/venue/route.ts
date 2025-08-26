import { NextRequest, NextResponse } from "next/server";
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";

// GET - Fetch venue information
export async function GET(request: NextRequest) {
  try {
    const { data: venue, error } = await supabaseServerClient
      .from("venue")
      .select("*")
      .single();

    if (error) {
      // If no venue exists, return null
      if (error.code === 'PGRST116') {
        return NextResponse.json(null);
      }

      console.error("Error fetching venue:", error);
      return NextResponse.json(
        { error: "Failed to fetch venue information" },
        { status: 500 }
      );
    }

    return NextResponse.json(venue);
  } catch (error) {
    console.error("Error in GET /api/venue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create or update venue information
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, open_time, closing_time, max_capacity } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Venue name is required" },
        { status: 400 }
      );
    }

    // Check if venue already exists
    const { data: existingVenue, error: checkError } = await supabaseServerClient
      .from("venue")
      .select("id")
      .single();

    let result;
    
    if (existingVenue) {
      // Update existing venue
      const { data: updatedVenue, error: updateError } = await supabaseServerClient
        .from("venue")
        .update({
          name: name.trim(),
          description: description?.trim() || "",
          open_time: open_time || "09:00",
          closing_time: closing_time || "23:00",
          max_capacity: max_capacity || 100,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingVenue.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating venue:", updateError);
        return NextResponse.json(
          { error: "Failed to update venue information" },
          { status: 500 }
        );
      }

      result = updatedVenue;
    } else {
      // Create new venue
      const { data: newVenue, error: createError } = await supabaseServerClient
        .from("venue")
        .insert({
          name: name.trim(),
          description: description?.trim() || "",
          open_time: open_time || "09:00",
          closing_time: closing_time || "23:00",
          max_capacity: max_capacity || 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating venue:", createError);
        return NextResponse.json(
          { error: "Failed to create venue information" },
          { status: 500 }
        );
      }

      result = newVenue;
    }

    return NextResponse.json({
      message: existingVenue ? "Venue updated successfully" : "Venue created successfully",
      venue: result
    });
  } catch (error) {
    console.error("Error in POST /api/venue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
