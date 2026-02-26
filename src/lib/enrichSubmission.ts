import { supabase } from '@/integrations/supabase/client';

/**
 * Fire-and-forget enrichment call.
 * Calls the enrich-submission edge function to fetch oEmbed metadata
 * (thumbnail, title, author) and permanently store it in the DB row.
 *
 * This should be called immediately after a successful insert/update.
 * It runs async — caller doesn't need to await.
 */
export function enrichSubmission(params: {
  url: string;
  platform: string;
  table: string;
  row_id: string;
  side?: 'challenger' | 'opponent';
}) {
  // Fire-and-forget — don't block the UI
  supabase.functions
    .invoke('enrich-submission', { body: params })
    .then(({ data, error }) => {
      if (error) {
        console.warn('[enrichSubmission] Error:', error);
      } else {
        console.log('[enrichSubmission] Done:', params.table, params.row_id, data?.thumbnail_url ? '✓ thumb' : '✗ no thumb');
      }
    })
    .catch((e) => {
      console.warn('[enrichSubmission] Network error:', e);
    });
}
