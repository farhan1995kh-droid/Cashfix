import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface DevicePwaInfo {
  isIos: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isStandalone: boolean;
  canInstallPrompt: boolean;
  isOnline: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'manual-ios' | 'unsupported'>;
}

export function useDeviceAndPwa(): DevicePwaInfo {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Device detection
  const isIos = typeof window !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  const isAndroid = typeof window !== 'undefined' && /Android/i.test(navigator.userAgent);
  const isMobile = isIos || isAndroid || (typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check standalone mode (PWA running from home screen)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        // iOS Safari standalone flag
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => checkStandalone();
    try {
      displayModeQuery.addEventListener('change', handleDisplayModeChange);
    } catch {
      displayModeQuery.addListener(handleDisplayModeChange);
    }

    // Capture beforeinstallprompt for Android & Chromium browsers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Online / Offline state
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      try {
        displayModeQuery.removeEventListener('change', handleDisplayModeChange);
      } catch {
        displayModeQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual-ios' | 'unsupported'> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        return choice.outcome;
      } catch (err) {
        console.warn('Install prompt error:', err);
        return 'unsupported';
      }
    }

    if (isIos) {
      return 'manual-ios';
    }

    return 'unsupported';
  }, [deferredPrompt, isIos]);

  return {
    isIos,
    isAndroid,
    isMobile,
    isStandalone,
    canInstallPrompt: !!deferredPrompt,
    isOnline,
    promptInstall,
  };
}
