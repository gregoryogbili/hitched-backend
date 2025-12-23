// emotionalSafety.js

export function emotionalSafetyCoach(input) {
  const { feeling, intensity } = input;

  const grounding = [
    "Take a slow breath in through your nose.",
    "Let your shoulders relax.",
    "Notice where you are right now."
  ];

  const validation =
    "What you’re feeling is understandable. Dating can bring up strong emotions.";

  const reassurance =
    "You don’t need to make any decisions while emotions are high.";

  const external_support =
    "If these feelings feel overwhelming, consider talking to someone you trust.";

  const boundaries =
    "I can help you reflect, but I can’t replace human support.";

  return {
    tone: "calm and grounding",
    validation,
    grounding,
    reassurance,
    guidance: [
      "Give yourself time before responding.",
      "Avoid reading meaning into silence.",
      "Focus on how you feel, not what you fear."
    ],
    intensity_level: intensity || "unknown",
    external_support,
    boundaries,
    generated_at: new Date().toISOString()
  };
}
