// secondDate.js

export function secondDateGuidance(match) {
  return {
    message: "You both expressed interest in seeing each other again.",

    suggested_date_styles: [
      "Casual dinner with time to talk",
      "Shared activity (museum, games, class)",
      "Relaxed walk + coffee"
    ],

    guidance: [
      "Keep expectations light.",
      "Focus on enjoying time together.",
      "If it feels right, you may exchange numbers."
    ],

    coach_note: "Don’t forget to smile — comfort creates connection.",

    autonomy_note:
      "You’re free to take things forward in your own way. The AI is here if you want guidance.",

    generated_at: new Date().toISOString()
  };
}
