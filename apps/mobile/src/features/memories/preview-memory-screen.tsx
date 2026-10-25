import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import {
  Button,
  Feedback,
  LoadingIndicator,
  Screen,
  Text,
} from '../../components/ui';
import { ThemeProvider, useTheme } from '../../theme/theme-provider';
import { useMemoryStatusBar } from './use-memory-status-bar';
import { MemoryHeader } from './memory-header';
import { MemoryCanvas } from './memory-canvas';
import { useMemory } from './memory-queries';

export function PreviewMemoryScreen() {
  useMemoryStatusBar();
  return (
    <ThemeProvider appearance="memory">
      <PreviewMemory />
    </ThemeProvider>
  );
}
function PreviewMemory() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    memory = useMemory(id),
    router = useRouter(),
    t = useTheme();
  if (memory.isPending)
    return (
      <Screen header={<MemoryHeader title="Your composition" />}>
        <LoadingIndicator label="Opening your memory…" />
      </Screen>
    );
  if (memory.isError)
    return (
      <Screen header={<MemoryHeader title="Your composition" />}>
        <Feedback message={memory.error.message} error />
        <Button label="Try again" onPress={() => void memory.refetch()} />
      </Screen>
    );
  const board = memory.data;
  if (!board.items.length)
    return (
      <Screen header={<MemoryHeader title={board.title} />}>
        <Text tone="secondary">No items remain in this memory.</Text>
      </Screen>
    );
  if (!board.preview)
    return (
      <Screen header={<MemoryHeader title="Your composition" />}>
        <Text variant="title">
          This draft is ready for a fresh composition.
        </Text>
        <Text tone="secondary">
          Your saved items are all here. Compose them before sharing.
        </Text>
        <Button
          label="Back to your items"
          onPress={() =>
            router.replace({ pathname: '/memory/[id]', params: { id } })
          }
        />
      </Screen>
    );
  return (
    <Screen
      scroll={false}
      contentStyle={{
        flex: 1,
        padding: t.primitives.space.none,
        gap: t.primitives.space.none,
      }}
      header={
        <MemoryHeader
          title={board.canContribute ? 'Preview memory' : 'Public memory'}
        />
      }
      footer={
        board.canPublish ? (
          <View style={{ padding: t.primitives.space.lg }}>
            <Button
              label="Choose who sees it"
              icon="arrow-right"
              onPress={() =>
                router.push({ pathname: '/memory/[id]/share', params: { id } })
              }
            />
          </View>
        ) : undefined
      }
    >
      <View
        style={{
          paddingHorizontal: t.primitives.space.xl,
          paddingBottom: t.primitives.space.lg,
          gap: t.primitives.space.sm,
        }}
      >
        <Text variant="title">{board.title}</Text>
        <Text variant="caption" tone="secondary">
          {board.preview.label} · Swipe to explore
        </Text>
        {board.preview.suggestedLinks.length ? (
          <Text variant="caption" tone="secondary">
            {board.preview.suggestedLinks.length} AI-suggested connections ·
            suggestions don’t confirm who was there
          </Text>
        ) : null}
      </View>
      <MemoryCanvas board={board} />
      {board.canContribute ? (
        <View style={{ paddingHorizontal: t.primitives.space.lg }}>
          <Button
            label="Edit items"
            variant="ghost"
            onPress={() =>
              router.replace({ pathname: '/memory/[id]', params: { id } })
            }
          />
        </View>
      ) : null}
    </Screen>
  );
}
