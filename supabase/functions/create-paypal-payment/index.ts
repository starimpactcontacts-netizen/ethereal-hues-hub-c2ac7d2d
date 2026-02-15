import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIER_PRICES: Record<string, { amount: string; description: string }> = {
  trial: { amount: "150.00", description: "Trial Slot — 20-30 edits, 48h arena cycle" },
  standard: { amount: "400.00", description: "Standard Slot — Full arena cycle, judges + feed" },
  takeover: { amount: "1200.00", description: "Takeover Slot — Pinned event, full takeover" },
};

async function getPayPalAccessToken(clientId: string, secretKey: string): Promise<string> {
  const auth = btoa(`${clientId}:${secretKey}`);
  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`PayPal auth failed [${res.status}]: ${errBody}`);
  }

  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const secretKey = Deno.env.get("PAYPAL_SECRET_KEY");
    if (!clientId) throw new Error("PAYPAL_CLIENT_ID is not configured");
    if (!secretKey) throw new Error("PAYPAL_SECRET_KEY is not configured");

    const { tierId, campaignName, campaignLink, campaignNotes, email } = await req.json();

    if (!tierId || !TIER_PRICES[tierId]) {
      throw new Error("Invalid tier selected");
    }

    const tier = TIER_PRICES[tierId];
    const accessToken = await getPayPalAccessToken(clientId, secretKey);
    const origin = req.headers.get("origin") || "https://ethereal-hues-hub.lovable.app";

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: tier.amount,
          },
          description: tier.description,
          custom_id: JSON.stringify({
            campaign_name: campaignName || "",
            campaign_link: campaignLink || "",
            tier_id: tierId,
            email: email || "",
          }),
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            brand_name: "LOOPGATE × Viral Cartel",
            locale: "en-US",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            return_url: `${origin}/enterprise?payment=success&campaign=${encodeURIComponent(campaignName || "")}&tier=${encodeURIComponent(tierId)}&method=paypal`,
            cancel_url: `${origin}/enterprise`,
          },
        },
      },
    };

    const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderRes.ok) {
      const errBody = await orderRes.text();
      throw new Error(`PayPal order creation failed [${orderRes.status}]: ${errBody}`);
    }

    const orderData = await orderRes.json();

    // Find the approval URL to redirect the user to
    const approvalLink = orderData.links?.find((l: any) => l.rel === "payer-action" || l.rel === "approve");

    if (!approvalLink?.href) {
      throw new Error("No PayPal approval URL returned");
    }

    return new Response(JSON.stringify({ url: approvalLink.href, orderId: orderData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CREATE-PAYPAL-PAYMENT] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
