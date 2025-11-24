import crypto from "crypto";
import { getCsvLines, splitCsvLine } from "../csvParser";
import { invokeLLM } from "../llm";
import { ENV } from "../env";
import { EnrichedConnectionProfile, LinkedInConnectionRow } from "./types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function buildProfileId(row: LinkedInConnectionRow) {
  const base = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  const fallback = row.linkedinUrl || row.email || row.company || "connection";
  const slug = slugify(base || fallback);
  if (slug.length > 0) return slug;
  return crypto.createHash("md5").update(JSON.stringify(row)).digest("hex").slice(0, 12);
}

function inferRole(row: LinkedInConnectionRow): EnrichedConnectionProfile["role"] {
  const title = `${row.title || ""} ${row.company || ""}`.toLowerCase();
  if (title.match(/partner|investor|principal|vc|venture|capital|angel|fund|family office/)) {
    return "investor";
  }
  if (title.match(/founder|co[- ]founder|ceo|cto|cpo|coo/)) {
    return "founder";
  }
  return "operator";
}

export function parseLinkedInConnections(csvData: string, limit = 20): LinkedInConnectionRow[] {
  const lines = getCsvLines(csvData).filter(line => line && !line.toLowerCase().startsWith("notes"));
  const headerIndex = lines.findIndex(line => line.toLowerCase().includes("first name"));
  if (headerIndex === -1) return [];

  const headers = splitCsvLine(lines[headerIndex]);
  const dataLines = lines.slice(headerIndex + 1);

  const rows: LinkedInConnectionRow[] = [];
  for (const line of dataLines) {
    if (!line.trim()) continue;
    const values = splitCsvLine(line);
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header.trim()] = values[idx] || "";
    });

    const row: LinkedInConnectionRow = {
      firstName: record["First Name"] || "",
      lastName: record["Last Name"] || "",
      linkedinUrl: record["URL"] || "",
      email: record["Email Address"] || "",
      company: record["Company"] || "",
      title: record["Position"] || "",
      connectedOn: record["Connected On"] || "",
    };

    if (row.firstName || row.lastName || row.linkedinUrl) {
      rows.push(row);
    }
    if (rows.length >= limit) break;
  }
  return rows;
}

type LlmProfile = Partial<Pick<EnrichedConnectionProfile,
  "role" | "sector" | "stage" | "geography" | "summary" | "thesis" | "focusAreas" | "checkSizeMin" | "checkSizeMax" | "tags" | "sources" | "accuracy"
>>;

async function runLlmEnrichment(row: LinkedInConnectionRow): Promise<LlmProfile | null> {
  if (!process.env.OPENAI_API_KEY && !ENV.forgeApiKey) {
    return null;
  }

  const schema = {
    name: "connection_profile",
    schema: {
      type: "object",
      properties: {
        role: { type: "string", enum: ["investor", "founder", "operator"] },
        summary: { type: "string" },
        thesis: { type: "string" },
        sector: { type: "string" },
        stage: { type: "string" },
        geography: { type: "string" },
        focusAreas: { type: "array", items: { type: "string" } },
        checkSizeMin: { type: "number" },
        checkSizeMax: { type: "number" },
        tags: { type: "array", items: { type: "string" } },
        sources: { type: "array", items: { type: "string" } },
        accuracy: { type: "number" },
      },
      required: ["role", "accuracy"],
      additionalProperties: true,
    },
    strict: false,
  };

  const messages = [
    {
      role: "system" as const,
      content:
        "You are an analyst enriching LinkedIn connection exports. Use only well-supported public information. If you are unsure, set fields to null/empty and keep accuracy low. Do not invent companies or achievements.",
    },
    {
      role: "user" as const,
      content: `Profile seed:
- Name: ${row.firstName} ${row.lastName}
- Title: ${row.title || "unknown"}
- Company: ${row.company || "unknown"}
- LinkedIn: ${row.linkedinUrl || "unknown"}
- Email: ${row.email || "unknown"}
- Connected On: ${row.connectedOn || "unknown"}

Return concise factual enrichment.`,
    },
  ];

  const response = await invokeLLM({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages,
    response_format: { type: "json_schema", json_schema: schema },
    max_tokens: 1200,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return null;

  const raw =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.map(part => (part as any).text || "").join("\n")
        : "";

  try {
    return JSON.parse(raw) as LlmProfile;
  } catch {
    return null;
  }
}

export async function enrichConnection(row: LinkedInConnectionRow): Promise<EnrichedConnectionProfile> {
  const baseRole = inferRole(row);
  const fullName = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  const profileId = buildProfileId(row);

  const llmResult = await runLlmEnrichment(row);

  const accuracy = llmResult?.accuracy ?? 40;
  const role = llmResult?.role || baseRole;
  const tags = Array.from(
    new Set(
      [
        row.company,
        row.title,
        ...(llmResult?.tags || []),
        ...(llmResult?.focusAreas || []),
      ]
        .filter(Boolean)
        .map(tag => String(tag)),
    ),
  );

  return {
    id: profileId,
    fullName: fullName || profileId,
    company: row.company || undefined,
    title: row.title || undefined,
    linkedinUrl: row.linkedinUrl || undefined,
    email: row.email || undefined,
    role,
    sector: llmResult?.sector,
    stage: llmResult?.stage,
    geography: llmResult?.geography,
    checkSizeMin: llmResult?.checkSizeMin,
    checkSizeMax: llmResult?.checkSizeMax,
    focusAreas: llmResult?.focusAreas,
    summary:
      llmResult?.summary ||
      `Connection from LinkedIn export (${row.title || "no title"} at ${row.company || "unknown company"})`,
    thesis: llmResult?.thesis,
    accuracy: Math.max(0, Math.min(100, Math.round(accuracy))),
    confidence: Math.max(50, Math.min(95, Math.round(accuracy || 40))),
    tags,
    sources: llmResult?.sources || (row.linkedinUrl ? [row.linkedinUrl] : undefined),
    notes: llmResult ? undefined : "LLM enrichment unavailable – using CSV details only",
    lastEnrichedAt: new Date().toISOString(),
    source: row,
    attachedFiles: [],
    matchStatus: "not_synced",
  };
}
