'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  X,
  ChevronUp,
  ChevronDown,
  Bot,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

/* ============================================
   APPLYFORUS AI AVATAR - CSS/SVG VERSION

   This is the fallback version that works without
   Three.js. It uses CSS animations and SVG for
   the holographic effect.

   For full 3D experience, install:
   - three
   - @react-three/fiber
   - @react-three/drei
   ============================================ */

// Avatar State Types
export type AvatarState = 'idle' | 'welcome' | 'explaining' | 'listening' | 'error' | 'hidden';

// Pre-approved Scripts (Safe content only)
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

interface AIAvatarSimpleProps {
  initialState?: AvatarState;
  autoPlay?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  onStateChange?: (state: AvatarState) => void;
}

export function AIAvatarSimple({
  initialState = 'idle',
  autoPlay = false,
  position = 'bottom-right',
  size = 'md',
  onStateChange,
}: AIAvatarSimpleProps) {
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

  // Auto-play welcome
  useEffect(() => {
    if (autoPlay && !prefersReducedMotion) {
      const timer = setTimeout(() => playScript('welcome'), 2000);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, prefersReducedMotion]);

  // Play script
  const playScript = useCallback((key: ScriptKey) => {
    const script = AVATAR_SCRIPTS[key];
    if (!script) return;

    if (scriptTimeoutRef.current) clearTimeout(scriptTimeoutRef.current);
    if (textIntervalRef.current) clearInterval(textIntervalRef.current);

    setCurrentScript(key);
    setState('explaining');
    setDisplayText('');

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

    scriptTimeoutRef.current = setTimeout(() => {
      setState('idle');
      setCurrentScript(null);
    }, script.duration);
  }, [prefersReducedMotion]);

  // Stop script
  const stopScript = useCallback(() => {
    if (scriptTimeoutRef.current) clearTimeout(scriptTimeoutRef.current);
    if (textIntervalRef.current) clearInterval(textIntervalRef.current);
    setState('idle');
    setCurrentScript(null);
    setDisplayText('');
  }, []);

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

  // Show trigger button when hidden
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
      className={`${position !== 'inline' ? positionClasses[position] : ''} ${isMinimized ? 'h-16' : sizeClasses[size]} transition-all duration-300`}
      role="region"
      aria-label="AI Assistant"
      aria-live="polite"
    >
      <div className="relative h-full bg-gradient-to-b from-softBlack to-deepBlack rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-softBlack/95 to-transparent">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${state === 'error' ? 'bg-red-500' : 'bg-electricGreen'} ${!isPaused && 'animate-pulse'}`} />
            <span className="text-xs font-mono text-electricGreen">
              {state === 'idle' ? 'Ready' : state === 'explaining' ? 'Speaking' : state}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted(prev => !prev)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-neonYellow" />}
            </button>
            <button
              onClick={() => setIsPaused(prev => !prev)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-4 h-4 text-gray-400" /> : <Pause className="w-4 h-4 text-electricGreen" />}
            </button>
            <button
              onClick={() => setIsMinimized(prev => !prev)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {position !== 'inline' && (
              <button
                onClick={() => setIsVisible(false)}
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
            {/* Animated Avatar Visual */}
            <div className="absolute inset-0 pt-16 pb-32 flex items-center justify-center">
              <HolographicAvatarCSS state={state} isPaused={isPaused || prefersReducedMotion} />
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

            {/* Quick Actions */}
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

// CSS/SVG Holographic Avatar
function HolographicAvatarCSS({
  state,
  isPaused,
}: {
  state: AvatarState;
  isPaused: boolean;
}) {
  const animationClass = isPaused ? '' : 'animate-float';
  const scaleClass = state === 'explaining' ? 'scale-110' : state === 'error' ? 'scale-90' : 'scale-100';

  return (
    <div className={`relative ${animationClass} transition-transform duration-500 ${scaleClass}`}>
      {/* Outer Glow */}
      <div className="absolute inset-0 -m-8 rounded-full bg-gradient-to-r from-neonYellow/20 via-electricGreen/20 to-neonYellow/20 blur-2xl animate-pulse" />

      {/* Rings */}
      <div className="absolute inset-0 -m-4">
        <svg viewBox="0 0 100 100" className={`w-full h-full ${!isPaused && 'animate-spin'}`} style={{ animationDuration: '20s' }}>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#ring-gradient)"
            strokeWidth="0.5"
            opacity="0.5"
          />
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FACC15" />
              <stop offset="50%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#FACC15" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Inner Ring */}
      <div className="absolute inset-0 -m-2">
        <svg viewBox="0 0 100 100" className={`w-full h-full ${!isPaused && 'animate-spin'}`} style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#22C55E"
            strokeWidth="1"
            opacity="0.3"
            strokeDasharray="5,5"
          />
        </svg>
      </div>

      {/* Core Avatar */}
      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-neonYellow/80 to-electricGreen/80 flex items-center justify-center shadow-glow-yellow">
        {/* Face Glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/20 to-transparent" />

        {/* Icon */}
        <Bot className="w-12 h-12 text-deepBlack relative z-10" />

        {/* Pulse Effect */}
        <div className={`absolute inset-0 rounded-full border-2 border-neonYellow ${!isPaused && 'animate-ping'}`} style={{ animationDuration: '2s' }} />
      </div>

      {/* Status Indicator */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 bg-deepBlack/80 rounded-full border border-electricGreen/30">
        <Sparkles className="w-3 h-3 text-neonYellow" />
        <span className="text-[10px] font-mono text-electricGreen">AI</span>
      </div>

      {/* Floating Particles */}
      {!isPaused && (
        <div className="absolute inset-0 -m-8 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                backgroundColor: i % 2 === 0 ? '#FACC15' : '#22C55E',
                top: `${20 + Math.random() * 60}%`,
                left: `${10 + Math.random() * 80}%`,
                animation: `float ${2 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Trigger Button
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

export default AIAvatarSimple;
