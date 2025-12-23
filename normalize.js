// normalize.js

const INTENTS = new Set(["long_term", "marriage", "companionship"]);
const TEMPERAMENTS = new Set(["calm", "energetic", "mixed"]);
const COMMS = new Set(["direct", "gentle", "reserved"]);

function cleanString(x) {
  if (typeof x !== "string") return null;
  const t = x.trim();
  return t.length ? t : null;
}

function cleanLower(x) {
  const s = cleanString(x);
  return s ? s.toLowerCase() : null;
}

function normalizeEnum(value, allowedSet) {
  const v = cleanLower(value);
  return v && allowedSet.has(v) ? v : null;
}

function normalizeValues(values) {
  if (!Array.isArray(values)) return [];
  const cleaned = values
    .map((v) => cleanLower(v))
    .filter(Boolean);
  // unique
  return [...new Set(cleaned)];
}

export function normalizeExtracted(extracted) {
  // if LLM failed, keep it but don't crash the pipeline
  if (!extracted || typeof extracted !== "object" || extracted.error) {
    return { error: extracted?.error || "No extracted data" };
  }

  return {
    relationship_intent: normalizeEnum(extracted.relationship_intent, INTENTS),
    temperament: normalizeEnum(extracted.temperament, TEMPERAMENTS),
    communication_style: normalizeEnum(extracted.communication_style, COMMS),
    location: cleanLower(extracted.location),
    values: normalizeValues(extracted.values)
  };
}
