// src/data/campaignGoals.ts
import type { CampaignGoalType, CampaignGoalDefaults } from "@/types/campaign";
import { GOAL_DEFAULTS } from "@/types/campaign";

export interface GoalDefinition {
  type: CampaignGoalType;
  label: string;
  shortDescription: string;
  icon: string; // component name from @vicons/ionicons5
  recommended: boolean;
  seasonal: boolean;
  displayPriority: "primary" | "more";
  comingSoon?: boolean;
  defaults: CampaignGoalDefaults;
}

export const CAMPAIGN_GOALS: GoalDefinition[] = [
  {
    type: "neighbor_marketing",
    label: "Neighbor Marketing",
    shortDescription:
      "Target neighbors of your recent jobs. They already see your truck in the driveway.",
    icon: "PeopleOutline",
    recommended: true,
    seasonal: false,
    displayPriority: "primary",
    defaults: GOAL_DEFAULTS.neighbor_marketing,
  },
  {
    type: "target_area",
    label: "Target an Area",
    shortDescription:
      "Pick any neighborhood on the map. Great for expanding into new areas.",
    icon: "MapOutline",
    recommended: false,
    seasonal: false,
    displayPriority: "primary",
    defaults: GOAL_DEFAULTS.target_area,
  },
  {
    type: "seasonal_tuneup",
    label: "Seasonal Tune-Up",
    shortDescription:
      "Remind last year's customers it's time again — plus reach their neighbors.",
    icon: "CalendarOutline",
    recommended: false,
    seasonal: true,
    displayPriority: "more", // promoted to 'primary' in season by getGoalsForDisplay()
    defaults: GOAL_DEFAULTS.seasonal_tuneup,
  },
  {
    type: "storm_response",
    label: "Storm Response",
    shortDescription:
      "Reach affected homeowners fast. No frequency cap — this is urgent.",
    icon: "ThunderstormOutline",
    recommended: false,
    seasonal: false,
    displayPriority: "more",
    defaults: GOAL_DEFAULTS.storm_response,
  },
  {
    type: "win_back",
    label: "Win Back",
    shortDescription:
      "Re-engage customers who haven't called in 12+ months.",
    icon: "HeartOutline",
    recommended: false,
    seasonal: false,
    displayPriority: "more",
    defaults: GOAL_DEFAULTS.win_back,
  },
  {
    type: "cross_service_promo",
    label: "Cross-Service Promotion",
    shortDescription:
      "Your heating customers might need AC too. Promote a different service.",
    icon: "SwapHorizontalOutline",
    recommended: false,
    seasonal: false,
    displayPriority: "more",
    defaults: GOAL_DEFAULTS.cross_service_promo,
  },
  {
    type: "new_mover",
    label: "New Mover Welcome",
    shortDescription:
      "Reach recent homebuyers in your area — they spend heavily in their first 2 years.",
    icon: "HomeOutline",
    recommended: false,
    seasonal: false,
    displayPriority: "more",
    comingSoon: true,
    defaults: GOAL_DEFAULTS.new_mover,
  },
  {
    type: "other",
    label: "Something Else",
    shortDescription:
      "Tell us what you want to accomplish and we'll help set it up.",
    icon: "CreateOutline",
    recommended: false,
    seasonal: false,
    displayPriority: "more",
    defaults: GOAL_DEFAULTS.other,
  },
];

/**
 * Seasonal logic: promote seasonal_tuneup to primary in March-May and Sep-Nov.
 * Coming Soon goals always go in "more" section.
 */
export function getGoalsForDisplay(): {
  primary: GoalDefinition[];
  more: GoalDefinition[];
} {
  const month = new Date().getMonth() + 1; // 1-12
  const isInSeason = (month >= 3 && month <= 5) || (month >= 9 && month <= 11);

  const all = CAMPAIGN_GOALS.map((g) => ({
    ...g,
    displayPriority:
      g.seasonal && isInSeason
        ? ("primary" as const)
        : g.displayPriority,
  }));

  return {
    primary: all
      .filter((g) => g.displayPriority === "primary" && !g.comingSoon)
      .slice(0, 3),
    more: all.filter(
      (g) => g.displayPriority === "more" || g.comingSoon,
    ),
  };
}
