import { Redirect, Stack } from 'expo-router';
import { authClient } from '../../lib/auth-client';
import {
  Button,
  Feedback,
  LoadingIndicator,
  Screen,
} from '../../components/ui';

export function MemoryLayout() {
  const session = authClient.useSession();
  if (session.isPending)
    return (
      <Screen>
        <LoadingIndicator label="Opening your session…" />
      </Screen>
    );
  if (session.error)
    return (
      <Screen>
        <Feedback message="Could not restore your session." error />
        <Button label="Try again" onPress={() => void session.refetch()} />
      </Screen>
    );
  if (!session.data) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
