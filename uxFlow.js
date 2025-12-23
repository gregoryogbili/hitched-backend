// uxFlow.js

export function getUXFlow(match) {
  if (!match) {
    return {
      stage: "onboarding",
      visible_features: [
        "expectation_screen",
        "profile_setup"
      ],
      message: "Take your time getting started."
    };
  }

  switch (match.status) {
    case "matched":
      return {
        stage: "matched",
        visible_features: [
          "match_summary",
          "wait_state"
        ],
        message: "A connection is available when you’re ready."
      };

    case "invite_sent":
      return {
        stage: "invite_sent",
        visible_features: [
          "invite_notification",
          "accept_button"
        ],
        message: "No rush. Accept when it feels right."
      };

    case "invite_accepted":
      return {
        stage: "invite_accepted",
        visible_features: [
          "date_options",
          "coach_before_date"
        ],
        message: "Here are a few gentle options."
      };

    case "date_scheduled":
      return {
        stage: "date_scheduled",
        visible_features: [
          "date_details",
          "coach_before_date",
          "safety_reminders"
        ],
        message: "Focus on the experience, not the outcome."
      };

    case "second_date":
      return {
        stage: "second_date",
        visible_features: [
          "second_date_guidance",
          "relationship_coach",
          "number_exchange_optional"
        ],
        message: "If you’re curious, here are some ideas."
      };

    case "closed":
      return {
        stage: "closed",
        visible_features: [
          "reflection",
          "exit_confirmation"
        ],
        message: "Thank you for being intentional."
      };

    default:
      return {
        stage: "unknown",
        visible_features: [],
        message: "Take a pause."
      };
  }
}
