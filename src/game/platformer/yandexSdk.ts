/**
 * Yandex Games SDK wrapper — safe no-op when SDK is missing (local / non-Yandex host).
 */
type YaGamesSdk = {
  features?: {
    LoadingAPI?: { ready: () => void };
    GameplayAPI?: { start: () => void; stop: () => void };
  };
  adv?: {
    showFullscreenAdv: (opts: {
      callbacks?: { onClose?: (wasShown: boolean) => void; onError?: (e: unknown) => void };
    }) => void;
    showRewardedVideo: (opts: {
      callbacks?: {
        onOpen?: () => void;
        onRewarded?: () => void;
        onClose?: (wasShown: boolean) => void;
        onError?: (e: unknown) => void;
      };
    }) => void;
  };
};

declare global {
  interface Window {
    YaGames?: { init: (opts?: { signed?: boolean }) => Promise<YaGamesSdk> };
  }
}

let ysdk: YaGamesSdk | null = null;
let ready = false;

export async function initYandex(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.YaGames) return false;
  try {
    ysdk = await window.YaGames.init();
    return true;
  } catch {
    ysdk = null;
    return false;
  }
}

export function gameReady() {
  if (ready) return;
  try {
    ysdk?.features?.LoadingAPI?.ready();
    ready = true;
  } catch {}
}

export function gameplayStart() {
  try {
    ysdk?.features?.GameplayAPI?.start();
  } catch {}
}

export function gameplayStop() {
  try {
    ysdk?.features?.GameplayAPI?.stop();
  } catch {}
}

export function showInterstitial(): Promise<void> {
  return new Promise((resolve) => {
    if (!ysdk?.adv?.showFullscreenAdv) {
      resolve();
      return;
    }
    try {
      ysdk.adv.showFullscreenAdv({
        callbacks: {
          onClose: () => resolve(),
          onError: () => resolve(),
        },
      });
    } catch {
      resolve();
    }
  });
}

export function showRewarded(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!ysdk?.adv?.showRewardedVideo) {
      resolve(false);
      return;
    }
    let rewarded = false;
    try {
      ysdk.adv.showRewardedVideo({
        callbacks: {
          onRewarded: () => {
            rewarded = true;
          },
          onClose: () => resolve(rewarded),
          onError: () => resolve(false),
        },
      });
    } catch {
      resolve(false);
    }
  });
}
