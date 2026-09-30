import '../types/bridge';
import type { WebApp, WebAppUser } from '../types/bridge';

const mockUser: WebAppUser = {
  id: 772026,
  first_name: 'Анастасия',
  last_name: 'Предприниматель',
  username: 'anastasia_biz',
  language_code: 'ru',
};

const mockWebApp: WebApp = {
  initData: 'query_id=mock_demo_query_id&user=%7B%22id%22%3A772026%2C%22first_name%22%3A%22%D0%90%D0%BD%D0%B0%D1%81%D1%82%D0%B0%D1%81%D0%B8%D1%8F%22%7D&auth_date=1726750000&hash=mock_hash',
  initDataUnsafe: {
    user: mockUser,
    auth_date: 1726750000,
  },
  version: '2.0',
  platform: 'desktop',
  colorScheme: 'dark',
  themeParams: {
    bg_color: '#120D1D',
    text_color: '#FFFFFF',
    button_color: '#7045C6',
    button_text_color: '#FFFFFF',
    secondary_bg_color: '#1C132F',
  },
  isExpanded: true,
  viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
  viewportStableHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
  headerColor: '#120D1D',
  backgroundColor: '#120D1D',
  BackButton: {
    isVisible: false,
    onClick: () => {},
    offClick: () => {},
    show: () => {},
    hide: () => {},
  },
  HapticFeedback: {
    impactOccurred: (style) => console.log(`[MAX Bridge Haptic] impact: ${style}`),
    notificationOccurred: (type) => console.log(`[MAX Bridge Haptic] notification: ${type}`),
    selectionChanged: () => console.log('[MAX Bridge Haptic] selection changed'),
  },
  expand: () => console.log('[MAX Bridge] expand() called'),
  close: () => console.log('[MAX Bridge] close() called'),
  openLink: (url) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },
  ready: () => console.log('[MAX Bridge] ready() called'),
  sendData: (data) => console.log('[MAX Bridge] sendData():', data),
  enableClosingConfirmation: () => console.log('[MAX Bridge] enableClosingConfirmation() called'),
  disableClosingConfirmation: () => console.log('[MAX Bridge] disableClosingConfirmation() called'),
  isClosingConfirmationEnabled: false,
};

export function getBridge(): WebApp {
  if (typeof window !== 'undefined') {
    if (window.WebApp) return window.WebApp;
    if (window.MAXBridge) return window.MAXBridge;
  }
  return mockWebApp;
}

export function initBridge(): void {
  const bridge = getBridge();
  try {
    if (typeof bridge.ready === 'function') {
      bridge.ready();
    }
    if (typeof (bridge as any).expand === 'function') {
      (bridge as any).expand();
    }
    if (typeof bridge.enableClosingConfirmation === 'function') {
      bridge.enableClosingConfirmation();
    }
  } catch (err) {
    console.warn('[MAX Bridge] Initialization notice:', err);
  }
}

export function enableClosingConfirmation(): void {
  try {
    const bridge = getBridge();
    if (typeof bridge.enableClosingConfirmation === 'function') {
      bridge.enableClosingConfirmation();
    }
  } catch (err) {
    console.warn('[MAX Bridge] enableClosingConfirmation notice:', err);
  }
}

export function disableClosingConfirmation(): void {
  try {
    const bridge = getBridge();
    if (typeof bridge.disableClosingConfirmation === 'function') {
      bridge.disableClosingConfirmation();
    }
  } catch (err) {
    console.warn('[MAX Bridge] disableClosingConfirmation notice:', err);
  }
}

export function sendDataToChat(data: unknown): boolean {
  try {
    const bridge = getBridge();
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    if (typeof bridge.sendData === 'function') {
      bridge.sendData(payload);
      return true;
    }
  } catch (err) {
    console.warn('[MAX Bridge] sendData notice:', err);
  }
  return false;
}

export function getBridgeUser(): WebAppUser {
  const bridge = getBridge();
  return bridge.initDataUnsafe?.user || mockUser;
}

export function getDisplayUser(): WebAppUser | null {
  if (typeof window === 'undefined') return null;
  const bridge = window.WebApp || window.MAXBridge;
  return bridge?.initDataUnsafe?.user || null;
}

export function getVerifiedInitData(): string | null {
  if (typeof window === 'undefined') return null;
  const bridge = window.WebApp || window.MAXBridge;
  const initData = bridge?.initData;
  if (typeof initData !== 'string' || !initData.trim()) return null;
  return initData.trim();
}

export function getDeepLinkPayload(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check window.WebApp.initDataUnsafe.start_param
  const bridge = getBridge();
  if (bridge.initDataUnsafe?.start_param) {
    return bridge.initDataUnsafe.start_param;
  }

  // 2. Check query string: ?startapp=... or ?start_param=...
  const urlParams = new URLSearchParams(window.location.search);
  const startApp = urlParams.get('startapp') || urlParams.get('start_param');
  if (startApp) return startApp;

  // 3. Check hash query: #startapp=...
  if (window.location.hash) {
    const hash = window.location.hash.replace(/^#/, '');
    const hashParams = new URLSearchParams(hash);
    const hashStart = hashParams.get('startapp') || hashParams.get('start_param');
    if (hashStart) return hashStart;
  }

  return null;
}

export function parseStartParam(value: string | null): string | null {
  if (!value || !/^[A-Za-z0-9_-]{1,512}$/.test(value)) return null;
  if (value === 'measure' || value.startsWith('measure_')) return value;
  if (['home', 'quiz', 'catalog', 'saved', 'onboarding', 'cert'].includes(value)) return value;
  return null;
}

export function measureIdFromStartParam(value: string | null): string | null {
  const payload = parseStartParam(value);
  if (!payload || !payload.startsWith('measure_')) return null;
  return payload.slice('measure_'.length) || null;
}

export function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  try {
    const res: unknown = getBridge().HapticFeedback?.impactOccurred(style);
    if (res && typeof (res as any).catch === 'function') {
      (res as any).catch(() => {});
    }
  } catch {
    // ignore in browsers
  }
}

export function triggerSelectionChanged(): void {
  try {
    const res: unknown = getBridge().HapticFeedback?.selectionChanged();
    if (res && typeof (res as any).catch === 'function') {
      (res as any).catch(() => {});
    }
  } catch {
    // ignore in browsers
  }
}

export function triggerNotification(type: 'error' | 'success' | 'warning'): void {
  try {
    const res: unknown = getBridge().HapticFeedback?.notificationOccurred(type);
    if (res && typeof (res as any).catch === 'function') {
      (res as any).catch(() => {});
    }
  } catch {
    // ignore in browsers
  }
}

export function bindBackButton(onBack: () => void): () => void {
  try {
    const bridge = getBridge();
    if (bridge.BackButton) {
      bridge.BackButton.show();
      bridge.BackButton.onClick(onBack);
      return () => {
        try {
          bridge.BackButton.offClick(onBack);
          bridge.BackButton.hide();
        } catch {
          // ignore
        }
      };
    }
  } catch {
    // ignore in browsers
  }
  return () => {};
}

export function hideBackButton(): void {
  try {
    getBridge().BackButton?.hide();
  } catch {
    // ignore in browsers
  }
}

export function openExternalUrl(url: string): void {
  try {
    getBridge().openLink(url);
  } catch {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
