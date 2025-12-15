/* ============================================
   APPLYFORUS AI AVATAR SYSTEM EXPORTS

   Usage:
   import { AIAvatarSimple, AvatarTriggerButton } from '@/components/avatar';

   Full 3D version (requires three.js):
   import { AIAvatar } from '@/components/avatar/AIAvatar';
   ============================================ */

// Default export - CSS/SVG version (no dependencies)
export { AIAvatarSimple as default, AIAvatarSimple, AvatarTriggerButton, AVATAR_SCRIPTS } from './AIAvatarSimple';
export type { AvatarState, ScriptKey } from './AIAvatarSimple';

// For Three.js version, import directly from AIAvatar.tsx
// Note: Requires installation of: three, @react-three/fiber, @react-three/drei
