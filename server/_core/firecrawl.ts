const FIRECRAWL_BASE =
  process.env.FIRECRAWL_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3002";
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_KEY;

type ScrapeResult = {
  content?: string;
  markdown?: string;
  metadata?: Record<string, unknown>;
};

async function callFirecrawl(endpoint: string, body: Record<string, unknown>): Promise<ScrapeResult | null> {
  if (!FIRECRAWL_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${FIRECRAWL_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`[Firecrawl] ${response.status} ${response.statusText} ${detail}`);
    }

    const payload = (await response.json()) as any;
    return payload?.data || payload || null;
  } catch (error) {
    console.warn("[Firecrawl] scrape failed:", error);
    return null;
  }
}

export async function scrapeUrl(url: string): Promise<ScrapeResult | null> {
  return callFirecrawl("/v0/scrape", { url, formats: ["markdown"] });
}

export async function scrapeMultiple(urls: string[]): Promise<ScrapeResult[]> {
  const unique = Array.from(new Set(urls.filter(Boolean)));
  const results: ScrapeResult[] = [];

  for (const url of unique) {
    const scraped = await scrapeUrl(url);
    if (scraped) {
      results.push(scraped);
    }
  }

  return results;
}
