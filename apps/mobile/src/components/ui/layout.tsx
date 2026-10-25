import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, type Theme } from '../../theme/theme-provider';
type Space = keyof Theme['primitives']['space'];
export function Screen({
  children,
  header,
  footer,
  scroll = true,
  contentStyle,
}: PropsWithChildren<{
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}>) {
  const t = useTheme();
  const content = (
    <View
      style={[
        {
          width: '100%',
          maxWidth: t.primitives.layout.contentMaxWidth,
          alignSelf: 'center',
          padding: t.primitives.space.lg,
          gap: t.primitives.space.lg,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.semantic.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {header}
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Stack({
  children,
  gap = 'lg',
  align = 'stretch',
}: PropsWithChildren<{
  gap?: Space;
  align?: 'stretch' | 'center' | 'flex-start';
}>) {
  const t = useTheme();
  return (
    <View
      style={{
        gap: t.primitives.space[gap],
        alignItems: align,
        flexShrink: 1,
        maxWidth: '100%',
      }}
    >
      {children}
    </View>
  );
}
export function Inline({
  children,
  gap = 'sm',
  align = 'center',
}: PropsWithChildren<{ gap?: Space; align?: 'center' | 'flex-start' }>) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: t.primitives.space[gap],
        alignItems: align,
        flexShrink: 1,
        maxWidth: '100%',
      }}
    >
      {children}
    </View>
  );
}
export function Surface({
  children,
  tone = 'default',
  padding = 'lg',
}: PropsWithChildren<{
  tone?: 'default' | 'muted' | 'elevated';
  padding?: Space;
}>) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor:
          tone === 'muted'
            ? t.semantic.surfaceMuted
            : tone === 'elevated'
              ? t.semantic.surfaceElevated
              : t.semantic.surface,
        padding: t.primitives.space[padding],
        borderRadius: t.component.card.radius,
        ...(tone === 'elevated'
          ? Platform.select({
              ios: {
                shadowColor: t.primitives.shadow.color,
                shadowOpacity: t.primitives.shadow.opacity,
                shadowRadius: t.primitives.shadow.radius,
                shadowOffset: { width: 0, height: t.primitives.shadow.offsetY },
              },
              android: { elevation: t.primitives.shadow.elevation },
              default: {},
            })
          : {}),
      }}
    >
      {children}
    </View>
  );
}
export function Divider() {
  const t = useTheme();
  return (
    <View
      accessible={false}
      style={{
        height: t.primitives.border.hairline,
        backgroundColor: t.semantic.border,
      }}
    />
  );
}
