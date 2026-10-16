import { useEffect, useRef, useState } from 'react';

import { advanceColumn, Column, createColumns, TICK_MS } from './simulation';

/**
 * Runs the Matrix simulation on the JS (CPU) thread and returns the current
 * columns plus the measured tick rate (fps). Both renderers consume this hook,
 * so they share exactly the same animation logic.
 */
export function useMatrix(cols: number, rows: number): { columns: Column[]; fps: number } {
  const [columns, setColumns] = useState<Column[]>(() => createColumns(cols, rows));
  const [fps, setFps] = useState(0);
  const lastTick = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // Measure how fast the ticks are really happening: if rendering blocks
      // the JS thread, the interval fires late and the fps drops.
      const now = Date.now();
      if (lastTick.current > 0) {
        const dt = now - lastTick.current;
        if (dt > 0) setFps(Math.round(1000 / dt));
      }
      lastTick.current = now;

      setColumns((prev) =>
        prev.length !== cols || (prev[0]?.levels.length ?? 0) !== rows
          ? createColumns(cols, rows) // grid size changed -> rebuild
          : prev.map((col) => advanceColumn(col, rows)),
      );
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [cols, rows]);

  return { columns, fps };
}
