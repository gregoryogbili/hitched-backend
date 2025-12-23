// toneGuard.js

const FORBIDDEN_PHRASES = [
  "you should",
  "you must",
  "act now",
  "don’t miss",
  "last chance",
  "guaranteed",
  "fix this",
  "this will work"
];

export function applyToneGuard(response) {
  if (!response || typeof response !== "object") return response;

  const sanitizeText = (text) => {
    if (typeof text !== "string") return text;

    let sanitized = text.toLowerCase();

    FORBIDDEN_PHRASES.forEach(phrase => {
      if (sanitized.includes(phrase)) {
        sanitized = sanitized.replace(phrase, "you may consider");
      }
    });

    // Restore capitalization softly
    return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
  };

  const deepSanitize = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(deepSanitize);
    }

    if (typeof obj === "object" && obj !== null) {
      const clean = {};
      for (const key in obj) {
        clean[key] = deepSanitize(obj[key]);
      }
      return clean;
    }

    return sanitizeText(obj);
  };

  return deepSanitize(response);
}
