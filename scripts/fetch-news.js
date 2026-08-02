// scripts/fetch-news.js
//
// 1. Fetches each RSS feed listed in scripts/feeds.json
// 2. Skips items already present in data/articles.json (by URL)
// 3. Sends new items to the Claude API to get:
//      - an English title + 3 bullet summary
//      - a Japanese title + 3 bullet summary
//      - a region (na / eu / asia / global) and category (design / work / estate / culture)
// 4. Prepends the new articles to data/articles.json and trims old entries
//
// Requires Node 18+ (for built-in fetch) and the ANTHROPIC_API_KEY env var.

import Parser from "rss-parser";
import { readFile, writeFile } from "fs/promises";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-5";
const MAX_ARTICLES_KEPT = 60; // trim the JSON file so it doesn't grow forever
const MAX_NEW_PER_FEED = 5; // safety cap so one feed can't flood a single run

const DATA_PATH = new URL("../data/articles.json", import.meta.url);
const FEEDS_PATH = new URL("./feeds.json", import.meta.url);

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf-8"));
}

async function classifyAndSummarize(item, source) {
  const prompt = `You are helping curate a daily news briefing about global offices, workplaces, commercial real estate, and hybrid work.

Given this article, respond with ONLY a JSON object (no markdown, no commentary) in this exact shape:
{
  "region": "na" | "eu" | "asia" | "global",
  "category": "design" | "work" | "estate" | "culture",
  "en": { "title": string, "bullets": [string, string, string] },
  "ja": { "title": string, "bullets": [string, string, string] }
}

Rules:
- "region": the geography the story is mainly about. Use "global" if it's not tied to one region.
- "category": "design" = office space/architecture, "work" = hybrid/remote/work policy, "estate" = commercial real estate/rent/vacancy, "culture" = HR/company culture/org policy.
- Titles: concise, factual, no clickbait.
- Bullets: exactly 3, each one factual sentence, no fluff.
- "ja" must be a natural Japanese translation, not a literal word-for-word one.
- If the article is not actually about offices/workplaces/commercial real estate/hybrid work, respond with {"skip": true} instead.

Article source: ${source}
Article title: ${item.title}
Article summary/content: ${(item.contentSnippet || item.content || "").slice(0, 1500)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  const cleaned = text.replace(/^```json\s*|\s*```$/g, "");
  return JSON.parse(cleaned);
}

function slugId(url) {
  return "a_" + Buffer.from(url).toString("base64url").slice(0, 32);
}

// Tries several common places RSS feeds put an article's lead image.
function extractImage(item) {
  if (item.enclosure?.url && (item.enclosure.type || "").startsWith("image")) {
    return item.enclosure.url;
  }
  if (Array.isArray(item.mediaContent) && item.mediaContent.length) {
    const withUrl = item.mediaContent.find((m) => m?.$?.url);
    if (withUrl) return withUrl.$.url;
  }
  if (item.mediaThumbnail?.$?.url) {
    return item.mediaThumbnail.$.url;
  }
  const html = item["content:encoded"] || item.content || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return match[1];
  return null;
}

// Fallback for feeds that don't include an image: fetch the article page itself
// and look for its Open Graph / Twitter Card image meta tag (almost every
// modern news site sets one, even when the RSS feed omits it).
async function fetchPageImage(url) {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; OfficeWireBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const og =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    return og ? og[1] : null;
  } catch (err) {
    console.error(`Could not fetch page image for ${url}:`, err.message);
    return null;
  }
}

async function main() {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set. Add it as a GitHub Actions secret.");
  }

  const feeds = await loadJson(FEEDS_PATH);
  const existing = await loadJson(DATA_PATH);
  const knownUrls = new Set(existing.map((a) => a.url));

  const parser = new Parser({
    customFields: {
      item: [
        ["media:content", "mediaContent", { keepArray: true }],
        ["media:thumbnail", "mediaThumbnail"],
      ],
    },
  });
  const newArticles = [];

  for (const feed of feeds) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const candidates = (parsed.items || [])
        .filter((item) => item.link && !knownUrls.has(item.link))
        .slice(0, MAX_NEW_PER_FEED);

      for (const item of candidates) {
        try {
          const result = await classifyAndSummarize(item, feed.source);
          if (result.skip) continue;

          newArticles.push({
            id: slugId(item.link),
            date: (item.isoDate || new Date().toISOString()).slice(0, 10),
            region: result.region,
            category: result.category,
            source: feed.source,
            url: item.link,
            image: extractImage(item) || (await fetchPageImage(item.link)),
            i18n: { en: result.en, ja: result.ja },
          });
          knownUrls.add(item.link);
        } catch (err) {
          console.error(`Failed to summarize "${item.title}" from ${feed.source}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch feed ${feed.source} (${feed.url}):`, err.message);
    }
  }

  console.log(`Fetched ${newArticles.length} new article(s).`);

  const merged = [...newArticles, ...existing]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, MAX_ARTICLES_KEPT);

  await writeFile(DATA_PATH, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${merged.length} total article(s) to data/articles.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
