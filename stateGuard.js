// stateGuard.js

const ALLOWED_TRANSITIONS = {
  matched: ["invite_sent"],
  invite_sent: ["invite_accepted"],
  invite_accepted: ["date_scheduled"],
  date_scheduled: ["second_date", "closed"],
  second_date: ["closed"]
};

export function canTransition(currentState, nextState) {
  if (!currentState || !nextState) return false;
  const allowed = ALLOWED_TRANSITIONS[currentState] || [];
  return allowed.includes(nextState);
}

export function guardTransition(match, nextState) {
  if (!canTransition(match.status, nextState)) {
    return {
      allowed: false,
      error: `Invalid state transition: ${match.status} → ${nextState}`
    };
  }

  return { allowed: true };
}
