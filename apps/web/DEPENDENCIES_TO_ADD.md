# Dependencies to Add for Push Notifications

## Required Dependencies

Run this command to install all required dependencies:

```bash
npm install firebase@^10.7.1 framer-motion@^11.0.0
```

## Individual Packages

### firebase (^10.7.1)
**Purpose**: Firebase SDK for web, including Cloud Messaging
**Size**: ~300KB (gzipped)
**Usage**: FCM integration, token management, message handling

```bash
npm install firebase@^10.7.1
```

### framer-motion (^11.0.0)
**Purpose**: Animation library for React
**Size**: ~50KB (gzipped)
**Usage**: Toast notification animations, smooth transitions

```bash
npm install framer-motion@^11.0.0
```

## Updated package.json Dependencies Section

Add these to your `apps/web/package.json`:

```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.6.0",
    "@stripe/react-stripe-js": "^5.4.1",
    "@stripe/stripe-js": "^8.5.3",
    "@tanstack/react-query": "^5.45.1",
    "axios": "^1.7.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "firebase": "^10.7.1",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.395.0",
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.52.0",
    "recharts": "^3.5.1",
    "tailwind-merge": "^2.3.0",
    "zod": "^3.23.8",
    "zustand": "^4.5.2"
  }
}
```

## Installation Steps

1. Navigate to the web app directory:
   ```bash
   cd apps/web
   ```

2. Install the new dependencies:
   ```bash
   npm install firebase@^10.7.1 framer-motion@^11.0.0
   ```

3. Verify installation:
   ```bash
   npm list firebase framer-motion
   ```

Expected output:
```
@jobpilot/web@1.0.0
├── firebase@10.7.1
└── framer-motion@11.0.0
```

## Dependency Details

### Firebase
- **Package**: firebase
- **Version**: 10.7.1
- **License**: Apache-2.0
- **Repository**: https://github.com/firebase/firebase-js-sdk
- **Documentation**: https://firebase.google.com/docs/web/setup

**Features Used:**
- `firebase/app` - Core Firebase app
- `firebase/messaging` - Cloud Messaging

### Framer Motion
- **Package**: framer-motion
- **Version**: 11.0.0
- **License**: MIT
- **Repository**: https://github.com/framer/motion
- **Documentation**: https://www.framer.com/motion/

**Features Used:**
- Animation components
- AnimatePresence for exit animations
- Motion components for smooth transitions

## No Additional Dev Dependencies Required

All existing dev dependencies support the new notification features:
- TypeScript type checking
- ESLint for code quality
- Testing libraries (if needed for notification tests)

## Bundle Size Impact

| Package | Size (Minified) | Size (Gzipped) | Tree-shakeable |
|---------|----------------|----------------|----------------|
| firebase | ~900KB | ~300KB | Yes |
| framer-motion | ~150KB | ~50KB | Yes |
| **Total** | **~1050KB** | **~350KB** | **Yes** |

**Note**: Both packages are tree-shakeable, so you only bundle what you use.

## Peer Dependencies

Both packages are compatible with existing dependencies:
- React 18.3.1 ✅
- Next.js 14.2.5 ✅
- TypeScript 5.5.2 ✅

No peer dependency conflicts.

## Environment Compatibility

| Environment | Firebase | Framer Motion |
|-------------|----------|---------------|
| Node.js 18+ | ✅ | ✅ |
| Browsers | Modern browsers | Modern browsers |
| SSR | Supported | Supported |
| React 18 | ✅ | ✅ |

## Import Examples

After installation, you can import:

```typescript
// Firebase
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Framer Motion
import { motion, AnimatePresence } from 'framer-motion';
```

## Verification

After installation, create a test file to verify:

```typescript
// test-imports.ts
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
import { motion } from 'framer-motion';

console.log('Firebase:', initializeApp);
console.log('Messaging:', getMessaging);
console.log('Motion:', motion);
```

Run:
```bash
npx ts-node test-imports.ts
```

## Troubleshooting

### Firebase Installation Issues

If you encounter errors:

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Module Not Found

If you see "Module not found" errors:

1. Check TypeScript config includes `node_modules`
2. Restart your dev server
3. Clear Next.js cache: `rm -rf .next`

### Type Errors

If TypeScript can't find types:

```bash
# Types are included in firebase package
# No @types/firebase needed
npm list @types/firebase  # Should show: (empty)
```

## Alternative Installation

Using Yarn:
```bash
yarn add firebase@^10.7.1 framer-motion@^11.0.0
```

Using pnpm:
```bash
pnpm add firebase@^10.7.1 framer-motion@^11.0.0
```

## Post-Installation

After installing dependencies:

1. ✅ Restart development server
2. ✅ Clear Next.js build cache
3. ✅ Verify imports work
4. ✅ Continue with Firebase configuration

## Next Steps

1. Install dependencies
2. Configure Firebase (see `QUICK_START_NOTIFICATIONS.md`)
3. Set up environment variables
4. Update service worker
5. Integrate components

---

**Note**: These are the only new dependencies needed. All notification features use existing packages for UI, state management, and API calls.
