import { NextResponse } from "next/server";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const MAX_IMAGE_CHARS = 4_000_000;
const PER_HOUR = 30;

// Basic protection so a stranger cannot burn your API credit.
// (Memory is per server instance, so this is a speed bump, not a wall.
//  Also set a monthly spend limit in the Anthropic console.)
const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + 3_600_000 });
    return false;
  }
  h.n += 1;
  return h.n > PER_HOUR;
}

const SYSTEM =
  "You read household electricity meters (the kWh register) from photos, for an energy tracker used in the Philippines. " +
  "Never guess a digit you cannot see: use null for it and list its position as uncertain. " +
  "Answer with one JSON object and nothing else.";

function analogPrompt(dials: number) {
  return `This photo should show an analog kWh meter. Read the main register, which has ${dials} whole-number digits, from left (most significant) to right.
The register is either a row of clock-style dials with pointers, or a mechanical counter with rolling digits. Ignore any red digit or red dial (decimal part), and ignore the meter serial number and any other numbers printed on the meter.

Rules for clock-style dials:
- Neighbouring dials turn in opposite directions. Read each dial in the direction its own numbers increase.
- A pointer between two numbers means the lower number, the one it has already passed.
- If a pointer looks like it sits exactly on a number, check the dial to its right (the next less significant one). If that dial is between 5 and 9, the pointer has not really reached the number yet, so use the number below it (0 wraps back to 9).

Reply with exactly this JSON shape:
{"found": true, "digits": [${Array(dials).fill("d").join(", ")}], "uncertain": [], "confidence": "high", "note": ""}
- "found": false if no meter register is visible.
- "digits": ${dials} entries, each an integer 0-9 or null if unreadable.
- "uncertain": 0-based positions in "digits" you are not sure about.
- "confidence": "high", "medium" or "low".
- "note": one short sentence on what was hard to read (empty if nothing).`;
}

function digitalPrompt() {
  return `This photo should show a digital electricity meter display. Read the kWh (energy) value, including decimals if shown. If the display is showing something other than kWh (voltage, current, a menu), say so in "note" and set "reading" to null.

Reply with exactly this JSON shape:
{"found": true, "reading": 1016.6, "uncertain": [], "confidence": "high", "note": ""}
- "found": false if no meter display is visible.
- "reading": a number, or null if unreadable.
- "uncertain": [0] if you are unsure about the reading, otherwise [].
- "confidence": "high", "medium" or "low".
- "note": one short sentence on what was hard to read (empty if nothing).`;
}

interface UpstreamBlock {
  type: string;
  text?: string;
}

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Automatic reading is not set up yet. Add ANTHROPIC_API_KEY to the project settings." },
      { status: 503 },
    );
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (limited(ip)) {
    return NextResponse.json(
      { error: "Too many scans for now. Try again later or enter the reading manually." },
      { status: 429 },
    );
  }

  let body: { image?: unknown; meterType?: unknown; dials?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const image = typeof body.image === "string" ? body.image : "";
  const match = image.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match || image.length > MAX_IMAGE_CHARS) {
    return NextResponse.json({ error: "Send a JPEG, PNG or WebP photo under 3 MB." }, { status: 400 });
  }
  const meterType = body.meterType === "digital" ? "digital" : "analog";
  const dials = Math.min(8, Math.max(3, Math.round(Number(body.dials)) || 5));

  let upstream: Response;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: match[1], data: match[2] } },
              { type: "text", text: meterType === "analog" ? analogPrompt(dials) : digitalPrompt() },
            ],
          },
        ],
      }),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the reading service. Try again." }, { status: 502 });
  }

  if (!upstream.ok) {
    console.error("read-meter upstream error", upstream.status, await upstream.text().catch(() => ""));
    return NextResponse.json(
      { error: "The reading service had a problem. Try again or enter the reading manually." },
      { status: 502 },
    );
  }

  const data = (await upstream.json().catch(() => ({}))) as { content?: UpstreamBlock[] };
  const text = (data.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("");
  const jsonText = text.match(/\{[\s\S]*\}/)?.[0];
  let parsed: Record<string, unknown> = {};
  try {
    parsed = jsonText ? JSON.parse(jsonText) : {};
  } catch {
    parsed = {};
  }

  if (parsed.found === false) {
    return NextResponse.json(
      { error: "No meter found in the photo. Retake it with the whole register inside the frame." },
      { status: 422 },
    );
  }

  const confidence = ["high", "medium", "low"].includes(parsed.confidence as string)
    ? (parsed.confidence as "high" | "medium" | "low")
    : "low";
  const note = typeof parsed.note === "string" ? parsed.note.slice(0, 200) : "";
  const rawUncertain = Array.isArray(parsed.uncertain) ? parsed.uncertain : [];

  if (meterType === "analog") {
    const raw = Array.isArray(parsed.digits) ? parsed.digits : [];
    const digits = Array.from({ length: dials }, (_, i) => {
      const v = raw[i];
      return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 9 ? v : null;
    });
    const uncertain = new Set<number>();
    for (const u of rawUncertain) {
      if (typeof u === "number" && Number.isInteger(u) && u >= 0 && u < dials) uncertain.add(u);
    }
    digits.forEach((d, i) => {
      if (d === null) uncertain.add(i);
    });
    const reading = digits.every((d) => d !== null) ? Number(digits.join("")) : null;
    return NextResponse.json({ digits, reading, uncertain: [...uncertain].sort(), confidence, note });
  }

  const reading =
    typeof parsed.reading === "number" && Number.isFinite(parsed.reading) && parsed.reading >= 0
      ? parsed.reading
      : null;
  return NextResponse.json({
    digits: [],
    reading,
    uncertain: reading === null ? [0] : rawUncertain.length ? [0] : [],
    confidence: reading === null ? "low" : confidence,
    note,
  });
}