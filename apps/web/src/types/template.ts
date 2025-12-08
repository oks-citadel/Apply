export type TemplateCategory = 'professional' | 'creative' | 'modern' | 'simple' | 'minimal' | 'bold';

export type TemplateLayout = 'single-column' | 'two-column-left' | 'two-column-right';

export type ColorScheme =
  | 'classic-blue'
  | 'professional-gray'
  | 'modern-teal'
  | 'creative-purple'
  | 'bold-red'
  | 'elegant-black'
  | 'fresh-green'
  | 'warm-orange';

export type FontFamily =
  | 'inter'
  | 'roboto'
  | 'open-sans'
  | 'lato'
  | 'merriweather'
  | 'playfair'
  | 'source-sans'
  | 'nunito';

export interface TemplateCustomization {
  colorScheme: ColorScheme;
  fontFamily: FontFamily;
  layout: TemplateLayout;
  fontSize: number; // 12-16
  lineHeight: number; // 1.4-1.8
  sectionSpacing: number; // 8-24
  showPhoto: boolean;
  showIcons: boolean;
  showProgressBars: boolean;
  headerStyle: 'centered' | 'left' | 'two-column';
  sectionOrder: string[];
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail: string;
  isPremium: boolean;
  tags: string[];
  defaultCustomization: TemplateCustomization;
  popularityScore: number;
}

export interface TemplatePreviewProps {
  template: ResumeTemplate;
  customization: TemplateCustomization;
  resumeData?: any;
  scale?: number;
  interactive?: boolean;
}

export const DEFAULT_CUSTOMIZATION: TemplateCustomization = {
  colorScheme: 'classic-blue',
  fontFamily: 'inter',
  layout: 'single-column',
  fontSize: 14,
  lineHeight: 1.5,
  sectionSpacing: 16,
  showPhoto: false,
  showIcons: true,
  showProgressBars: false,
  headerStyle: 'centered',
  sectionOrder: ['summary', 'experience', 'education', 'skills', 'certifications', 'projects'],
};

export const COLOR_SCHEMES: Record<ColorScheme, { primary: string; secondary: string; accent: string; text: string }> = {
  'classic-blue': {
    primary: '#2563eb',
    secondary: '#1e40af',
    accent: '#60a5fa',
    text: '#1e293b',
  },
  'professional-gray': {
    primary: '#475569',
    secondary: '#334155',
    accent: '#94a3b8',
    text: '#0f172a',
  },
  'modern-teal': {
    primary: '#0d9488',
    secondary: '#0f766e',
    accent: '#5eead4',
    text: '#134e4a',
  },
  'creative-purple': {
    primary: '#9333ea',
    secondary: '#7e22ce',
    accent: '#c084fc',
    text: '#581c87',
  },
  'bold-red': {
    primary: '#dc2626',
    secondary: '#b91c1c',
    accent: '#f87171',
    text: '#7f1d1d',
  },
  'elegant-black': {
    primary: '#1f2937',
    secondary: '#111827',
    accent: '#6b7280',
    text: '#030712',
  },
  'fresh-green': {
    primary: '#059669',
    secondary: '#047857',
    accent: '#34d399',
    text: '#064e3b',
  },
  'warm-orange': {
    primary: '#ea580c',
    secondary: '#c2410c',
    accent: '#fb923c',
    text: '#7c2d12',
  },
};

export const FONT_FAMILIES: Record<FontFamily, { name: string; cssClass: string; category: string }> = {
  'inter': {
    name: 'Inter',
    cssClass: 'font-inter',
    category: 'sans-serif',
  },
  'roboto': {
    name: 'Roboto',
    cssClass: 'font-roboto',
    category: 'sans-serif',
  },
  'open-sans': {
    name: 'Open Sans',
    cssClass: 'font-open-sans',
    category: 'sans-serif',
  },
  'lato': {
    name: 'Lato',
    cssClass: 'font-lato',
    category: 'sans-serif',
  },
  'merriweather': {
    name: 'Merriweather',
    cssClass: 'font-merriweather',
    category: 'serif',
  },
  'playfair': {
    name: 'Playfair Display',
    cssClass: 'font-playfair',
    category: 'serif',
  },
  'source-sans': {
    name: 'Source Sans Pro',
    cssClass: 'font-source-sans',
    category: 'sans-serif',
  },
  'nunito': {
    name: 'Nunito',
    cssClass: 'font-nunito',
    category: 'sans-serif',
  },
};
