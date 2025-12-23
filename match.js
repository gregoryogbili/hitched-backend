// match.js

export function scoreMatch(profileA, profileB) {
  let score = 0;
  const reasons = [];

  const a = profileA.extracted || {};
  const b = profileB.extracted || {};

  /* =========================
     Relationship intent
  ========================= */
  if (a.relationship_intent && a.relationship_intent === b.relationship_intent) {
    score += 30;
    reasons.push("Same relationship intent");
  }

  /* =========================
     Temperament
  ========================= */
  if (a.temperament && a.temperament === b.temperament) {
    score += 15;
    reasons.push("Compatible temperament");
  }

  /* =========================
     Communication style
  ========================= */
  if (a.communication_style && a.communication_style === b.communication_style) {
    score += 15;
    reasons.push("Similar communication style");
  }

  /* =========================
     Location
  ========================= */
  if (a.location && a.location === b.location) {
    score += 10;
    reasons.push("Same location");
  }

  /* =========================
     Shared values
  ========================= */
  if (Array.isArray(a.values) && Array.isArray(b.values)) {
    const sharedValues = a.values.filter(v => b.values.includes(v));
    if (sharedValues.length > 0) {
      score += sharedValues.length * 5;
      reasons.push(`Shared values: ${sharedValues.join(", ")}`);
    }
  }

  /* =========================
     Final classification
  ========================= */
  let verdict = "low";

  if (score >= 60) verdict = "high";
  else if (score >= 35) verdict = "medium";

  return {
    score,
    verdict,
    reasons
  };
}
