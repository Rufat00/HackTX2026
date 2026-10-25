import { useEffect } from 'react';
import { AppState } from 'react-native';
import { focusManager, onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
export function useQueryLifecycle() {
  useEffect(() => {
    const focus = AppState.addEventListener('change', (state) =>
      focusManager.setFocused(state === 'active'),
    );
    const network = Network.addNetworkStateListener((state) =>
      onlineManager.setOnline(state.isConnected !== false),
    );
    return () => {
      focus.remove();
      network.remove();
    };
  }, []);
}
