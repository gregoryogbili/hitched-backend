// coach.js

export function coachRespond({ stage, question }) {
  return {
    tone: "calm and encouraging",

    reminders: [
      "Don’t forget to smile — it helps both of you relax.",
      "Stay present and kind to yourself."
    ],

    boundaries: [
      "Avoid exchanging numbers until after the AI-led post-date review.",
      "This helps reduce pressure and keeps things intentional."
    ],

    reflection:
      stage === "before_date"
        ? "It’s normal to feel a mix of curiosity and nerves before meeting someone."
        : "Take a moment to reflect on how you felt during the interaction.",

    guidance: [
      "Be honest about your intentions.",
      "Listen more than you speak.",
      "Notice how you feel around them, not just what they say."
    ],

    suggested_message:
      stage === "after_date"
        ? "I enjoyed meeting you. I’d like to reflect and see how we both feel before planning next steps."
        : null,

    next_step:
      stage === "after_date"
        ? "complete_post_date_reflection"
        : "attend_date",

    generated_at: new Date().toISOString()
  };
}
