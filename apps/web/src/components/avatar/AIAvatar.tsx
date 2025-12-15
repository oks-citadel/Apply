'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  Eye,
  EyeOff,
  MessageCircle,
  Bot,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

/* ============================================
   APPLYFORUS AI ANIMATED AVATAR SYSTEM

   Purpose:
   - Welcome users
   - Explain how Auto-Apply works
   - Guide onboarding and resume upload
   - Answer common questions
   - Reduce user anxiety and friction

   Design Requirements:
   - Gender-neutral
   - Globally inclusive
   - Semi-human/holographic
   - Yellow/Green/Black theme
   - Not cartoonish, not hyper-realistic

   Technology:
   - Three.js / React Three Fiber
   - Ready Player Me avatar (optional)
   - Mixamo animations (optional)
   - Azure TTS (optional voice)
   - Web Audio API (lip-sync)
   - Lazy-loaded for performance

   States:
   - idle, welcome, explaining, listening, error, hidden

   Controls:
   - Mute, Pause, Hide
   - Respects prefers-reduced-motion
   ============================================ */

// Avatar State Types
export type AvatarState = 'idle' | 'welcome' | 'explaining' | 'listening' | 'error' | 'hidden';

// Pre-approved Scripts (Safe content only - no legal/employment advice)
export const AVATAR_SCRIPTS = {
  welcome: {
    title: 'Welcome',
    text: "Welcome to ApplyForUs! I'm your AI assistant, here to help you land your dream job faster. Let me show you how our auto-apply system works.",
    duration: 8000,
  },
  howItWorks: {
    title: 'How It Works',
    text: "It's simple: upload your resume, set your job preferences, and activate auto-apply. Our AI will search for matching jobs and submit tailored applications on your behalf, 24/7.",
    duration: 12000,
  },
  resumeUpload: {
    title: 'Resume Upload',
    text: "Upload your resume in PDF, Word, or text format. Our AI will analyze your skills, experience, and qualifications to optimize your applications.",
    duration: 10000,
  },
  pricing: {
    title: 'Pricing',
    text: "We offer flexible plans including a free tier. You can start with 5 applications per month at no cost, then upgrade as you need more. No credit card required to start.",
    duration: 10000,
  },
  privacy: {
    title: 'Privacy & Security',
    text: "Your data is protected with bank-level encryption. We're GDPR compliant and SOC 2 certified. You control your data - we never share it without your permission.",
    duration: 10000,
  },
  support: {
    title: 'Getting Help',
    text: "Need help? Check our FAQ, contact our support team, or ask me questions anytime. We're here to make your job search successful.",
    duration: 8000,
  },
} as const;

export type ScriptKey = keyof typeof AVATAR_SCRIPTS;

// Avatar Context Provider
interface AvatarContextType {
  state: AvatarState;
  setState: (state: AvatarState) => void;
  isMuted: boolean;
  toggleMute: () => void;
  isPaused: boolean;
  togglePause: () => void;
  isVisible: boolean;
  toggleVisibility: () => void;
  currentScript: ScriptKey | null;
  playScript: (key: ScriptKey) => void;
  stopScript: () => void;
}

// Main AI Avatar Component
interface AIAvatarProps {
  initialState?: AvatarState;
  autoPlay?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  onStateChange?: (state: AvatarState) => void;
}

export function AIAvatar({
  initialState = 'idle',
  autoPlay = false,
  position = 'bottom-right',
  size = 'md',
  onStateChange,
}: AIAvatarProps) {
  const [state, setState] = useState<AvatarState>(initialState);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentScript, setCurrentScript] = useState<ScriptKey | null>(null);
  const [displayText, setDisplayText] = useState('');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const scriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // State change callback
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // Auto-play welcome on mount
  useEffect(() => {
    if (autoPlay && !prefersReducedMotion) {
      const timer = setTimeout(() => {
        playScript('welcome');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, prefersReducedMotion]);

  // Play a pre-approved script
  const playScript = useCallback((key: ScriptKey) => {
    const script = AVATAR_SCRIPTS[key];
    if (!script) return;

    // Clear any existing timers
    if (scriptTimeoutRef.current) clearTimeout(scriptTimeoutRef.current);
    if (textIntervalRef.current) clearInterval(textIntervalRef.current);

    setCurrentScript(key);
    setState('explaining');
    setDisplayText('');

    // Typewriter effect for text
    let charIndex = 0;
    const fullText = script.text;

    if (!prefersReducedMotion) {
      textIntervalRef.current = setInterval(() => {
        if (charIndex < fullText.length) {
          setDisplayText(fullText.substring(0, charIndex + 1));
          charIndex++;
        } else {
          if (textIntervalRef.current) clearInterval(textIntervalRef.current);
        }
      }, 30);
    } else {
      setDisplayText(fullText);
    }

    // Auto-complete after duration
    scriptTimeoutRef.current = setTimeout(() => {
      setState('idle');
      setCurrentScript(null);
    }, script.duration);
  }, [prefersReducedMotion]);

  // Stop current script
  const stopScript = useCallback(() => {
    if (scriptTimeoutRef.current) clearTimeout(scriptTimeoutRef.current);
    if (textIntervalRef.current) clearInterval(textIntervalRef.current);
    setState('idle');
    setCurrentScript(null);
    setDisplayText('');
  }, []);

  // Toggle functions
  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
    if (!isPaused) {
      setState('idle');
    }
  }, [isPaused]);
  const toggleVisibility = useCallback(() => setIsVisible(prev => !prev), []);

  // Size classes
  const sizeClasses = {
    sm: 'w-64 h-80',
    md: 'w-80 h-96',
    lg: 'w-96 h-[28rem]',
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'inline': 'relative',
  };

  if (!isVisible && position !== 'inline') {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className={`${position === 'bottom-right' ? 'fixed bottom-4 right-4' : 'fixed bottom-4 left-4'} z-50 w-14 h-14 rounded-full bg-gradient-to-br from-neonYellow to-electricGreen shadow-glow-yellow hover:shadow-glow-yellow-lg transition-all`}
        aria-label="Show AI Avatar"
      >
        <Bot className="w-6 h-6 text-deepBlack" />
      </Button>
    );
  }

  return (
    <div
      className={`${position !== 'inline' ? positionClasses[position] : ''} ${isMinimized ? 'h-16' : sizeClasses[size]}`}
      role="region"
      aria-label="AI Assistant"
      aria-live="polite"
    >
      <div className="relative h-full bg-gradient-to-b from-softBlack to-deepBlack rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-softBlack/95 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-electricGreen animate-pulse" />
            <span className="text-xs font-mono text-electricGreen">
              {state === 'idle' ? 'Ready' : state === 'explaining' ? 'Speaking' : state}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-gray-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-neonYellow" />
              )}
            </button>
            <button
              onClick={togglePause}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <Play className="w-4 h-4 text-gray-400" />
              ) : (
                <Pause className="w-4 h-4 text-electricGreen" />
              )}
            </button>
            <button
              onClick={() => setIsMinimized(prev => !prev)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {position !== 'inline' && (
              <button
                onClick={toggleVisibility}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Hide Avatar"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* 3D Avatar Canvas */}
            <div className="absolute inset-0 pt-12">
              <Suspense fallback={<AvatarFallback />}>
                <Canvas
                  camera={{ position: [0, 0, 2.5], fov: 50 }}
                  gl={{ antialias: true, alpha: true }}
                >
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[5, 5, 5]} intensity={1} color="#FACC15" />
                  <directionalLight position={[-5, 5, 5]} intensity={0.5} color="#22C55E" />

                  <HolographicAvatar
                    state={state}
                    isPaused={isPaused || prefersReducedMotion}
                  />

                  {!prefersReducedMotion && (
                    <OrbitControls
                      enableZoom={false}
                      enablePan={false}
                      maxPolarAngle={Math.PI / 2}
                      minPolarAngle={Math.PI / 2.5}
                    />
                  )}
                </Canvas>
              </Suspense>
            </div>

            {/* Text Display */}
            {currentScript && displayText && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-deepBlack via-deepBlack/95 to-transparent">
                <div className="text-xs font-mono text-neonYellow mb-1">
                  {AVATAR_SCRIPTS[currentScript].title}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {displayText}
                  {displayText.length < AVATAR_SCRIPTS[currentScript].text.length && (
                    <span className="inline-block w-1 h-4 ml-0.5 bg-neonYellow animate-pulse" />
                  )}
                </p>
              </div>
            )}

            {/* Quick Action Buttons */}
            {state === 'idle' && !currentScript && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {(['howItWorks', 'pricing', 'privacy'] as ScriptKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => playScript(key)}
                      className="px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-gray-300 hover:border-neonYellow/50 hover:text-neonYellow transition-all"
                    >
                      {AVATAR_SCRIPTS[key].title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Holographic Avatar 3D Component
function HolographicAvatar({
  state,
  isPaused,
}: {
  state: AvatarState;
  isPaused: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hue, setHue] = useState(0);

  // Animation loop
  useFrame((_, delta) => {
    if (isPaused || !meshRef.current) return;

    // Gentle floating animation
    meshRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.05;

    // Subtle rotation
    meshRef.current.rotation.y += delta * 0.2;

    // Glow pulsing
    if (glowRef.current) {
      const scale = 1 + Math.sin(Date.now() * 0.002) * 0.05;
      glowRef.current.scale.set(scale, scale, scale);
    }

    // Color shift for holographic effect
    setHue(prev => (prev + delta * 10) % 360);
  });

  // State-based scaling
  const scale = state === 'explaining' ? 1.05 : state === 'error' ? 0.95 : 1;

  return (
    <group>
      {/* Outer Glow Ring */}
      <mesh ref={glowRef} position={[0, 0, -0.5]}>
        <ringGeometry args={[0.8, 1.2, 64]} />
        <meshBasicMaterial
          color="#22C55E"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Main Avatar - Holographic Sphere/Figure */}
      <mesh ref={meshRef} scale={scale}>
        {/* Core */}
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#FACC15"
          emissive="#22C55E"
          emissiveIntensity={0.2}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Inner Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.02, 16, 100]} />
        <meshStandardMaterial
          color="#22C55E"
          emissive="#22C55E"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Outer Ring */}
      <mesh rotation={[Math.PI / 2.5, 0, Date.now() * 0.001]}>
        <torusGeometry args={[0.8, 0.01, 16, 100]} />
        <meshStandardMaterial
          color="#FACC15"
          emissive="#FACC15"
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Particle Field (simplified) */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 0.7 + Math.random() * 0.2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              (Math.random() - 0.5) * 0.5,
              Math.sin(angle) * radius,
            ]}
          >
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? '#FACC15' : '#22C55E'}
              transparent
              opacity={0.6}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Fallback component while 3D loads
function AvatarFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-neonYellow/20 to-electricGreen/20 flex items-center justify-center animate-pulse">
          <Bot className="w-10 h-10 text-neonYellow" />
        </div>
        <p className="text-sm text-gray-400">Loading AI Avatar...</p>
      </div>
    </div>
  );
}

// Compact Avatar Button (for triggering the full avatar)
export function AvatarTriggerButton({
  onClick,
  className = '',
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-14 h-14 rounded-full bg-gradient-to-br from-neonYellow to-electricGreen shadow-glow-yellow hover:shadow-glow-yellow-lg transition-all ${className}`}
      aria-label="Open AI Assistant"
    >
      <Bot className="w-7 h-7 text-deepBlack mx-auto" />
      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-electricGreen border-2 border-deepBlack flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
      </span>
    </button>
  );
}

// Export hook for external control
export function useAvatarControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentScript, setCurrentScript] = useState<ScriptKey | null>(null);

  const openAvatar = useCallback((script?: ScriptKey) => {
    setIsOpen(true);
    if (script) setCurrentScript(script);
  }, []);

  const closeAvatar = useCallback(() => {
    setIsOpen(false);
    setCurrentScript(null);
  }, []);

  return {
    isOpen,
    currentScript,
    openAvatar,
    closeAvatar,
    setCurrentScript,
  };
}

export default AIAvatar;
