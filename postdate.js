// postdate.js

export function recordPostDateFeedback(match, user_id, feedback) {
  const reflections = match.post_date_feedback || {};

  reflections[user_id] = {
    ...feedback,
    submitted_at: new Date().toISOString()
  };

  // Simple confidence logic
  const allFeedback = Object.values(reflections);
  const positiveCount = allFeedback.filter(f => f.interested === true).length;

  let recommendation = "pause";
  if (positiveCount === 2) recommendation = "second_date";
  if (positiveCount === 0 && allFeedback.length === 2) recommendation = "close";

  return {
    ...match,
    post_date_feedback: reflections,
    recommendation,
    updated_at: new Date().toISOString()
  };
}
