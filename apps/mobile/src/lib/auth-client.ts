import { createAuthClient } from 'better-auth/react';
import { usernameClient } from 'better-auth/client/plugins';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import { clientHeaders } from './client-headers';
export const apiURL = process.env.EXPO_PUBLIC_API_URL;
if (!apiURL)
  throw new Error('Set EXPO_PUBLIC_API_URL to a phone-reachable API URL');
export const authClient = createAuthClient({
  baseURL: apiURL,
  fetchOptions: { headers: clientHeaders },
  plugins: [
    usernameClient(),
    expoClient({
      scheme: 'afterglow',
      storagePrefix: 'afterglow',
      storage: SecureStore,
    }),
  ],
});
