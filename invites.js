// invites.js

export function sendInvite(match) {
  return {
    ...match,
    status: "invite_sent",
    invite: {
      message: "You have a blind-date invite",
      score: match.score,
      reasons: match.reasons
    },
    updated_at: new Date().toISOString()
  };
}
