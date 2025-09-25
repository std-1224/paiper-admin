import { supabase } from "@/lib/supabaseClient"
import { TableStatus, TableType } from "@/types/types"
import { NextResponse } from "next/server"

/**
 * Fetch all tables for the current venue
 */
export const GET = async () => {
  try {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('table_number', { ascending: true })

    if (error) {
      console.error('Error fetching tables:', error)
      throw error
    }

    if (!data) {
      return []
    }

    console.log('Tables data:', data)

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch tables:', error)
    throw error
  }
}