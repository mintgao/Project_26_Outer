
// Color definitions and utilities for outfit matching based on color wheel theory

export type ColorName = 
  | 'black' 
  | 'white' 
  | 'grey' 
  | 'beige' 
  | 'navy' 
  | 'blue' 
  | 'red' 
  | 'green' 
  | 'other';

interface ColorAttributes {
  isNeutral: boolean;
  hue?: number; // 0-360 degrees on color wheel
  saturation?: 'low' | 'medium' | 'high';
  brightness?: 'light' | 'medium' | 'dark';
}

// Map supported colors to their attributes
export const COLOR_MAP: Record<string, ColorAttributes> = {
  black: { isNeutral: true, brightness: 'dark' },
  white: { isNeutral: true, brightness: 'light' },
  grey: { isNeutral: true, brightness: 'medium' },
  beige: { isNeutral: true, brightness: 'light' }, // Often treated as neutral in fashion
  
  red: { isNeutral: false, hue: 0, saturation: 'high', brightness: 'medium' },
  green: { isNeutral: false, hue: 120, saturation: 'medium', brightness: 'medium' },
  blue: { isNeutral: false, hue: 240, saturation: 'medium', brightness: 'medium' },
  navy: { isNeutral: false, hue: 240, saturation: 'medium', brightness: 'dark' },
  
  other: { isNeutral: true } // Fallback
};

export type MatchType = 
  | 'Monochromatic'
  | 'Neutral Chic'
  | 'Balanced Neutral'
  | 'Analogous'
  | 'Complementary'
  | 'Triadic'
  | 'Clashing'
  | 'Unknown';

export interface MatchResult {
  score: number; // 0 to 100
  type: MatchType;
  description: string;
}

export const MATCH_STRATEGIES: { value: MatchType; label: string; description: string }[] = [
  { value: 'Monochromatic', label: 'Monochromatic', description: 'Different shades of the same color' },
  { value: 'Neutral Chic', label: 'Neutral Chic', description: 'Clean, minimalist all-neutral look' },
  { value: 'Balanced Neutral', label: 'Balanced Neutral', description: 'Pop of color with a neutral base' },
  { value: 'Analogous', label: 'Analogous', description: 'Harmonious, adjacent colors' },
  { value: 'Complementary', label: 'Complementary', description: 'High contrast, opposite colors' },
  { value: 'Triadic', label: 'Triadic', description: 'Vibrant, balanced triangle colors' },
];

export function getColorMatchScore(color1: string, color2: string): MatchResult {
  const c1 = COLOR_MAP[color1.toLowerCase()] || COLOR_MAP['other'];
  const c2 = COLOR_MAP[color2.toLowerCase()] || COLOR_MAP['other'];

  // 1. Neutral Matching (Highest safety)
  if (c1.isNeutral || c2.isNeutral) {
    // All neutrals match with everything
    if (c1.isNeutral && c2.isNeutral) {
      return { score: 90, type: 'Neutral Chic', description: 'Clean and minimalist neutral combination.' };
    }
    return { score: 85, type: 'Balanced Neutral', description: 'Color paired with a neutral for balance.' };
  }

  // If we don't have hue data (shouldn't happen for non-neutrals in our map, but safe guard)
  if (c1.hue === undefined || c2.hue === undefined) {
    return { score: 50, type: 'Unknown', description: 'Standard combination.' };
  }

  const hueDiff = Math.abs(c1.hue - c2.hue);
  const normalizedDiff = Math.min(hueDiff, 360 - hueDiff);

  // 2. Monochromatic (Same Hue)
  if (normalizedDiff < 15) {
    return { 
      score: 95, 
      type: 'Monochromatic', 
      description: 'Sophisticated look using shades of the same color.' 
    };
  }

  // 3. Analogous (Adjacent, ~30-60 degrees)
  if (normalizedDiff >= 30 && normalizedDiff <= 60) {
    return { 
      score: 80, 
      type: 'Analogous', 
      description: 'Harmonious colors that sit next to each other on the color wheel.' 
    };
  }

  // 4. Complementary (Opposite, ~180 degrees)
  if (normalizedDiff >= 160 && normalizedDiff <= 200) {
    return { 
      score: 85, 
      type: 'Complementary', 
      description: 'High contrast combination using opposite colors.' 
    };
  }

  // 5. Triadic (Triangle, ~120 degrees)
  if (normalizedDiff >= 100 && normalizedDiff <= 140) {
    return { 
      score: 75, 
      type: 'Triadic', 
      description: 'Vibrant and balanced triadic color scheme.' 
    };
  }

  // Default low score for clashing colors
  return { 
    score: 40, 
    type: 'Clashing', 
    description: 'These colors might not naturally harmonize, but fashion is subjective!' 
  };
}

export function getSuggestedColors(baseColor: string, targetStrategy: MatchType): string[] {
  const suggestions: string[] = [];
  
  // Iterate through all known colors to see which ones match the strategy
  for (const colorName of Object.keys(COLOR_MAP)) {
    // Skip 'other' as a suggestion unless it's the only option
    if (colorName === 'other') continue;
    
    const match = getColorMatchScore(baseColor, colorName);
    if (match.type === targetStrategy) {
      suggestions.push(colorName);
    }
  }
  
  return suggestions;
}
