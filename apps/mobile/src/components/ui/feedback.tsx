import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../theme/theme-provider';
import { Text } from './text';
import { Inline, Stack, Surface } from './layout';
import { Button } from './button';
export function LoadingIndicator({ label }: { label: string }) {
  const t = useTheme();
  return (
    <Inline>
      <ActivityIndicator color={t.semantic.textPrimary} />
      <Text
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        accessibilityLiveRegion="polite"
      >
        {label}
      </Text>
    </Inline>
  );
}
export function Skeleton({ kind = 'text' }: { kind?: 'text' | 'media' }) {
  const t = useTheme();
  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={{
        backgroundColor: t.semantic.surfaceMuted,
        borderRadius: t.primitives.radius.small,
        height:
          kind === 'media'
            ? t.primitives.layout.mediaMinHeight
            : t.primitives.layout.skeletonLine,
      }}
    />
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <Surface>
      <Stack>
        <Text variant="heading" align="center">
          {title}
        </Text>
        <Text tone="secondary" align="center">
          {description}
        </Text>
        {action ? <Button {...action} variant="secondary" /> : null}
      </Stack>
    </Surface>
  );
}
export function Feedback({
  message,
  tone = 'neutral',
  error = false,
}: {
  message: string;
  tone?: 'neutral' | 'danger' | 'success';
  error?: boolean;
}) {
  if (!message) return null;
  return (
    <Text
      accessibilityLiveRegion="polite"
      accessibilityRole={error || tone === 'danger' ? 'alert' : undefined}
      tone={error ? 'danger' : tone === 'neutral' ? 'secondary' : tone}
    >
      {message}
    </Text>
  );
}
