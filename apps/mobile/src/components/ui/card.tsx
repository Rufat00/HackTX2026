import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/theme-provider';
import { Text } from './text';
export function Card({
  children,
  spatial = false,
}: PropsWithChildren<{ spatial?: boolean }>) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.semantic.surface,
        borderRadius: spatial
          ? t.component.memory.radius
          : t.component.card.radius,
        padding: spatial
          ? t.component.memory.padding
          : t.component.card.padding,
        gap: t.primitives.space.md,
        ...(spatial ? { width: t.component.memory.width } : {}),
      }}
    >
      {children}
    </View>
  );
}
export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'danger' | 'suggestion';
}) {
  const t = useTheme(),
    color = {
      neutral: t.semantic.textSecondary,
      success: t.semantic.success,
      danger: t.semantic.danger,
      suggestion: t.semantic.suggestion,
    }[tone],
    backgroundColor = {
      neutral: t.semantic.surfaceMuted,
      success: t.semantic.successSurface,
      danger: t.semantic.dangerSurface,
      suggestion: t.semantic.suggestionSurface,
    }[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: t.primitives.space.md,
        paddingVertical: t.primitives.space.xs,
        borderRadius: t.primitives.radius.small,
        backgroundColor,
      }}
    >
      <Text variant="caption" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
