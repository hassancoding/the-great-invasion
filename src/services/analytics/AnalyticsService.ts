/**
 * Centralized analytics abstraction.
 * Never scatter tracking calls throughout the game.
 */

type EventName =
  | "game_started"
  | "game_completed"
  | "game_failed"
  | "new_high_score"
  | "share_clicked"
  | "daily_challenge_started"
  | "daily_challenge_completed"
  | "leaderboard_viewed"
  | "ad_impression"
  | "rewarded_ad_started"
  | "rewarded_ad_completed"
  | "replay_clicked"
  | "menu_viewed";

class AnalyticsService {
  private enabled = true;

  track(event: EventName, props?: Record<string, string | number | boolean>) {
    if (!this.enabled) return;
    try {
      if (process.env.NODE_ENV === "development") {
        console.info(`[Analytics] ${event}`, props ?? {});
      }
    } catch {
    }
  }

  setEnabled(value: boolean) {
    this.enabled = value;
  }
}

export const analytics = new AnalyticsService();
