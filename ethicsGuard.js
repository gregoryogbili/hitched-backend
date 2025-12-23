// ethicsGuard.js

// Phrases we DO NOT allow the AI to push directly to users
const SEXUAL_SUGGESTIONS = [
  "kiss them",
  "kiss her",
  "kiss him",
  "sleep with",
  "have sex",
  "be intimate with",
  "try being more intimate",
  "touch their",
  "touch her",
  "touch him"
];

const ATTRACTIVENESS_RANKING = [
  "out of 10",
  "/10",
  "hotter than",
  "more beautiful than",
  "more attractive than",
  "less attractive than",
  "too ugly",
  "too fat",
  "too short"
];

const COERCIVE_PUSH = [
  "you can't miss this",
  "you will regret it",
  "this is your only chance",
  "prove yourself",
  "if you don't do this",
  "you have to do this"
];

function sanitizeTextHard(text) {
  if (typeof text !== "string") return text;

  let lower = text.toLowerCase();
  let flagged = false;

  const allForbidden = [
    ...SEXUAL_SUGGESTIONS,
    ...ATTRACTIVENESS_RANKING,
    ...COERCIVE_PUSH
  ];

  allForbidden.forEach(phrase => {
    if (lower.includes(phrase)) {
      flagged = true;
    }
  });

  if (flagged) {
    return (
      "Some thoughts about dating are very personal. " +
      "Please focus on comfort, consent, and your own boundaries. " +
      "If you feel unsure, you may pause and reflect or talk to someone you trust."
    );
  }

  return text;
}

function deepEthicsClean(obj) {
  if (Array.isArray(obj)) {
    return obj.map(deepEthicsClean);
  }

  if (typeof obj === "object" && obj !== null) {
    const clean = {};
    for (const key in obj) {
      clean[key] = deepEthicsClean(obj[key]);
    }
    return clean;
  }

  return sanitizeTextHard(obj);
}

// Main entry: call this on any object before sending to user
export function applyEthicsGuard(response) {
  if (!response || typeof response !== "object") return response;
  return deepEthicsClean(response);
}
