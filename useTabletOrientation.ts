import { useState, useEffect, useCallback } from 'react';

export interface TabletOrientationInfo {
  isPortrait: boolean;
  isLandscape: boolean;
  isTablet: boolean;
  canLockOrientation: boolean;
  isPromptDismissed: boolean;
  requestLandscapeLock: () => Promise<boolean>;
  unlockOrientation: () => void;
  dismissPrompt: () => void;
  resetPrompt: () => void;
}

export function useTabletOrientation(): TabletOrientationInfo {
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(orientation: portrait)').matches || window.innerHeight > window.innerWidth;
  });

  const [isTablet, setIsTablet] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const width = Math.min(window.innerWidth, window.innerHeight);
    const maxDim = Math.max(window.innerWidth, window.innerHeight);
    // Standard tablet form factors: iPad Mini (768), iPad (810-834), iPad Pro (1024), Android tablets (600-800+)
    return width >= 500 && maxDim <= 1400;
  });

  const [isPromptDismissed, setIsPromptDismissed] = useState<boolean>(() => {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem('cashfix_landscape_prompt_dismissed') === 'true';
  });

  const canLockOrientation = typeof screen !== 'undefined' && 'orientation' in screen && 'lock' in screen.orientation;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOrientation = () => {
      const portrait =
        window.matchMedia('(orientation: portrait)').matches ||
        window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);

      const width = Math.min(window.innerWidth, window.innerHeight);
      const maxDim = Math.max(window.innerWidth, window.innerHeight);
      setIsTablet(width >= 500 && maxDim <= 1400);
    };

    updateOrientation();

    // Orientation change event listener
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', updateOrientation);
    }

    const mql = window.matchMedia('(orientation: portrait)');
    const handleMql = (e: MediaQueryListEvent) => {
      setIsPortrait(e.matches);
    };

    try {
      mql.addEventListener('change', handleMql);
    } catch {
      mql.addListener(handleMql);
    }

    window.addEventListener('resize', updateOrientation);

    return () => {
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', updateOrientation);
      }
      try {
        mql.removeEventListener('change', handleMql);
      } catch {
        mql.removeListener(handleMql);
      }
      window.removeEventListener('resize', updateOrientation);
    };
  }, []);

  const requestLandscapeLock = useCallback(async (): Promise<boolean> => {
    try {
      // 1. Direct modern screen.orientation.lock
      if (typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
        // Try lock directly
        try {
          await (screen.orientation as any).lock('landscape');
          return true;
        } catch (e: any) {
          // If browser requires fullscreen first to lock orientation (Chromium/Android)
          if (document.documentElement && document.documentElement.requestFullscreen) {
            try {
              if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
              }
              await (screen.orientation as any).lock('landscape');
              return true;
            } catch {}
          }
        }
      }
    } catch (err) {
      console.warn('Orientation lock notice:', err);
    }
    return false;
  }, []);

  const unlockOrientation = useCallback(() => {
    try {
      if (typeof screen !== 'undefined' && screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock();
      }
    } catch (err) {
      console.warn('Orientation unlock error:', err);
    }
  }, []);

  const dismissPrompt = useCallback(() => {
    setIsPromptDismissed(true);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('cashfix_landscape_prompt_dismissed', 'true');
    }
  }, []);

  const resetPrompt = useCallback(() => {
    setIsPromptDismissed(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('cashfix_landscape_prompt_dismissed');
    }
  }, []);

  return {
    isPortrait,
    isLandscape: !isPortrait,
    isTablet,
    canLockOrientation,
    isPromptDismissed,
    requestLandscapeLock,
    unlockOrientation,
    dismissPrompt,
    resetPrompt,
  };
}
