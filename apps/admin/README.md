# JobPilot Admin Dashboard

Administrative dashboard for managing the JobPilot AI Platform.

## Features

- **Dashboard Overview**: Real-time statistics and service health monitoring
- **User Management**: View, search, filter, and manage user accounts
- **Service Monitoring**: Track health, performance, and uptime of all platform services
- **Analytics**: Platform usage and performance metrics
- **Feature Flags**: Manage feature rollouts and A/B testing
- **Settings**: Configure platform-wide settings and preferences

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Query
- **Form Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Update environment variables in `.env.local`

### Development

Run the development server:

```bash
npm run dev
```

The admin dashboard will be available at [http://localhost:3001](http://localhost:3001)

### Build

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

## Project Structure

```
apps/admin/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Dashboard home
│   │   ├── users/             # User management
│   │   ├── services/          # Service monitoring
│   │   ├── analytics/         # Analytics dashboard
│   │   ├── feature-flags/     # Feature flag management
│   │   ├── settings/          # Settings
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── layout/            # Layout components
│   │   │   ├── Sidebar.tsx   # Navigation sidebar
│   │   │   └── Header.tsx    # Top header
│   │   └── ui/                # Reusable UI components
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript types
├── public/                    # Static assets
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## Features Implemented

### Dashboard (/)
- Quick stats cards (Users, Jobs, Applications, Revenue)
- Service health overview with real-time status
- Recent activity feed
- System alerts and notifications

### Users (/users)
- User list with pagination
- Search functionality
- Status and role filtering
- Quick actions (view, edit, suspend)
- User statistics

### Services (/services)
- Service health cards for all 10 platform services
- Status indicators (healthy, degraded, down)
- Uptime percentages
- Response time and error rate monitoring
- Performance charts
- Resource usage (CPU, Memory, Instances)

## Navigation

The sidebar includes navigation to:
- Dashboard
- Users
- Services
- Analytics
- Feature Flags
- Audit Logs
- Notifications
- Database
- Security
- Settings

## Theming

The admin dashboard uses a dark theme by default with:
- Dark gray backgrounds
- Blue/purple accent colors
- High contrast for readability
- Responsive design for all screen sizes

## API Integration

To integrate with backend services:

1. Update service URLs in `.env.local`
2. Create API client in `src/lib/api.ts`
3. Use React Query for data fetching
4. Add proper error handling and loading states

## Authentication

Authentication should be implemented using NextAuth.js:

1. Configure providers in `src/app/api/auth/[...nextauth]/route.ts`
2. Add middleware for protected routes
3. Implement role-based access control (RBAC)

## Deployment

The admin dashboard can be deployed to:
- Vercel (recommended for Next.js)
- Docker (using provided Dockerfile)
- Kubernetes (with deployment manifests)

## Security

- All routes should be protected with authentication
- Implement role-based access control
- Use HTTPS in production
- Validate all user inputs
- Implement rate limiting
- Enable CSRF protection
- Add security headers (configured in next.config.js)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - JobPilot AI Platform
