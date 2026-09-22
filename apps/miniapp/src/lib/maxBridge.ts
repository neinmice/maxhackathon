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
    bridge.ready();
    bridge.expand();
  } catch (err) {
    console.warn('[MAX Bridge] Initialization notice:', err);
  }
}

export function getBridgeUser(): WebAppUser {
  const bridge = getBridge();
  return bridge.initDataUnsafe?.user || mockUser;
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

export function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  try {
    getBridge().HapticFeedback?.impactOccurred(style);
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
