import { createClient } from "@supabase/supabase-js";

const SITE = "https://loopgate.gg";
const TODAY = new Date().toISOString().split("T")[0];

function urlEntry(
  loc: string,
  lastmod: string,
  priority: string,
  changefreq: string
): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export default async function handler(_req: any, res: any) {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    "";

  const supabase = createClient(supabaseUrl, supabaseKey);
  const entries: string[] = [];

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
    entries.push(
      urlEntry(
        `${SITE}/editors/${encodeURIComponent(p.username)}`,
        lastmod,
        "0.75",
        "weekly"
      )
    );
  }

  // Completed/judging battles (/battles/:id)
  const { data: battles } = await supabase
    .from("battles")
    .select("id, updated_at")
    .in("status", ["completed", "judging", "active"])
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
    entries.push(
      urlEntry(
        `${SITE}/competitions/${encodeURIComponent(slug)}`,
        lastmod,
        priority,
        "weekly"
      )
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.status(200).send(xml);
}
