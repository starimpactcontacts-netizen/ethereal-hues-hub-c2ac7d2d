import { supabase } from "@/integrations/supabase/client";

const GUEST_CLAIMS_KEY = 'loopgate_guest_claims';

interface ClaimEntry {
  token: string;
  table: string;
  submissionId: string;
  timestamp: number;
}

/**
 * After a user signs up / logs in, claim any guest submissions
 * by updating user_id on rows that match the stored claim tokens.
 */
export async function claimGuestSubmissions(userId: string, username: string, avatarUrl?: string | null) {
  try {
    const raw = localStorage.getItem(GUEST_CLAIMS_KEY);
    if (!raw) return;

    const claims: ClaimEntry[] = JSON.parse(raw);
    if (!claims.length) return;

    // Filter out stale claims (older than 24 hours)
    const fresh = claims.filter(c => Date.now() - c.timestamp < 24 * 60 * 60 * 1000);

    for (const claim of fresh) {
      const table = claim.table as 'featured_drop_queue' | 'featured_submissions';
      if (table !== 'featured_drop_queue' && table !== 'featured_submissions') continue;

      await supabase
        .from(table)
        .update({
          user_id: userId,
          username,
          avatar_url: avatarUrl || null,
        } as any)
        .eq('id', claim.submissionId)
        .eq('claim_token', claim.token);
    }

    // Clear all claims after processing
    localStorage.removeItem(GUEST_CLAIMS_KEY);
  } catch {
    // Silent fail — not critical
  }
}
