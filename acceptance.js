// acceptance.js

export function acceptInvite(match, user_id) {
  return {
    ...match,
    status: "invite_accepted",
    accepted_by: match.accepted_by
      ? [...new Set([...match.accepted_by, user_id])]
      : [user_id],
    updated_at: new Date().toISOString()
  };
}
