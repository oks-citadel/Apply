// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for msw
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill TransformStream for Playwright-related imports
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = class TransformStream {
    constructor() {
      this.readable = {};
      this.writable = {};
    }
  };
}

// Polyfill ReadableStream if needed
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor() {}
    getReader() {
      return { read: async () => ({ done: true, value: undefined }) };
    }
  };
}

// Mock axios
const mockAxiosInstance = {
  post: jest.fn(() => Promise.resolve({ data: {} })),
  get: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  request: jest.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
  defaults: {
    headers: {
      common: {},
    },
  },
};

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(() => Promise.resolve({ data: {} })),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    request: jest.fn(() => Promise.resolve({ data: {} })),
    create: jest.fn(() => mockAxiosInstance),
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
  post: jest.fn(() => Promise.resolve({ data: {} })),
  get: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  request: jest.fn(() => Promise.resolve({ data: {} })),
  create: jest.fn(() => mockAxiosInstance),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  useParams() {
    return {};
  },
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader-icon">Loading...</div>,
  X: () => <div data-testid="x-icon">X</div>,
  AlertCircle: () => <div data-testid="alert-icon">Alert</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  Github: () => <div data-testid="github-icon">GitHub</div>,
  Linkedin: () => <div data-testid="linkedin-icon">LinkedIn</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  ChevronUp: () => <div data-testid="chevron-up-icon">ChevronUp</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Bell: () => <div data-testid="bell-icon">Bell</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  LogOut: () => <div data-testid="logout-icon">LogOut</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  MapPin: () => <div data-testid="mappin-icon">MapPin</div>,
  Building2: () => <div data-testid="building-icon">Building</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  Briefcase: () => <div data-testid="briefcase-icon">Briefcase</div>,
  DollarSign: () => <div data-testid="dollar-icon">Dollar</div>,
  ExternalLink: () => <div data-testid="external-link-icon">ExternalLink</div>,
  Heart: () => <div data-testid="heart-icon">Heart</div>,
  Share2: () => <div data-testid="share-icon">Share</div>,
  Flag: () => <div data-testid="flag-icon">Flag</div>,
  MoreHorizontal: () => <div data-testid="more-icon">More</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  EyeOff: () => <div data-testid="eye-off-icon">EyeOff</div>,
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Minus: () => <div data-testid="minus-icon">Minus</div>,
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
  File: () => <div data-testid="file-icon">File</div>,
  FileText: () => <div data-testid="file-text-icon">FileText</div>,
  Image: () => <div data-testid="image-icon">Image</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  Phone: () => <div data-testid="phone-icon">Phone</div>,
  Globe: () => <div data-testid="globe-icon">Globe</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  XCircle: () => <div data-testid="x-circle-icon">XCircle</div>,
  HelpCircle: () => <div data-testid="help-circle-icon">HelpCircle</div>,
  Copy: () => <div data-testid="copy-icon">Copy</div>,
  Bookmark: () => <div data-testid="bookmark-icon">Bookmark</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  ChevronLeft: () => <div data-testid="chevron-left-icon">ChevronLeft</div>,
  ChevronRight: () => <div data-testid="chevron-right-icon">ChevronRight</div>,
  BarChart: () => <div data-testid="bar-chart-icon">BarChart</div>,
  PieChart: () => <div data-testid="pie-chart-icon">PieChart</div>,
  LineChart: () => <div data-testid="line-chart-icon">LineChart</div>,
  Target: () => <div data-testid="target-icon">Target</div>,
  Award: () => <div data-testid="award-icon">Award</div>,
  RefreshCw: () => <div data-testid="refresh-icon">Refresh</div>,
}));

// Mock auth components to avoid undefined issues
jest.mock('@/components/auth/SocialLoginButtons', () => ({
  SocialLoginButtons: ({ isLoading }) => (
    <div data-testid="social-login-buttons">Social Login Buttons Mock</div>
  ),
}));

jest.mock('@/components/auth/MfaVerification', () => ({
  MfaVerification: ({ onVerify, onCancel, isLoading, error, email }) => (
    <div data-testid="mfa-verification">MFA Verification Mock</div>
  ),
}));

// Mock authStore
jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    verifyMfaLogin: jest.fn(),
    resetMfaState: jest.fn(),
  })),
}));

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};
