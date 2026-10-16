import { Component, ReactNode, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MatrixCpu } from './matrix-cpu';
import { MatrixGpu } from './matrix-gpu';
import { CELL_H, CELL_W } from './simulation';
import { useMatrix } from './use-matrix';

type MatrixMode = 'cpu' | 'gpu';

const GPU_AVAILABLE = Platform.OS !== 'web'; // Skia on web needs CanvasKit loading

// If the Skia canvas ever throws, fall back to the CPU renderer instead of
// leaving a black screen.
class GpuBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function MatrixRain() {
  const { width, height } = useWindowDimensions();
  const rows = Math.max(1, Math.ceil(height / CELL_H));
  const cols = Math.max(1, Math.ceil(width / CELL_W));

  const [mode, setMode] = useState<MatrixMode>('cpu');
  const [gpuFailed, setGpuFailed] = useState(false);
  const { columns, fps } = useMatrix(cols, rows);

  const active: MatrixMode = mode === 'gpu' && GPU_AVAILABLE && !gpuFailed ? 'gpu' : 'cpu';
  const insets = useSafeAreaInsets();

  const hint = !GPU_AVAILABLE
    ? 'GPU unavailable on web'
    : gpuFailed
      ? 'GPU failed, using CPU'
      : `tap to switch to ${active === 'cpu' ? 'GPU' : 'CPU'}`;

  return (
    <View style={styles.container}>
      {active === 'gpu' ? (
        <GpuBoundary
          onError={() => {
            setGpuFailed(true);
            setMode('cpu');
          }}>
          <MatrixGpu columns={columns} width={width} height={height} />
        </GpuBoundary>
      ) : (
        <MatrixCpu columns={columns} />
      )}

      <View style={[styles.hud, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable
          onPress={() => setMode((m) => (m === 'cpu' ? 'gpu' : 'cpu'))}
          disabled={!GPU_AVAILABLE}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>
            {active === 'cpu' ? 'CPU' : 'GPU'} · {fps} fps
          </Text>
          <Text style={styles.buttonHint}>{hint}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  hud: {
    position: 'absolute',
    right: 12,
    alignItems: 'flex-end',
  },
  button: {
    backgroundColor: 'rgba(0, 255, 102, 0.12)',
    borderColor: '#00ff66',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#00ff66',
    fontSize: 14,
    fontWeight: '900',
  },
  buttonHint: {
    color: 'rgba(0, 255, 102, 0.7)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
