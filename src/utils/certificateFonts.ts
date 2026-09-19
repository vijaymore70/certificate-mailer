export interface CertificateFont {
  id: string;
  name: string;
  category: 'script' | 'serif' | 'sans' | 'mono';
  ttfUrl: string;
  cssFamily: string;
}

export const CERTIFICATE_FONTS: CertificateFont[] = [
  // --- ELEGANT CALLIGRAPHY & SCRIPT (Best for Participant Names) ---
  {
    id: 'great_vibes',
    name: 'Great Vibes (Classic Calligraphy Script)',
    category: 'script',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/great-vibes@latest/latin-400-normal.ttf',
    cssFamily: "'Great Vibes', cursive",
  },
  {
    id: 'alex_brush',
    name: 'Alex Brush (Elegant Brush Script)',
    category: 'script',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/alex-brush@latest/latin-400-normal.ttf',
    cssFamily: "'Alex Brush', cursive",
  },
  {
    id: 'dancing_script',
    name: 'Dancing Script (Modern Calligraphy)',
    category: 'script',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/dancing-script@latest/latin-700-normal.ttf',
    cssFamily: "'Dancing Script', cursive",
  },
  {
    id: 'parisienne',
    name: 'Parisienne (Formal Cursive)',
    category: 'script',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/parisienne@latest/latin-400-normal.ttf',
    cssFamily: "'Parisienne', cursive",
  },
  {
    id: 'pinyon_script',
    name: 'Pinyon Script (Classic Swash Script)',
    category: 'script',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/pinyon-script@latest/latin-400-normal.ttf',
    cssFamily: "'Pinyon Script', cursive",
  },

  // --- FORMAL CLASSICAL SERIF ---
  {
    id: 'cinzel',
    name: 'Cinzel (Imperial Roman Serif)',
    category: 'serif',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/cinzel@latest/latin-700-normal.ttf',
    cssFamily: "'Cinzel', serif",
  },
  {
    id: 'playfair_display',
    name: 'Playfair Display (Luxury Serif)',
    category: 'serif',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-700-normal.ttf',
    cssFamily: "'Playfair Display', serif",
  },
  {
    id: 'cormorant',
    name: 'Cormorant Garamond (Traditional Serif)',
    category: 'serif',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-700-normal.ttf',
    cssFamily: "'Cormorant Garamond', serif",
  },
  {
    id: 'merriweather',
    name: 'Merriweather (Formal Serif)',
    category: 'serif',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/merriweather@latest/latin-700-normal.ttf',
    cssFamily: "'Merriweather', serif",
  },
  {
    id: 'times',
    name: 'Times New Roman (Standard Serif)',
    category: 'serif',
    ttfUrl: '',
    cssFamily: "'Times New Roman', Times, serif",
  },

  // --- MODERN CLEAN SANS-SERIF ---
  {
    id: 'montserrat',
    name: 'Montserrat (Geometric Modern)',
    category: 'sans',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-700-normal.ttf',
    cssFamily: "'Montserrat', sans-serif",
  },
  {
    id: 'outfit',
    name: 'Outfit (Corporate Modern)',
    category: 'sans',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-700-normal.ttf',
    cssFamily: "'Outfit', sans-serif",
  },
  {
    id: 'helvetica',
    name: 'Helvetica / Sans (Standard Clean)',
    category: 'sans',
    ttfUrl: '',
    cssFamily: 'Helvetica, Arial, sans-serif',
  },

  // --- CODE / MONOSPACE STAMP ---
  {
    id: 'courier',
    name: 'Courier (Monospace ID Stamp)',
    category: 'mono',
    ttfUrl: '',
    cssFamily: "'Courier New', Courier, monospace",
  },
];

export function getFontById(id: string): CertificateFont {
  return (
    CERTIFICATE_FONTS.find((f) => f.id === id) ||
    CERTIFICATE_FONTS.find((f) => f.id === 'great_vibes') ||
    CERTIFICATE_FONTS[0]
  );
}
