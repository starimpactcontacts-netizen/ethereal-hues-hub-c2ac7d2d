import { supabase } from '@/integrations/supabase/client';

type EmailType = 'score_rated' | 'battle_update' | 'new_drop' | 'connection_request' | 'connection_accepted' | 'battle_result';

/**
 * Fire-and-forget email notification sender.
 * Call this from any component/hook after a key event (score rated, battle update, etc.)
 * It's non-blocking — failures are silently logged.
 */
export async function sendEmailNotification(
  userId: string,
  emailType: EmailType,
  data: Record<string, any>
) {
  try {
    await supabase.functions.invoke('send-notification-email', {
      body: { user_id: userId, email_type: emailType, data },
    });
  } catch (err) {
    console.warn('[email-notify] Failed to send:', emailType, err);
  }
}
