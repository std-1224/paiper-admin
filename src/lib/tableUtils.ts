import { supabase } from "@/lib/supabaseClient"

export type DatabaseTableStatus =
  | "free" // *** //
  | "occupied" // *** //
  | "waiting_order"
  | "preparing"
  | "delivered"
  | "bill_requested" // *** //
  | "producing"
  | "paid";

/**
 * Update table status
 */
export async function updateTableStatus(
  table_number: string,
  newStatus: DatabaseTableStatus,
): Promise<void> {

  try {
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Reset current_guests to 0 when table becomes free
    if (newStatus === "free") {
      updateData.current_guests = 0;
    }

    const { data, error } = await supabase
      .from("tables")
      .update(updateData)
      .eq("table_number", table_number)
      .select();

    if (error) {
      console.error("Error updating table status:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error(`No table found with ID: ${table_number}`);
    }
  } catch (error) {
    console.error("Failed to update table status:", error);
    throw error;
  }
}
