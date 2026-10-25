import { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function useMemoryStatusBar() {
  useFocusEffect(
    useCallback(() => {
      const entry = StatusBar.pushStackEntry({ barStyle: 'light-content' });
      return () => StatusBar.popStackEntry(entry);
    }, []),
  );
}
