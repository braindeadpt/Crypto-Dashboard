import { ATLAS } from "@/lib/content/atlas";
import { SEGURANCA_CONTENT } from "@/lib/content/seguranca";
import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * RSS 2.0 — the daily briefing link + evergreen Atlas/security articles.
 * No invented data: articles are static content; the brief item points at
 * today's live page rather than embedding generated text.
 */
export async function GET() {
  const today = new Date();
  const pubDate = today.toUTCString();
  const dateStr = today.toISOString().slice(0, 10);

  const items: string[] = [
    `<item>
      <title>${esc(`Briefing diário — ${dateStr}`)}</title>
      <link>${BASE_URL}/pt/brief</link>
      <guid isPermaLink="false">brief-${dateStr}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${esc("O ritual de 5 minutos: o que mudou, porquê, e o que não fazer.")}</description>
    </item>`,
    ...ATLAS.map(
      (c) => `<item>
      <title>${esc(c.titlePt)}</title>
      <link>${BASE_URL}/pt/atlas/${c.slug}</link>
      <guid isPermaLink="false">atlas-${c.slug}</guid>
      <description>${esc(c.summaryPt)}</description>
    </item>`,
    ),
    ...SEGURANCA_CONTENT.sections.map(
      (s) => `<item>
      <title>${esc(`Segurança · ${s.titlePt}`)}</title>
      <link>${BASE_URL}/pt/aprender</link>
      <guid isPermaLink="false">seguranca-${s.id}</guid>
      <pubDate>${new Date(s.asOf).toUTCString()}</pubDate>
      <description>${esc(s.bodyPt.slice(0, 280))}…</description>
    </item>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>CLAREZA Crypto</title>
    <link>${BASE_URL}/pt</link>
    <description>Observatório de mercado — briefing diário, contexto e literacia. PT-PT.</description>
    <language>pt-PT</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
    ${items.join("\n    ")}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
