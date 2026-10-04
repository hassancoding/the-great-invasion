/**
 * AdService abstraction.
 * Allows swapping ad providers later without changing game code.
 * Currently a safe no-op / placeholder that never crashes the game.
 */

export type AdPlacement = "banner" | "interstitial" | "rewarded";

class AdService {
  private initialized = false;
  private interstitialReady = false;
  private rewardedReady = false;
  private lastInterstitial = 0;
  private readonly INTERSTITIAL_COOLDOWN = 90_000;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      this.initialized = true;
      this.interstitialReady = true;
      this.rewardedReady = true;
      console.info("[AdService] Initialized (placeholder mode)");
    } catch (err) {
      console.warn("[AdService] Init failed, continuing without ads", err);
      this.initialized = true;
    }
  }

  showBanner(containerId: string): void {
    if (!this.initialized) return;
    const el = document.getElementById(containerId);
    if (el) {
      // reserved
    }
  }

  async showInterstitial(): Promise<boolean> {
    if (!this.initialized || !this.interstitialReady) return false;
    const now = Date.now();
    if (now - this.lastInterstitial < this.INTERSTITIAL_COOLDOWN) return false;
    try {
      this.lastInterstitial = now;
      console.info("[AdService] Interstitial shown (placeholder)");
      return true;
    } catch {
      return false;
    }
  }

  isRewardedAdAvailable(): boolean {
    return this.initialized && this.rewardedReady;
  }

  async showRewardedAd(): Promise<boolean> {
    if (!this.isRewardedAdAvailable()) return false;
    try {
      console.info("[AdService] Rewarded ad completed (placeholder)");
      return true;
    } catch {
      return false;
    }
  }
}

export const adService = new AdService();
