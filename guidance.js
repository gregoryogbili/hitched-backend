// guidance.js

export function generateDateGuidance(match) {
  return {
    questions: [
      "What does a good weekend look like for you?",
      "What’s something you’ve learned about yourself this year?",
      "What kind of friendships do you value most?",
      "What does ‘intentional connection’ mean to you?"
    ],
    activities: [
      "Take a short walk after meeting to ease nerves",
      "Order something new and share why you chose it",
      "Play a light question game (no rapid-fire)"
    ],
    tips: [
      "Be present — no phone checking",
      "Listen to understand, not to respond",
      "There is no pressure to impress"
    ],
    tone: "relaxed and curious",
    generated_at: new Date().toISOString()
  };
}
