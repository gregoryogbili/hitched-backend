// relationshipCoach.js

export function relationshipCoach(input) {
  const { reflection, concerns, intent } = input;

  return {
    tone: "supportive and neutral",

    reflection_summary: reflection
      ? "You’re taking time to understand how you feel — that’s healthy."
      : "It’s okay to take time to reflect.",

    guidance: [
      "You don’t need to rush decisions.",
      "Notice how you feel during and after interactions.",
      "Clear communication reduces anxiety for both people."
    ],

    communication_tips: [
      "Use 'I feel' statements rather than assumptions.",
      "It’s okay to ask for clarity.",
      "Respect your own boundaries."
    ],

    possible_next_steps:
      intent === "continue"
        ? [
            "Plan another relaxed meeting",
            "Discuss expectations gently",
            "Continue learning about each other"
          ]
        : intent === "pause"
        ? [
            "Take space to reflect",
            "Avoid pressure or forced contact",
            "Reconnect later if clarity improves"
          ]
        : intent === "end"
        ? [
            "Communicate honestly and kindly",
            "Avoid ghosting",
            "Close the interaction respectfully"
          ]
        : [
            "Reflect further",
            "Ask yourself what you want",
            "There is no rush"
          ],

    reassurance:
      "You are allowed to choose what feels right for you.",

    generated_at: new Date().toISOString()
  };
}
