import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE = "https://loopgate.gg";
const TODAY = new Date().toISOString().split("T")[0];

// Static pages that never change
const STATIC_URLS = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/arena", priority: "0.95", changefreq: "daily" },
  { loc: "/rankings", priority: "0.95", changefreq: "daily" },
  { loc: "/index", priority: "0.9", changefreq: "daily" },
  { loc: "/competitions", priority: "0.9", changefreq: "daily" },
  { loc: "/gqt", priority: "0.9", changefreq: "weekly" },
  { loc: "/crews", priority: "0.85", changefreq: "weekly" },
  { loc: "/judges", priority: "0.85", changefreq: "weekly" },
  { loc: "/editorium", priority: "0.85", changefreq: "daily" },
  { loc: "/about", priority: "0.85", changefreq: "monthly" },
  { loc: "/how-it-works", priority: "0.9", changefreq: "monthly" },
  { loc: "/download", priority: "0.85", changefreq: "monthly" },
  { loc: "/faq", priority: "0.8", changefreq: "monthly" },
  { loc: "/enterprise", priority: "0.85", changefreq: "weekly" },
  { loc: "/rules", priority: "0.7", changefreq: "monthly" },
  { loc: "/support", priority: "0.6", changefreq: "monthly" },
  { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
];

function urlEntry(loc: string, lastmod: string, priority: string, changefreq: string): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const entries: string[] = [];

  // Static pages
  for (const p of STATIC_URLS) {
    entries.push(urlEntry(`${SITE}${p.loc}`, TODAY, p.priority, p.changefreq));
  }

  // Editor profiles (/editors/:username)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("username, updated_at")
    .not("username", "is", null)
    .order("updated_at", { ascending: false })
    .limit(5000);

  for (const p of profiles ?? []) {
    if (!p.username) continue;
    const lastmod = p.updated_at ? p.updated_at.split("T")[0] : TODAY;
    entries.push(urlEntry(`${SITE}/editors/${encodeURIComponent(p.username)}`, lastmod, "0.75", "weekly"));
  }

  // Completed battles (/battles/:id)
  const { data: battles } = await supabase
    .from("battles")
    .select("id, updated_at, status")
    .in("status", ["completed", "judging"])
    .order("updated_at", { ascending: false })
    .limit(10000);

  for (const b of battles ?? []) {
    const lastmod = b.updated_at ? b.updated_at.split("T")[0] : TODAY;
    entries.push(urlEntry(`${SITE}/battles/${b.id}`, lastmod, "0.7", "monthly"));
  }

  // Competitions (/competitions/:slug-or-id)
  const { data: comps } = await supabase
    .from("competitions")
    .select("id, slug, updated_at, status")
    .neq("status", "cancelled")
    .order("updated_at", { ascending: false })
    .limit(2000);

  for (const c of comps ?? []) {
    const slug = c.slug || c.id;
    const lastmod = c.updated_at ? c.updated_at.split("T")[0] : TODAY;
    const priority = c.status === "completed" ? "0.7" : "0.8";
    entries.push(urlEntry(`${SITE}/competitions/${encodeURIComponent(slug)}`, lastmod, priority, "weekly"));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
