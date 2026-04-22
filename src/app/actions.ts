'use server'

import { supabaseAdmin } from "@/lib/supabase"
import { sendTicketEmail } from "@/lib/resend"

export async function bookTicket(email: string, name: string, character: string) {
  try {
    // 1. Call the 'handle_booking' SQL function created in Supabase
    const { data, error } = await supabaseAdmin.rpc('handle_booking', {
      p_email: email,
      p_name: name,
      p_char: character
    })

    if (error) {
      console.error("Supabase RPC Error:", error.message)
      return { success: false, message: "Connection to booking engine failed." }
    }

    const result = data && data[0]

    if (!result) {
      return { success: false, message: "Unexpected response from server." }
    }

    if (!result.success) {
      if (result.message === 'ALL_SLOTS_FULL') {
        return { 
          success: false, 
          isFull: true,
          message: "All slots are fully booked! Watch the premiere on YouTube." 
        }
      }
      return { success: false, message: "Booking failed. Please try again." }
    }

    const ticketId = result.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const characters: Record<string, string> = {
      'aarav': 'Aarav',
      'ayaan': 'Ayaan',
      'siddharth': 'Siddharth',
      'kiara': 'Kiara',
      'zoya': 'Zoya',
      'vihan': 'Vihan',
      'ayushi': 'Ayushi',
      'jhanvi': 'Jhanvi'
    }
    const charName = characters[character] || character
    
    sendTicketEmail(email, name, charName, result.assigned_slot, ticketId).catch(err => {
      console.error("Email send failed:", err)
    })

    return { 
      success: true, 
      slot: result.assigned_slot,
      ticketId: ticketId,
      message: "Ticket Confirmed!" 
    }

  } catch (err) {
    console.error("Action Error:", err)
    return { success: false, message: "An unexpected error occurred." }
  }
}

export async function checkIn(ticketId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (error || !data) {
      return { success: false, message: "Ticket not found." }
    }

    if (data.is_checked_in) {
      return { success: false, message: "Ticket already checked in." }
    }

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ is_checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('id', ticketId)

    if (updateError) {
      console.error("Check-in error:", updateError.message)
      return { success: false, message: "Failed to check in ticket." }
    }

    return { 
      success: true, 
      message: "Ticket checked in successfully!",
      userName: data.name,
      charName: data.character
    }

  } catch (err) {
    console.error("Check-in Action Error:", err)
    return { success: false, message: "An unexpected error occurred." }
  }
}

export async function getBookingStats() {
  try {
    // We select the assigned_slot and use the count head to get totals
    // Supabase handles the grouping logic implicitly via this syntax
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('assigned_slot')

    if (error) {
      console.error("Stats error:", error.message)
      return { success: false, slot1: 0, slot2: 0, total: 0 }
    }

    let slot1 = 0
    let slot2 = 0

    if (data) {
      slot1 = data.filter((b: any) => b.assigned_slot === 1).length
      slot2 = data.filter((b: any) => b.assigned_slot === 2).length
    }

    const total = slot1 + slot2

    return { 
      success: true, 
      slot1, 
      slot2, 
      total,
      slot1Percentage: Math.round((slot1 / 200) * 100),
      slot2Percentage: Math.round((slot2 / 200) * 100),
      slot1Remaining: Math.max(0, 200 - slot1),
      slot2Remaining: Math.max(0, 200 - slot2)
    }

  } catch (err) {
    console.error("Stats Action Error:", err)
    return { success: false, slot1: 0, slot2: 0, total: 0 }
  }
}