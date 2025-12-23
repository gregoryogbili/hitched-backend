// safety.js

export function handleSafetyReport(input) {
  const { reason, details, emotional_state } = input;

  return {
    status: "received",
    message:
      "Thank you for speaking up. Your report has been recorded. You are not required to take any further action.",
    reassurance:
      "Your safety and comfort matter. You may step back or exit the match at any time.",
    next_steps: [
      "Take time for yourself",
      "Reach out to someone you trust",
      "Continue only if you feel comfortable"
    ],
    internal_record: {
      reason,
      details,
      emotional_state,
      reviewed: false
    },
    received_at: new Date().toISOString()
  };
}
