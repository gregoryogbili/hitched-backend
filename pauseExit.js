// pauseExit.js

export function pauseMatch(match) {
  return {
    ...match,
    status: "paused",
    pause_message:
      "This connection is paused. There is no obligation to continue or decide anything now.",
    paused_at: new Date().toISOString()
  };
}

export function closeMatch(match) {
  return {
    ...match,
    status: "closed",
    closing_message:
      "This connection has been gently closed. Thank you for being intentional.",
    closed_at: new Date().toISOString()
  };
}
