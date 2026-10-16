import { StyleSheet, Text, View } from 'react-native';

import { CELL_H, CELL_W, cellColor, Column, FONT_SIZE, MIN_LEVEL } from './simulation';

/**
 * CPU renderer: every character is a plain React Native <Text> node, so the
 * whole grid is laid out and painted by the native view system on every tick.
 */
export function MatrixCpu({ columns }: { columns: Column[] }) {
  return (
    <View style={styles.container}>
      {columns.map((col, ci) => (
        <Text key={ci} style={styles.column}>
          {col.levels.map((level, ri) => (
            <Text key={ri} style={{ color: cellColor(col.hue, ri, level) }}>
              {(level > MIN_LEVEL ? col.chars[ri] : ' ') + '\n'}
            </Text>
          ))}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  column: {
    width: CELL_W,
    fontSize: FONT_SIZE,
    lineHeight: CELL_H,
    fontWeight: '900', // bold font
    textAlign: 'center',
    color: '#00ff66',
  },
});
