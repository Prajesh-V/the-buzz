'use server'

import { supabaseAdmin } from "@/lib/supabase"
import { sendTicketEmail } from "@/lib/resend"

export async function bookTicket(email: string, name: string, character: string) {
  try {
    const { data, error } = await supabaseAdmin.rpc('handle_booking', {
      p_email: email,
      p_name: name,
      p_char: character
    })

    if (error) throw error;

    const result = data && data[0]
    if (!result || !result.success) {
      return { 
        success: false, 
        isFull: result?.message === 'ALL_SLOTS_FULL', 
        message: result?.message === 'ALL_SLOTS_FULL' ? "All slots are full!" : "Booking failed." 
      }
    }

    // result.id comes from the database as a UUID
    const ticketId = result.id 
    
    // Background email task
    sendTicketEmail(email, name, character, result.assigned_slot, ticketId).catch(console.error)

    return { 
      success: true, 
      slot: result.assigned_slot,
      ticketId: ticketId,
      message: "Ticket Confirmed!" 
    }
  } catch (err) {
    console.error("Action Error:", err)
    return { success: false, message: "Server error." }
  }
}

/**
 * UPDATED: Robust Check-In for Admin Scanner
 * Added .trim() and detailed console logs to diagnose "QR not recognized"
 */
export async function checkIn(ticketId: string) {
  try {
    const cleanId = ticketId.trim();
    console.log("Admin scanning ID:", cleanId);

    // 1. Look for the ticket
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', cleanId)
      .single()

    if (error || !data) {
      console.error("Database Lookup Failed for ID:", cleanId, "Error:", error?.message);
      return { success: false, message: "QR not recognized in database." }
    }

    if (data.is_checked_in) {
      return { success: false, message: `Already checked in: ${data.name}` }
    }

    // 2. Perform the check-in update
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ 
        is_checked_in: true, 
        checked_in_at: new Date().toISOString() 
      })
      .eq('id', cleanId)

    if (updateError) {
      console.error("Update failed:", updateError.message);
      return { success: false, message: "Database update failed." }
    }

    return { 
      success: true, 
      message: `Success! Checked in ${data.name}`,
      userName: data.name
    }
  } catch (err) {
    console.error("Check-in Crash:", err);
    return { success: false, message: "An unexpected error occurred." }
  }
}

/**
 * UPDATED: Stats with 225 capacity
 */
export async function getBookingStats() {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('assigned_slot')

    if (error) throw error;

    const s1 = data?.filter((b: any) => b.assigned_slot === 1).length || 0
    const s2 = data?.filter((b: any) => b.assigned_slot === 2).length || 0
    
    const MAX_PER_SLOT = 225;

    return { 
      success: true, 
      slot1: s1, 
      slot2: s2, 
      total: s1 + s2,
      slot1Remaining: Math.max(0, MAX_PER_SLOT - s1),
      slot2Remaining: Math.max(0, MAX_PER_SLOT - s2),
      slot1Percentage: Math.round((s1 / MAX_PER_SLOT) * 100),
      slot2Percentage: Math.round((s2 / MAX_PER_SLOT) * 100)
    }
  } catch (err) {
    console.error("Stats Error:", err);
    return { success: false, slot1: 0, slot2: 0, total: 0 }
  }
}