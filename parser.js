// parser.js
export function parseTranscript(transcript) {
  return {
    age: transcript.match(/\b(\d{2})\b/)?.[1] ?? null,
    location: transcript.includes("Birmingham") ? "Birmingham" : null,
    relationship_intent: transcript.includes("long term") ? "long_term" : null,
    smoking: transcript.includes("No smoking") ? "no" : "unknown"
  };
}
