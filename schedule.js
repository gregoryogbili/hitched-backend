// schedule.js

export function scheduleDate(match, schedule) {
  return {
    ...match,
    status: "date_scheduled",
    date_details: {
      type: schedule.type,       // physical | virtual
      location: schedule.location,
      date: schedule.date,       // YYYY-MM-DD
      time: schedule.time        // HH:MM
    },
    safety_reminders: [
      "Meet in a public place.",
      "Let someone you trust know where you’re going.",
      "You can leave at any time if you feel uncomfortable."
    ],
    updated_at: new Date().toISOString()
  };
}
