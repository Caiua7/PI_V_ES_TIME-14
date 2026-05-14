import { getSupabaseClient } from '../services/supabaseClient'

export async function addNotification(type: string, message: string, userId: string | null = null): Promise<void> {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('notifications').insert({
      type,
      message,
      read: false,
      created_at: new Date().toISOString(),
      user_id: userId,
    })

    if (error) {
      console.error('Error adding notification:', error)
    }
  } catch (error) {
    console.error('Exception adding notification:', error)
  }
}
