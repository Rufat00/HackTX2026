import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { IconButton, Text } from '../../components/ui';
import { useTheme } from '../../theme/theme-provider';
import type { ReactNode } from 'react';

export function MemoryHeader({
  title,
  trailing,
}: {
  title: string;
  trailing?: ReactNode;
}) {
  const t = useTheme(),
    router = useRouter();
  return (
    <View
      style={{
        padding: t.primitives.space.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.primitives.space.md,
      }}
    >
      <IconButton
        label="Back"
        icon="arrow-left"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace('/home')
        }
      />
      <Text variant="heading" align="center" style={{ flex: 1 }}>
        {title}
      </Text>
      {trailing ?? <View style={{ width: t.primitives.control.touch }} />}
    </View>
  );
}
