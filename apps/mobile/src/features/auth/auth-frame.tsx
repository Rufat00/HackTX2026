import type { PropsWithChildren, ReactNode } from 'react';
import { View } from 'react-native';
import { IconButton, Screen, Stack, Text } from '../../components/ui';
import { useTheme } from '../../theme/theme-provider';

export function AuthFrame({
  children,
  title,
  footer,
  onBack,
  backDisabled,
}: PropsWithChildren<{
  title: string;
  footer: ReactNode;
  onBack?: () => void;
  backDisabled?: boolean;
}>) {
  const t = useTheme();
  return (
    <Screen
      contentStyle={{
        flexGrow: 1,
        paddingHorizontal: t.primitives.space.xl,
        gap: t.primitives.space.xxl,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ width: t.primitives.control.touch }}>
          {onBack ? (
            <IconButton
              icon="arrow-left"
              label="Back"
              onPress={onBack}
              disabled={backDisabled}
            />
          ) : null}
        </View>
        <Text
          variant="title"
          style={{ letterSpacing: t.component.auth.brandTracking }}
        >
          afterglow
        </Text>
        <View style={{ width: t.primitives.control.touch }} />
      </View>
      <View
        style={{
          flexGrow: 1,
          justifyContent: 'center',
          gap: t.primitives.space.section,
          paddingVertical: t.primitives.space.xl,
        }}
      >
        <Stack gap="lg">
          <Text
            variant="hero"
            style={{ letterSpacing: t.component.auth.heroTracking }}
          >
            {title}
          </Text>
        </Stack>
        <Stack gap="xl">{children}</Stack>
      </View>
      <Stack gap="xs">{footer}</Stack>
    </Screen>
  );
}
