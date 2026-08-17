import { VideoTemplate } from '../types';

// Default layout coordinates according to specifications
const DEFAULT_LAYOUT = {
  videoWidth: 1080,
  videoHeight: 1920,
  photoX: 131.1,
  photoY: 551.1,
  photoWidth: 817.7,
  photoHeight: 817.7,
  nameX: 108,
  nameY: 1333.9,
  nameWidth: 922.8,
  nameHeight: 313.9,
};

export const TEMPLATES: VideoTemplate[] = [
  {
    id: 'template-1',
    name: 'Template 1 - Royal Gold Rakhi',
    badge: 'Popular',
    videoPath: '/videos/templates/template-1.mp4',
    textColor: '#FFFFFF',
    accentColor: '#FFC107',
    ...DEFAULT_LAYOUT
  },
  {
    id: 'template-2',
    name: 'Template 2 - Saffron Festive Glow',
    badge: 'Trending',
    videoPath: '/videos/templates/template-2.mp4',
    textColor: '#FFFFFF',
    accentColor: '#FF6F00',
    ...DEFAULT_LAYOUT
  },
  {
    id: 'template-3',
    name: 'Template 3 - Silk Red Celebration',
    badge: 'Classic',
    videoPath: '/videos/templates/template-3.mp4',
    textColor: '#FFFFFF',
    accentColor: '#C2185B',
    ...DEFAULT_LAYOUT
  },
  {
    id: 'template-4',
    name: 'Template 4 - Emerald Heritage Gold',
    badge: 'Royal',
    videoPath: '/videos/templates/template-4.mp4',
    textColor: '#FFFFFF',
    accentColor: '#388E3C',
    ...DEFAULT_LAYOUT
  },
  {
    id: 'template-5',
    name: 'Template 5 - Radiant Sunburst',
    badge: 'Warm Glow',
    videoPath: '/videos/templates/template-5.mp4',
    textColor: '#FFFFFF',
    accentColor: '#FF6D00',
    ...DEFAULT_LAYOUT
  },
  {
    id: 'template-6',
    name: 'Template 6 - Royal Purple Sparkle',
    badge: 'Premium',
    videoPath: '/videos/templates/template-6.mp4',
    textColor: '#FFFFFF',
    accentColor: '#AA00FF',
    ...DEFAULT_LAYOUT
  },
  {
    id: 'template-7',
    name: 'Template 7 - Peacock Blue Bliss',
    badge: 'Elegant',
    videoPath: '/videos/templates/template-7.mp4',
    textColor: '#FFFFFF',
    accentColor: '#00B0FF',
    ...DEFAULT_LAYOUT
  },
  {
    id: 'template-8',
    name: 'Template 8 - Ruby Mandala Light',
    badge: 'Traditional',
    videoPath: '/videos/templates/template-8.mp4',
    textColor: '#FFFFFF',
    accentColor: '#D50000',
    ...DEFAULT_LAYOUT
  },
  {
    id: 'template-9',
    name: 'Template 9 - Marigold Yellow Joy',
    badge: 'Festive',
    videoPath: '/videos/templates/template-9.mp4',
    textColor: '#FFFFFF',
    accentColor: '#FFD600',
    ...DEFAULT_LAYOUT
  },
  {
    id: 'template-10',
    name: 'Template 10 - Midnight Celebration',
    badge: 'Special',
    videoPath: '/videos/templates/template-10.mp4',
    textColor: '#FFFFFF',
    accentColor: '#2979FF',
    ...DEFAULT_LAYOUT
  },
  {
    id: 'template-11',
    name: 'Template 11 - Rose Gold Harmony',
    badge: 'Sweet',
    videoPath: '/videos/templates/template-11.mp4',
    textColor: '#FFFFFF',
    accentColor: '#F50057',
    ...DEFAULT_LAYOUT
  },
  {
    id: 'template-12',
    name: 'Template 12 - Divine Saffron Blessings',
    badge: 'Holy Blessings',
    videoPath: '/videos/templates/template-12.mp4',
    textColor: '#FFFFFF',
    accentColor: '#FF3D00',
    ...DEFAULT_LAYOUT
  },
  {
    id: 'template-13',
    name: 'Template 13 - Modern Festive Beats',
    badge: 'Modern',
    videoPath: '/videos/templates/template-13.mp4',
    textColor: '#FFFFFF',
    accentColor: '#D500F9',
    ...DEFAULT_LAYOUT
  }
];

export const DEFAULT_SAMPLE_PHOTO = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
