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
const MAX_NEW_PER_FEED = 3; // safety cap so one feed can't flood a single run

const DATA_PATH = new URL("../data/articles.json", import.meta.url);
const FEEDS_PATH = new URL("./feeds.json", import.meta.url);

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf-8"));
}

async function classifyAndSummarize(item, source) {
  const prompt = `You are helping curate a daily news briefing about global offices, workplaces, commercial real estate, and hybrid work.

Given this article, respond with ONLY a JSON object (no markdown, no commentary) in this exact shape:
{
  "region": "na" | "eu" | "asia" | "jp" | "global",
  "category": "design" | "work" | "estate" | "culture" | "ai",
  "caseStudy": boolean,
  "en": { "title": string, "bullets": [string, string, string] },
  "ja": { "title": string, "bullets": [string, string, string] },
  "zh": { "title": string, "bullets": [string, string, string] },
  "ko": { "title": string, "bullets": [string, string, string] }
}

Rules:
- "region": the geography the story is mainly about. Use "jp" specifically for stories about Japan, "asia" for other Asian countries/regions, and "global" if it's not tied to one region.
- "category": "design" = office space/architecture, "work" = general hybrid/remote/work policy (not AI-driven), "estate" = office building/commercial office space (leasing, vacancy, rent, office REITs, office construction/conversion) — NOT hotels, warehouses/industrial, retail, residential, or parking facilities, "culture" = HR/company culture/org policy, "ai" = how AI or digital tools/automation are specifically changing offices, jobs, workflows, or office real estate demand. If a story is about work policy or real estate but AI/automation is the central driver, prefer "ai" over "work" or "estate".
- "caseStudy": true if the article describes a SPECIFIC, named company or organization's completed, opened, or renovated office project (a concrete example — e.g. "Company X unveils new headquarters", "Company Y redesigns its Tokyo office"). false for general trend pieces, market data, policy news, or anything not tied to one specific named office project.
- If the article is not actually about office space, office buildings, office-adjacent commercial real estate, workplace culture/policy, or hybrid work — for example if it's about hotels, industrial/warehouse property, retail, residential real estate, parking facilities, or general business news unrelated to offices — respond with {"skip": true} instead.
- Titles: concise, factual, no clickbait.
- Bullets: exactly 3, each one factual sentence, no fluff.
- "ja" must be natural Japanese, "zh" natural Simplified Chinese, "ko" natural Korean — all real translations, not literal word-for-word ones.

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
      max_tokens: 1600,
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

// Flipboard (and similar curator) links point to a Flipboard-hosted page, not
// the original article. This follows that page to find the real source URL,
// e.g. via a canonical link tag or the first outbound link to a non-aggregator domain.
async function resolveOriginalUrl(url) {
  const aggregatorDomains = ["flipboard.com"];
  if (!aggregatorDomains.some((d) => url.includes(d))) return url;

  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; OfficeWireBot/1.0)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return url;
    const html = await res.text();

    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    if (canonical && !aggregatorDomains.some((d) => canonical[1].includes(d))) {
      return canonical[1];
    }

    // Fallback: first external link that isn't Flipboard itself or a social share link.
    const linkMatches = [...html.matchAll(/<a[^>]+href=["'](https?:\/\/[^"']+)["']/gi)];
    const skipDomains = [...aggregatorDomains, "twitter.com", "facebook.com", "instagram.com", "apps.apple.com", "play.google.com"];
    const externalLink = linkMatches
      .map((m) => m[1])
      .find((href) => !skipDomains.some((d) => href.includes(d)));

    return externalLink || url;
  } catch (err) {
    console.error(`Could not resolve original URL for ${url}:`, err.message);
    return url;
  }
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
      signal: AbortSignal.timeout(6000),
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
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
    customFields: {
      item: [
        ["media:content", "mediaContent", { keepArray: true }],
        ["media:thumbnail", "mediaThumbnail"],
      ],
    },
  });
  const newArticles = [];

  async function processFeed(feed) {
    const collected = [];
    try {
      const parsed = await parser.parseURL(feed.url);
      const candidates = (parsed.items || [])
        .filter((item) => item.link && !knownUrls.has(item.link))
        .slice(0, MAX_NEW_PER_FEED);
      console.log(
        `${feed.source}: fetched ${parsed.items?.length ?? 0} item(s), ${candidates.length} new candidate(s).`
      );

      for (const item of candidates) {
        try {
          const originalUrl = await resolveOriginalUrl(item.link);
          if (knownUrls.has(originalUrl)) continue;

          const result = await classifyAndSummarize(item, feed.source);
          if (result.skip) continue;

          collected.push({
            id: slugId(originalUrl),
            date: (item.isoDate || new Date().toISOString()).slice(0, 10),
            region: result.region,
            category: result.category,
            caseStudy: !!result.caseStudy,
            source: feed.source,
            url: originalUrl,
            image: extractImage(item) || (await fetchPageImage(originalUrl)),
            i18n: { en: result.en, ja: result.ja, zh: result.zh, ko: result.ko },
          });
          knownUrls.add(originalUrl);
        } catch (err) {
          console.error(`Failed to summarize "${item.title}" from ${feed.source}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch feed ${feed.source} (${feed.url}):`, err.message);
    }
    return collected;
  }

  // Feeds are fetched and processed in parallel — this is the main lever for
  // keeping total run time low as more feeds get added.
  const perFeedResults = await Promise.all(feeds.map(processFeed));
  perFeedResults.forEach((articles) => newArticles.push(...articles));

  console.log(`Fetched ${newArticles.length} new article(s).`);

  const merged = [...newArticles, ...existing]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, MAX_ARTICLES_KEPT);

  await writeFile(DATA_PATH, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${merged.length} total article(s) to data/articles.json`);
  process.exit(0); // force-exit: lingering keep-alive connections can otherwise stall the process
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
