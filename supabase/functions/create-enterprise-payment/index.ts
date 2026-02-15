import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Stripe price IDs for each tier
const TIER_PRICES: Record<string, string> = {
  trial: "price_1T0ozvKjAots5bSh0DYp7ntj",
  standard: "price_1T0p0BKjAots5bShCl8bASPU",
  takeover: "price_1T0p0NKjAots5bShiymSE8yN",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { tierId, campaignName, campaignLink, campaignNotes, email } = await req.json();

    if (!tierId || !TIER_PRICES[tierId]) {
      throw new Error("Invalid tier selected");
    }

    const priceId = TIER_PRICES[tierId];

    // Check if customer exists by email
    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    const origin = req.headers.get("origin") || "https://ethereal-hues-hub.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/enterprise?payment=success&campaign=${encodeURIComponent(campaignName || '')}&tier=${encodeURIComponent(tierId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/enterprise`,
      metadata: {
        campaign_name: campaignName || '',
        campaign_link: campaignLink || '',
        campaign_notes: campaignNotes || '',
        tier_id: tierId,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CREATE-ENTERPRISE-PAYMENT] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
