// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

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
  MapPin: () => <span data-testid="map-pin-icon">MapPin</span>,
  Briefcase: () => <span data-testid="briefcase-icon">Briefcase</span>,
  Users: () => <span data-testid="users-icon">Users</span>,
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  MoreVertical: () => <span data-testid="more-vertical-icon">MoreVertical</span>,
  TrendingUp: () => <span data-testid="trending-up-icon">TrendingUp</span>,
  Clock: () => <span data-testid="clock-icon">Clock</span>,
  CheckCircle: () => <span data-testid="check-circle-icon">CheckCircle</span>,
  XCircle: () => <span data-testid="x-circle-icon">XCircle</span>,
  AlertCircle: () => <span data-testid="alert-circle-icon">AlertCircle</span>,
  Menu: () => <span data-testid="menu-icon">Menu</span>,
  X: () => <span data-testid="x-icon">X</span>,
  Home: () => <span data-testid="home-icon">Home</span>,
  Building: () => <span data-testid="building-icon">Building</span>,
  DollarSign: () => <span data-testid="dollar-sign-icon">DollarSign</span>,
  BarChart: () => <span data-testid="bar-chart-icon">BarChart</span>,
  Settings: () => <span data-testid="settings-icon">Settings</span>,
  LogOut: () => <span data-testid="log-out-icon">LogOut</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
}));

// Mock zustand store
jest.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    user: { id: '1', email: 'test@example.com', name: 'Test User' },
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

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
