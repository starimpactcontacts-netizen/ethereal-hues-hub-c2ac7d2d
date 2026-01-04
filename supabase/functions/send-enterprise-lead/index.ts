import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnterpriseLeadRequest {
  fullName: string;
  email: string;
  company: string;
  role: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-enterprise-lead function invoked");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullName, email, company, role, message }: EnterpriseLeadRequest = await req.json();
    
    console.log("Processing enterprise lead:", { fullName, email, company, role });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Loopgate <noreply@loopgate.io>",
        to: ["team@loopgate.io"],
        subject: `🏢 New Enterprise Lead: ${company}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">New Enterprise Inquiry</h1>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Name:</strong> ${fullName}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p style="margin: 8px 0;"><strong>Company:</strong> ${company}</p>
              <p style="margin: 8px 0;"><strong>Role:</strong> ${role}</p>
            </div>
            
            ${message ? `
            <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-style: italic;">"${message}"</p>
            </div>
            ` : ''}
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              This lead was submitted through the Loopgate Enterprise portal.
            </p>
          </div>
        `,
      }),
    });

    const data = await res.json();
    console.log("Resend API response:", data);

    if (!res.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-enterprise-lead function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
