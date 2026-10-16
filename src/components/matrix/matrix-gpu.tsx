import { Canvas, matchFont, Text as SkiaText, useFont } from '@shopify/react-native-skia';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Platform } from 'react-native';

import { CELL_H, CELL_W, cellColor, Column, FONT_SIZE, MIN_LEVEL } from './simulation';

// Bundled bold font used as a safety net if the system font cannot be matched.
const BOLD_FONT = require('@/assets/fonts/DejaVuSansMono-Bold.ttf');

// Real system family names. "System" is NOT a valid Android family and makes
// matchFont return an empty typeface (which draws nothing = black screen).
const SYSTEM_FAMILY = Platform.select({ ios: 'Helvetica', default: 'sans-serif' });

/**
 * GPU renderer: everything is drawn inside a single Skia canvas. Skia paints
 * the glyphs on the GPU, so we only create nodes for the characters that are
 * actually visible (no empty cells) instead of a full grid of native views.
 */
export function MatrixGpu({
  columns,
  width,
  height,
}: {
  columns: Column[];
  width: number;
  height: number;
}) {
  const fallbackFont = useFont(BOLD_FONT, FONT_SIZE);

  const font = useMemo(() => {
    try {
      // Prefer the system font: it is bold and, unlike the bundled DejaVu
      // font, it includes the katakana glyphs used by the rain.
      const systemFont = matchFont({
        fontFamily: SYSTEM_FAMILY,
        fontSize: FONT_SIZE,
        fontWeight: '900',
      });
      const hasGlyphs = systemFont.getGlyphIDs('アA1')[0] !== 0;
      return hasGlyphs ? systemFont : fallbackFont;
    } catch {
      return fallbackFont;
    }
  }, [fallbackFont]);

  // Nothing to draw until a usable font is available.
  if (!font) {
    return null;
  }

  // Flatten every visible character into a single array of Skia <Text> nodes.
  const nodes: ReactElement[] = [];
  for (let ci = 0; ci < columns.length; ci++) {
    const col = columns[ci];
    for (let ri = 0; ri < col.levels.length; ri++) {
      const level = col.levels[ri];
      if (level > MIN_LEVEL) {
        nodes.push(
          <SkiaText
            key={`${ci}-${ri}`}
            x={ci * CELL_W + CELL_W * 0.15}
            y={ri * CELL_H + CELL_H * 0.8}
            text={col.chars[ri]}
            font={font}
            color={cellColor(col.hue, ri, level)}
          />,
        );
      }
    }
  }

  return (
    <Canvas style={{ width, height }}>
      {nodes}
    </Canvas>
  );
}
