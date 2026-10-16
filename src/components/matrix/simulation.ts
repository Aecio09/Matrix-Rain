// ---------------------------------------------------------------------------
// Shared, renderer-agnostic Matrix simulation.
//
// The simulation is plain JavaScript and is used by BOTH the CPU and the GPU
// renderer. Keeping it shared means the only difference between the two
// versions is HOW the columns are drawn (native Text views vs. a Skia canvas),
// which makes the CPU vs GPU comparison meaningful.
// ---------------------------------------------------------------------------

export const FONT_SIZE = 22; // character size (bold)
export const CELL_H = 26; // vertical space per character
export const CELL_W = FONT_SIZE; // horizontal space per column
export const TICK_MS = 90; // how often the simulation advances
export const TRAIL = 16; // rows a character takes to fully fade
export const DECAY = 0.9; // brightness multiplier per tick
export const MIN_LEVEL = 0.05; // below this the cell is considered "off"

export type Column = {
  y: number; // current head position, in rows
  speed: number; // rows advanced per tick (random)
  hue: number; // base color of the column (random)
  chars: string[];
  levels: number[];
};

export const rand = (min: number, max: number) => min + Math.random() * (max - min);
export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

// Random character: mostly katakana, sometimes digits/letters.
export function randomChar(): string {
  if (Math.random() < 0.75) {
    return String.fromCharCode(randInt(0x30a0, 0x30ff)); // katakana
  }
  const pools: [number, number][] = [
    [0x0030, 0x0039], // 0-9
    [0x0041, 0x005a], // A-Z
    [0x0061, 0x007a], // a-z
  ];
  const [a, b] = pools[randInt(0, pools.length - 1)];
  return String.fromCharCode(randInt(a, b));
}

// Colorful color: random column hue + rainbow shift down the trail.
export function cellColor(hue: number, row: number, level: number): string {
  if (level > 0.92) return '#ffffff'; // bright leading character
  const h = (hue + row * 9) % 360;
  const l = Math.round(15 + level * 65); // fade from dark to bright
  return `hsl(${h}, 100%, ${l}%)`;
}

export function createColumns(cols: number, rows: number): Column[] {
  return Array.from({ length: cols }, () => ({
    y: -randInt(0, rows), // random phase
    speed: rand(0.25, 1.1), // random speed
    hue: randInt(0, 359), // random color
    chars: Array.from({ length: rows }, randomChar),
    levels: new Array<number>(rows).fill(0),
  }));
}

// Advance one column by a single tick and return a fresh copy.
export function advanceColumn(col: Column, rows: number): Column {
  const chars = col.chars.slice();
  const levels = col.levels.map((level) => (level > 0 ? level * DECAY : level));

  let y = col.y + col.speed;
  const row = Math.floor(y);

  if (row >= 0 && row < rows) {
    chars[row] = randomChar();
    levels[row] = 1;
  }

  let speed = col.speed;
  let hue = col.hue;

  // Recycle the column once its head leaves the screen.
  if (y - TRAIL > rows) {
    y = -randInt(0, 12);
    speed = rand(0.25, 1.1);
    hue = randInt(0, 359);
  }

  return { y, speed, hue, chars, levels };
}
