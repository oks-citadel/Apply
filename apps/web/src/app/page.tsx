'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Shield,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Lock,
  Award,
  PlayCircle,
  FileText,
  Target,
  Briefcase,
  Bot,
  ChevronDown,
  Star,
  MousePointer,
  Cpu,
  Eye,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

/* ============================================
   APPLYFORUS FUTURISTIC LANDING PAGE
   Deep Black + Neon Yellow + Electric Green
   Enterprise-grade, WCAG 2.2 AA Compliant
   ============================================ */

export default function Home() {
  return (
    <div className="min-h-screen bg-deepBlack text-white">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section with AI Avatar */}
      <HeroSection />

      {/* Trust Signals Bar */}
      <TrustBar />

      {/* Value Proposition */}
      <ValuePropositionSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Features */}
      <FeaturesSection />

      {/* AI Avatar Section */}
      <AIAvatarSection />

      {/* Trust & Security */}
      <TrustSecuritySection />

      {/* Success Metrics */}
      <SuccessMetricsSection />

      {/* Pricing Preview */}
      <PricingPreviewSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Final CTA */}
      <FinalCTASection />

      {/* Footer with Legal Links */}
      <Footer />
    </div>
  );
}

// Navigation Component
function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-deepBlack/95 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neonYellow to-electricGreen flex items-center justify-center shadow-glow-yellow group-hover:shadow-glow-yellow-lg transition-shadow">
              <Bot className="w-6 h-6 text-deepBlack" />
            </div>
            <span className="text-xl font-bold text-white">
              Apply<span className="text-neonYellow">ForUs</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-gray-400 hover:text-neonYellow transition-colors">
              How It Works
            </a>
            <a href="#features" className="text-gray-400 hover:text-neonYellow transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-400 hover:text-neonYellow transition-colors">
              Pricing
            </a>
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register">
              <Button className="bg-neonYellow hover:bg-neonYellow-400 text-deepBlack font-semibold px-6 shadow-glow-yellow hover:shadow-glow-yellow-lg transition-all">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-white" aria-label="Open menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

// Hero Section Component
function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-deepBlack"
      aria-labelledby="hero-heading"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-30" />

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neonYellow/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electricGreen/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Scan Line Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neonYellow/5 to-transparent h-1 animate-scan-line" />
      </div>

      <div className="container mx-auto px-4 py-24 pt-32 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 mb-8 rounded-full bg-softBlack border border-neonYellow/30 text-neonYellow text-sm font-medium animate-fade-in">
            <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
            <span>AI-Powered Auto-Apply Platform</span>
            <span className="ml-2 px-2 py-0.5 bg-electricGreen/20 text-electricGreen rounded-full text-xs">New</span>
          </div>

          {/* Main Heading */}
          <h1
            id="hero-heading"
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6 leading-tight animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            Land Your Dream Job
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neonYellow via-electricGreen to-neonYellow animate-gradient-shift bg-[size:200%_auto]">
              While You Sleep
            </span>
          </h1>

          {/* Value Proposition - Clear within 5 seconds */}
          <div className="max-w-3xl mx-auto mb-10 space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <p className="text-xl sm:text-2xl text-gray-300 font-medium">
              ApplyForUs automatically applies to jobs on your behalf, <span className="text-neonYellow">24/7</span>
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-base text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0" aria-hidden="true" />
                <span>For job seekers globally</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0" aria-hidden="true" />
                <span>10x faster than manual</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0" aria-hidden="true" />
                <span>AI-optimized applications</span>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-neonYellow to-electricGreen hover:from-neonYellow-400 hover:to-electricGreen-400 text-deepBlack font-bold text-lg px-10 py-7 h-auto shadow-glow-yellow hover:shadow-glow-yellow-lg transition-all duration-300 animate-glow-pulse"
                aria-label="Start auto-applying to jobs for free"
              >
                Start Auto-Applying
                <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-lg px-10 py-7 h-auto border-2 border-gray-700 text-white hover:border-neonYellow hover:text-neonYellow bg-transparent hover:bg-neonYellow/5 transition-all duration-300"
              onClick={() => {
                const element = document.getElementById('how-it-works');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              aria-label="Learn how ApplyForUs works"
            >
              <PlayCircle className="mr-2 w-5 h-5" aria-hidden="true" />
              See How It Works
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-deepBlack flex items-center justify-center text-xs font-bold text-gray-400"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full bg-electricGreen/20 border-2 border-deepBlack flex items-center justify-center text-xs font-bold text-electricGreen">
                +50K
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Join <span className="text-neonYellow font-semibold">50,000+</span> job seekers who have automated their job search
            </p>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>
    </section>
  );
}

// Trust Bar Component
function TrustBar() {
  return (
    <section
      className="border-y border-white/10 bg-softBlack/50 py-6"
      aria-label="Trust indicators"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 text-sm text-gray-400">
          <div className="flex items-center gap-2 group">
            <Shield className="w-5 h-5 text-neonYellow group-hover:text-neonYellow-400 transition-colors" aria-hidden="true" />
            <span className="group-hover:text-white transition-colors">Bank-Level Security</span>
          </div>
          <div className="flex items-center gap-2 group">
            <Lock className="w-5 h-5 text-electricGreen group-hover:text-electricGreen-400 transition-colors" aria-hidden="true" />
            <span className="group-hover:text-white transition-colors">GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2 group">
            <Globe className="w-5 h-5 text-neonYellow group-hover:text-neonYellow-400 transition-colors" aria-hidden="true" />
            <span className="group-hover:text-white transition-colors">150+ Countries</span>
          </div>
          <div className="flex items-center gap-2 group">
            <Award className="w-5 h-5 text-electricGreen group-hover:text-electricGreen-400 transition-colors" aria-hidden="true" />
            <span className="group-hover:text-white transition-colors">SOC 2 Certified</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Value Proposition Section
function ValuePropositionSection() {
  return (
    <section className="py-24 bg-deepBlack relative" aria-labelledby="value-prop-heading">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-glow-yellow opacity-30 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-neonYellow/10 text-neonYellow border-neonYellow/30">
            Why Choose Us
          </Badge>
          <h2 id="value-prop-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Why Choose <span className="text-neonYellow">ApplyForUs</span>?
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Stop wasting hours on repetitive job applications. Let AI work for you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <ValueCard
            icon={<Clock className="w-10 h-10" />}
            title="Save 95% of Your Time"
            description="Apply to hundreds of jobs in the time it takes to submit one manual application. Our AI handles everything."
            metric="10+ hours saved/week"
            color="yellow"
          />
          <ValueCard
            icon={<Target className="w-10 h-10" />}
            title="Higher Success Rate"
            description="AI-optimized applications that pass ATS systems and highlight your relevant skills for each job."
            metric="3x more interviews"
            color="green"
          />
          <ValueCard
            icon={<Globe className="w-10 h-10" />}
            title="Global Opportunities"
            description="Access job markets worldwide with multi-currency and multi-locale support across 150+ countries."
            metric="1M+ jobs available"
            color="yellow"
          />
        </div>
      </div>
    </section>
  );
}

function ValueCard({ icon, title, description, metric, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  metric: string;
  color: 'yellow' | 'green';
}) {
  const colorClasses = {
    yellow: {
      icon: 'bg-neonYellow/10 text-neonYellow border-neonYellow/30',
      badge: 'bg-neonYellow/10 text-neonYellow border-neonYellow/30',
      hover: 'hover:border-neonYellow/50 hover:shadow-glow-yellow',
    },
    green: {
      icon: 'bg-electricGreen/10 text-electricGreen border-electricGreen/30',
      badge: 'bg-electricGreen/10 text-electricGreen border-electricGreen/30',
      hover: 'hover:border-electricGreen/50 hover:shadow-glow-green',
    },
  };

  return (
    <Card className={`p-8 bg-softBlack border border-white/10 ${colorClasses[color].hover} transition-all duration-300 group`}>
      <CardContent className="p-0 text-center">
        <div className={`w-20 h-20 mx-auto rounded-2xl ${colorClasses[color].icon} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
        <p className="text-gray-400 mb-6 leading-relaxed">{description}</p>
        <Badge className={`${colorClasses[color].badge} border`}>
          {metric}
        </Badge>
      </CardContent>
    </Card>
  );
}

// How It Works Section
function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-24 bg-softBlack/30 relative"
      aria-labelledby="how-it-works-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-deepBlack via-softBlack/50 to-deepBlack pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-electricGreen/10 text-electricGreen border-electricGreen/30">
            Simple Process
          </Badge>
          <h2 id="how-it-works-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            How It <span className="text-electricGreen">Works</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Get started in minutes. Our AI takes care of the rest.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          <StepCard
            number={1}
            title="Upload Your Resume"
            description="Share your professional background, skills, and preferences. Our AI learns what makes you unique."
            icon={<FileText className="w-6 h-6" />}
          />
          <StepCard
            number={2}
            title="Set Your Preferences"
            description="Tell us your ideal job titles, locations, salary range, and industries. We'll only apply to relevant positions."
            icon={<Target className="w-6 h-6" />}
          />
          <StepCard
            number={3}
            title="Activate Auto-Apply"
            description="Sit back and relax. Our AI searches for jobs, customizes your applications, and submits them 24/7."
            icon={<Zap className="w-6 h-6" />}
          />
          <StepCard
            number={4}
            title="Track & Interview"
            description="Monitor all applications in your dashboard. Get notifications when employers respond and schedule interviews."
            icon={<TrendingUp className="w-6 h-6" />}
          />
        </div>
      </div>
    </section>
  );
}

function StepCard({ number, title, description, icon }: {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start bg-softBlack p-8 rounded-2xl border border-white/10 hover:border-neonYellow/30 transition-all duration-300 group">
      <div className="flex-shrink-0">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neonYellow to-electricGreen text-deepBlack flex items-center justify-center text-2xl font-bold shadow-glow-yellow group-hover:shadow-glow-yellow-lg transition-shadow">
            {number}
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-softBlack border border-white/20 text-neonYellow flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-neonYellow transition-colors">{title}</h3>
        <p className="text-lg text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// Features Section
function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-deepBlack relative" aria-labelledby="features-heading">
      <div className="absolute inset-0 bg-gradient-glow-green opacity-20 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-neonYellow/10 text-neonYellow border-neonYellow/30">
            Powerful Tools
          </Badge>
          <h2 id="features-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Powerful <span className="text-neonYellow">Features</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Everything you need to accelerate your job search
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <FeatureCard
            icon={<Sparkles className="w-7 h-7" />}
            title="AI Resume Optimization"
            description="Automatically tailor your resume to match each job description, highlighting relevant skills and experience."
          />
          <FeatureCard
            icon={<FileText className="w-7 h-7" />}
            title="Custom Cover Letters"
            description="Generate personalized cover letters that showcase your fit for each position."
          />
          <FeatureCard
            icon={<Zap className="w-7 h-7" />}
            title="Instant Applications"
            description="Apply to multiple jobs simultaneously with one-click submission across platforms."
          />
          <FeatureCard
            icon={<Shield className="w-7 h-7" />}
            title="Privacy Protected"
            description="Your data is encrypted and never shared without permission. Full GDPR compliance."
          />
          <FeatureCard
            icon={<TrendingUp className="w-7 h-7" />}
            title="Application Analytics"
            description="Track success rates, response times, and optimize your job search strategy with data."
          />
          <FeatureCard
            icon={<Briefcase className="w-7 h-7" />}
            title="Job Matching"
            description="Smart algorithms find the best opportunities based on your skills and career goals."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-softBlack hover:border-neonYellow/30 hover:bg-softBlack/80 transition-all duration-300 group">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neonYellow/20 to-electricGreen/20 text-neonYellow flex items-center justify-center mb-5 group-hover:from-neonYellow/30 group-hover:to-electricGreen/30 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-neonYellow transition-colors">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

// AI Avatar Section
function AIAvatarSection() {
  return (
    <section className="py-24 bg-softBlack/50 relative overflow-hidden" aria-labelledby="ai-avatar-heading">
      {/* Glowing Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-electricGreen/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Avatar Preview */}
          <div className="relative order-2 lg:order-1">
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Glow Ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neonYellow via-electricGreen to-neonYellow animate-gradient-shift opacity-20 blur-xl" />

              {/* Avatar Container */}
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-softBlack to-deepBlack border-2 border-white/20 flex items-center justify-center overflow-hidden">
                {/* Holographic Avatar Placeholder */}
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-neonYellow/20 to-electricGreen/20 flex items-center justify-center">
                    <Bot className="w-16 h-16 text-neonYellow" />
                  </div>
                  <p className="text-electricGreen text-sm font-mono">AI Assistant Ready</p>
                </div>

                {/* Scan Lines */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-electricGreen/5 to-transparent animate-scan-line pointer-events-none" />
              </div>

              {/* Status Indicators */}
              <div className="absolute -right-4 top-1/4 bg-softBlack border border-electricGreen/30 rounded-lg px-3 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-electricGreen animate-pulse" />
                <span className="text-xs text-electricGreen font-mono">Online</span>
              </div>

              <div className="absolute -left-4 bottom-1/4 bg-softBlack border border-neonYellow/30 rounded-lg px-3 py-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-neonYellow" />
                <span className="text-xs text-neonYellow font-mono">Ready to Help</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <Badge className="mb-4 bg-electricGreen/10 text-electricGreen border-electricGreen/30">
              <Bot className="w-4 h-4 mr-1" />
              AI Avatar Guide
            </Badge>
            <h2 id="ai-avatar-heading" className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Meet Your <span className="text-electricGreen">AI Guide</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Our AI-powered avatar guides you through every step of your job search journey. Get instant answers, personalized recommendations, and 24/7 support.
            </p>

            <div className="space-y-4 mb-8">
              <AvatarFeature
                icon={<Eye className="w-5 h-5" />}
                title="Welcome & Onboarding"
                description="Friendly introduction to the platform and its features"
              />
              <AvatarFeature
                icon={<FileText className="w-5 h-5" />}
                title="Resume Guidance"
                description="Step-by-step help with resume upload and optimization"
              />
              <AvatarFeature
                icon={<MessageCircle className="w-5 h-5" />}
                title="FAQ & Support"
                description="Instant answers to common questions about pricing, privacy, and more"
              />
              <AvatarFeature
                icon={<Cpu className="w-5 h-5" />}
                title="Smart Recommendations"
                description="Personalized job suggestions based on your profile"
              />
            </div>

            <Link href="/register">
              <Button className="bg-electricGreen hover:bg-electricGreen-400 text-deepBlack font-bold px-8 py-6 h-auto shadow-glow-green hover:shadow-glow-green-lg transition-all">
                <Bot className="mr-2 w-5 h-5" />
                Meet the AI Avatar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function AvatarFeature({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-softBlack/50 border border-white/5 hover:border-electricGreen/30 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-electricGreen/10 text-electricGreen flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
}

// Trust & Security Section
function TrustSecuritySection() {
  return (
    <section className="py-24 bg-deepBlack relative" aria-labelledby="trust-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-neonYellow/10 text-neonYellow border-neonYellow/30">
            Enterprise Security
          </Badge>
          <h2 id="trust-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Your Privacy & <span className="text-neonYellow">Security</span> Matter
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Industry-leading security standards to protect your personal information
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <SecurityBadge
            icon={<Shield className="w-10 h-10" />}
            title="256-bit Encryption"
            description="Bank-level security for all data"
          />
          <SecurityBadge
            icon={<Lock className="w-10 h-10" />}
            title="GDPR Compliant"
            description="Full EU data protection compliance"
          />
          <SecurityBadge
            icon={<Award className="w-10 h-10" />}
            title="SOC 2 Type II"
            description="Independently certified security"
          />
          <SecurityBadge
            icon={<CheckCircle2 className="w-10 h-10" />}
            title="Privacy First"
            description="You own and control your data"
          />
        </div>
      </div>
    </section>
  );
}

function SecurityBadge({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-8 bg-softBlack rounded-2xl border border-white/10 hover:border-neonYellow/30 hover:shadow-glow-yellow transition-all duration-300 group">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-neonYellow/10 text-neonYellow mb-4 group-hover:bg-neonYellow/20 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

// Success Metrics Section
function SuccessMetricsSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-deepBlack via-softBlack to-deepBlack relative overflow-hidden" aria-labelledby="metrics-heading">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neonYellow/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-electricGreen/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-electricGreen/10 text-electricGreen border-electricGreen/30">
            Proven Results
          </Badge>
          <h2 id="metrics-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Real <span className="text-electricGreen">Results</span>, Real People
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Our platform delivers measurable success for job seekers worldwide
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <MetricCard number="50,000+" label="Active Users" />
          <MetricCard number="2M+" label="Applications Sent" />
          <MetricCard number="85%" label="Success Rate" />
          <MetricCard number="150+" label="Countries" />
        </div>
      </div>
    </section>
  );
}

function MetricCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center p-8 bg-softBlack/80 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-neonYellow/30 transition-all group">
      <div className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neonYellow to-electricGreen mb-2">
        {number}
      </div>
      <div className="text-lg text-gray-400 group-hover:text-white transition-colors">{label}</div>
    </div>
  );
}

// Pricing Preview Section
function PricingPreviewSection() {
  return (
    <section id="pricing" className="py-24 bg-deepBlack relative" aria-labelledby="pricing-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-neonYellow/10 text-neonYellow border-neonYellow/30">
            Simple Pricing
          </Badge>
          <h2 id="pricing-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Start <span className="text-neonYellow">Free</span>, Scale as You Grow
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Flexible plans for every job seeker. No credit card required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="p-8 bg-softBlack rounded-2xl border border-white/10 hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-white mb-2">Free</h3>
            <p className="text-gray-400 mb-6">Perfect for getting started</p>
            <div className="text-4xl font-bold text-white mb-6">
              $0<span className="text-lg text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0" />
                <span>5 auto-applications/month</span>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0" />
                <span>Basic job matching</span>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0" />
                <span>1 resume upload</span>
              </li>
            </ul>
            <Link href="/register" className="block">
              <Button variant="outline" className="w-full border-white/20 text-white hover:border-white/40">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Pro Plan - Featured */}
          <div className="p-8 bg-gradient-to-b from-neonYellow/10 to-softBlack rounded-2xl border-2 border-neonYellow/50 hover:border-neonYellow transition-all relative shadow-glow-yellow">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-neonYellow text-deepBlack font-bold">Most Popular</Badge>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
            <p className="text-gray-400 mb-6">For serious job seekers</p>
            <div className="text-4xl font-bold text-neonYellow mb-6">
              $29<span className="text-lg text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0" />
                <span>100 auto-applications/month</span>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0" />
                <span>AI resume optimization</span>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0" />
                <span>Custom cover letters</span>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0" />
                <span>Priority support</span>
              </li>
            </ul>
            <Link href="/register" className="block">
              <Button className="w-full bg-neonYellow hover:bg-neonYellow-400 text-deepBlack font-bold">
                Start Free Trial
              </Button>
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="p-8 bg-softBlack rounded-2xl border border-white/10 hover:border-electricGreen/30 transition-all">
            <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
            <p className="text-gray-400 mb-6">For teams and agencies</p>
            <div className="text-4xl font-bold text-electricGreen mb-6">
              Custom
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0" />
                <span>Unlimited applications</span>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0" />
                <span>API access</span>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0" />
                <span>Dedicated support</span>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0" />
                <span>Custom integrations</span>
              </li>
            </ul>
            <Link href="/contact" className="block">
              <Button variant="outline" className="w-full border-electricGreen/50 text-electricGreen hover:bg-electricGreen/10">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  return (
    <section className="py-24 bg-softBlack/30" aria-labelledby="testimonials-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-electricGreen/10 text-electricGreen border-electricGreen/30">
            Success Stories
          </Badge>
          <h2 id="testimonials-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            What Our <span className="text-electricGreen">Users</span> Say
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Join thousands who have accelerated their career journey
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <TestimonialCard
            quote="ApplyForUs helped me land 3 interviews in my first week. The AI optimization is incredible!"
            author="Sarah Chen"
            role="Software Engineer"
            location="San Francisco, USA"
          />
          <TestimonialCard
            quote="I was spending 20+ hours per week applying to jobs. Now I spend 5 minutes setting preferences and the AI does the rest."
            author="Miguel Rodriguez"
            role="Marketing Manager"
            location="Barcelona, Spain"
          />
          <TestimonialCard
            quote="The global reach is amazing. I found opportunities in countries I hadn't even considered. Got my dream job in Berlin!"
            author="Aisha Patel"
            role="Product Designer"
            location="Mumbai, India"
          />
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ quote, author, role, location }: {
  quote: string;
  author: string;
  role: string;
  location: string;
}) {
  return (
    <Card className="p-8 bg-softBlack border border-white/10 hover:border-neonYellow/30 transition-all duration-300 group">
      <CardContent className="p-0">
        {/* Stars */}
        <div className="flex gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-5 h-5 fill-neonYellow text-neonYellow" />
          ))}
        </div>

        <p className="text-lg text-gray-300 mb-6 leading-relaxed italic">
          &quot;{quote}&quot;
        </p>

        <div className="border-t border-white/10 pt-6">
          <div className="font-bold text-white">{author}</div>
          <div className="text-sm text-gray-400">{role}</div>
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <Globe className="w-4 h-4 mr-1 text-electricGreen" aria-hidden="true" />
            {location}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Final CTA Section
function FinalCTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-deepBlack via-softBlack to-deepBlack relative overflow-hidden" aria-labelledby="cta-heading">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-neonYellow/10 via-electricGreen/5 to-transparent rounded-full" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 id="cta-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Ready to Transform Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neonYellow to-electricGreen">
              Job Search
            </span>?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join 50,000+ professionals who have automated their job applications and landed their dream roles faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-neonYellow to-electricGreen hover:from-neonYellow-400 hover:to-electricGreen-400 text-deepBlack font-bold text-lg px-10 py-7 h-auto shadow-glow-yellow hover:shadow-glow-yellow-lg transition-all duration-300"
                aria-label="Get started with ApplyForUs free"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            No credit card required • Free forever plan available
          </p>
        </div>
      </div>
    </section>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-deepBlack border-t border-white/10 py-16" role="contentinfo">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neonYellow to-electricGreen flex items-center justify-center">
                <Bot className="w-6 h-6 text-deepBlack" />
              </div>
              <span className="text-xl font-bold text-white">
                Apply<span className="text-neonYellow">ForUs</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-4 max-w-md">
              The world's most advanced AI-powered auto-apply platform. Land your dream job faster with intelligent automation.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Globe className="w-4 h-4 text-electricGreen" aria-hidden="true" />
              <span>Available in 150+ countries</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/features" className="text-gray-400 hover:text-neonYellow transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-neonYellow transition-colors">Pricing</Link></li>
              <li><Link href="/how-it-works" className="text-gray-400 hover:text-neonYellow transition-colors">How It Works</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-neonYellow transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-gray-400 hover:text-neonYellow transition-colors">About Us</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-neonYellow transition-colors">Blog</Link></li>
              <li><Link href="/careers" className="text-gray-400 hover:text-neonYellow transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-neonYellow transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal - Full Compliance Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="text-gray-400 hover:text-neonYellow transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-neonYellow transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="text-gray-400 hover:text-neonYellow transition-colors">Cookie Policy</Link></li>
              <li><Link href="/accessibility" className="text-gray-400 hover:text-neonYellow transition-colors">Accessibility</Link></li>
              <li><Link href="/do-not-sell" className="text-gray-400 hover:text-neonYellow transition-colors">Do Not Sell My Info</Link></li>
              <li><Link href="/ai-transparency" className="text-gray-400 hover:text-neonYellow transition-colors">AI Transparency</Link></li>
              <li><Link href="/modern-slavery" className="text-gray-400 hover:text-neonYellow transition-colors">Modern Slavery Statement</Link></li>
              <li><Link href="/washington-health-data" className="text-gray-400 hover:text-neonYellow transition-colors">WA Health Data Privacy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 text-center sm:text-left">
              &copy; {new Date().getFullYear()} ApplyForUs. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4 text-neonYellow" aria-hidden="true" />
                <span>SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Lock className="w-4 h-4 text-electricGreen" aria-hidden="true" />
                <span>GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
