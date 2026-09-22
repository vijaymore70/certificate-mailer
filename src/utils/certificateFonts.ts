export interface CertificateFont {
  id: string;
  name: string;
  category: 'script' | 'serif' | 'sans' | 'mono' | 'marathi';
  ttfUrl: string;
  cssFamily: string;
}

export const CERTIFICATE_FONTS: CertificateFont[] = [
  // --- STYLISH MARATHI / DEVANAGARI FONTS (Google Input Support) ---
  {
    id: 'rozha_one',
    name: 'Rozha One (मराठी स्टाइल - कॉलोग्राफी)',
    category: 'marathi',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/rozha-one@latest/devanagari-400-normal.ttf',
    cssFamily: "'Rozha One', serif",
  },
  {
    id: 'yatra_one',
    name: 'Yatra One (मराठी आर्ट - क्लासिक)',
    category: 'marathi',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/yatra-one@latest/devanagari-400-normal.ttf',
    cssFamily: "'Yatra One', cursive",
  },
  {
    id: 'modak',
    name: 'Modak (मराठी ठळक - बोल्ड लुक)',
    category: 'marathi',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/modak@latest/devanagari-400-normal.ttf',
    cssFamily: "'Modak', cursive",
  },
  {
    id: 'tiro_marathi',
    name: 'Tiro Devanagari Marathi (पारंपारिक मराठी)',
    category: 'marathi',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/tiro-devanagari-marathi@latest/devanagari-400-normal.ttf',
    cssFamily: "'Tiro Devanagari Marathi', serif",
  },
  {
    id: 'baloo_2',
    name: 'Baloo 2 (मराठी मॉडर्न - स्टाइलिश)',
    category: 'marathi',
    ttfUrl: 'https://cdn.jsdelivr.net/fontsource/fonts/baloo-2@latest/devanagari-700-normal.ttf',
    cssFamily: "'Baloo 2', cursive",
  },

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
