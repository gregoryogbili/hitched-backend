// scheduler.js

export function proposeDateOptions(match) {
  return [
    {
      option_id: "opt1",
      type: "physical",
      location: "Central Birmingham Café",
      date: "2025-12-22",
      time: "18:30"
    },
    {
      option_id: "opt2",
      type: "physical",
      location: "Brindleyplace Walk & Coffee",
      date: "2025-12-23",
      time: "17:00"
    },
    {
      option_id: "opt3",
      type: "physical",
      location: "Mailbox Public Restaurant",
      date: "2025-12-24",
      time: "19:00"
    }
  ];
}

export function confirmDate(match, selectedOption) {
  return {
    ...match,
    status: "date_scheduled",
    date_details: selectedOption,
    safety_reminders: [
      "Meet in a public place.",
      "Tell someone where you’re going.",
      "Trust your instincts."
    ],
    updated_at: new Date().toISOString()
  };
}
