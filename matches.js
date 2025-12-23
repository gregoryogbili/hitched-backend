// matches.js

export function createMatch({ userA, userB, score, reasons }) {
  return {
    match_id: `${userA}_${userB}_${Date.now()}`,
    users: [userA, userB],
    score,
    reasons,
    status: "matched", // matched | invite_sent | invite_accepted | date_scheduled
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
