import { ResumeTemplate, DEFAULT_CUSTOMIZATION } from '@/types/template';

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'professional-classic',
    name: 'Professional Classic',
    description: 'A timeless, ATS-friendly template perfect for corporate roles and traditional industries.',
    category: 'professional',
    thumbnail: '/templates/professional-classic.png',
    isPremium: false,
    tags: ['ATS-friendly', 'Corporate', 'Traditional', 'Clean'],
    popularityScore: 95,
    defaultCustomization: {
      ...DEFAULT_CUSTOMIZATION,
      colorScheme: 'classic-blue',
      fontFamily: 'inter',
      layout: 'single-column',
      headerStyle: 'centered',
    },
  },
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Clean and contemporary design with focus on content and white space.',
    category: 'modern',
    thumbnail: '/templates/modern-minimalist.png',
    isPremium: false,
    tags: ['Minimalist', 'Modern', 'Clean', 'Tech'],
    popularityScore: 90,
    defaultCustomization: {
      ...DEFAULT_CUSTOMIZATION,
      colorScheme: 'professional-gray',
      fontFamily: 'lato',
      layout: 'single-column',
      headerStyle: 'left',
      showIcons: false,
    },
  },
  {
    id: 'creative-designer',
    name: 'Creative Designer',
    description: 'Stand out with a bold, creative layout perfect for design and creative roles.',
    category: 'creative',
    thumbnail: '/templates/creative-designer.png',
    isPremium: false,
    tags: ['Creative', 'Design', 'Bold', 'Portfolio'],
    popularityScore: 85,
    defaultCustomization: {
      ...DEFAULT_CUSTOMIZATION,
      colorScheme: 'creative-purple',
      fontFamily: 'nunito',
      layout: 'two-column-left',
      headerStyle: 'two-column',
      showPhoto: true,
      showProgressBars: true,
    },
  },
  {
    id: 'executive-professional',
    name: 'Executive Professional',
    description: 'Sophisticated design for senior-level positions and executive roles.',
    category: 'professional',
    thumbnail: '/templates/executive-professional.png',
    isPremium: false,
    tags: ['Executive', 'Senior', 'Elegant', 'Leadership'],
    popularityScore: 88,
    defaultCustomization: {
      ...DEFAULT_CUSTOMIZATION,
      colorScheme: 'elegant-black',
      fontFamily: 'merriweather',
      layout: 'two-column-right',
      headerStyle: 'centered',
      fontSize: 13,
    },
  },
  {
    id: 'tech-developer',
    name: 'Tech Developer',
    description: 'Optimized for software engineers and tech professionals with emphasis on skills.',
    category: 'modern',
    thumbnail: '/templates/tech-developer.png',
    isPremium: false,
    tags: ['Tech', 'Developer', 'Software', 'Skills-focused'],
    popularityScore: 92,
    defaultCustomization: {
      ...DEFAULT_CUSTOMIZATION,
      colorScheme: 'modern-teal',
      fontFamily: 'source-sans',
      layout: 'two-column-left',
      headerStyle: 'left',
      showIcons: true,
    },
  },
  {
    id: 'simple-elegant',
    name: 'Simple & Elegant',
    description: 'Straightforward and professional with excellent readability.',
    category: 'simple',
    thumbnail: '/templates/simple-elegant.png',
    isPremium: false,
    tags: ['Simple', 'Elegant', 'Readable', 'Universal'],
    popularityScore: 87,
    defaultCustomization: {
      ...DEFAULT_CUSTOMIZATION,
      colorScheme: 'professional-gray',
      fontFamily: 'open-sans',
      layout: 'single-column',
      headerStyle: 'left',
      showIcons: false,
      fontSize: 13,
    },
  },
];

export const getTemplatesByCategory = (category: string) => {
  if (category === 'all') return RESUME_TEMPLATES;
  return RESUME_TEMPLATES.filter((template) => template.category === category);
};

export const getTemplateById = (id: string) => {
  return RESUME_TEMPLATES.find((template) => template.id === id);
};

export const searchTemplates = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return RESUME_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
  );
};

export const getSortedTemplates = (sortBy: 'popular' | 'name' | 'recent') => {
  const templates = [...RESUME_TEMPLATES];

  switch (sortBy) {
    case 'popular':
      return templates.sort((a, b) => b.popularityScore - a.popularityScore);
    case 'name':
      return templates.sort((a, b) => a.name.localeCompare(b.name));
    case 'recent':
      return templates; // In real app, would sort by date added
    default:
      return templates;
  }
};
