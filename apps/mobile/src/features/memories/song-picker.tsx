import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  catalogSongSchema,
  type CatalogSong,
} from '@afterglow/contracts/music';
import type { MemoryBoard, MemoryItem } from '@afterglow/contracts/memories';
import { apiRequest } from '../../lib/api-client';
import {
  Button,
  Feedback,
  FormTextField,
  LoadingIndicator,
  Screen,
  Stack,
  Surface,
  Text,
} from '../../components/ui';
import { useTheme } from '../../theme/theme-provider';
import { MusicPlaybackProvider, SongPreview } from './music-playback';
import { MemoryHeader } from './memory-header';
import { newMemoryId, useRefreshMemories } from './memory-queries';

export function SongPicker({
  board,
  item,
}: {
  board: MemoryBoard;
  item?: MemoryItem;
}) {
  return (
    <MusicPlaybackProvider>
      <SongPickerContent board={board} item={item} />
    </MusicPlaybackProvider>
  );
}
function SongPickerContent({
  board,
  item,
}: {
  board: MemoryBoard;
  item?: MemoryItem;
}) {
  const t = useTheme(),
    router = useRouter(),
    refresh = useRefreshMemories();
  const [selected, setSelected] = useState<CatalogSong | null>(
    item?.song ?? null,
  );
  const itemId = useRef(item?.id ?? newMemoryId());
  const form = useForm({ defaultValues: { query: '' } });
  const save = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const input = {
        id: item?.id ?? itemId.current,
        kind: 'SONG',
        text: `${selected.title} — ${selected.artist}`.slice(0, 600),
        assetId: null,
        songUrl: null,
        songTrackId: selected.id,
      };
      await apiRequest(
        `/api/v1/boards/${board.id}/items${item ? `/${item.id}` : ''}`,
        {
          method: item ? 'PATCH' : 'POST',
          body: JSON.stringify(
            item
              ? { contentRevision: board.contentRevision, item: input }
              : input,
          ),
        },
      );
      await refresh();
      if (router.canGoBack()) router.back();
      else
        router.replace({ pathname: '/memory/[id]', params: { id: board.id } });
    },
  });
  return (
    <Screen
      header={
        <MemoryHeader title={item ? 'Replace your song' : 'Choose your song'} />
      }
      scroll={false}
      contentStyle={{ flex: 1, gap: t.primitives.space.lg }}
      footer={
        <View style={{ padding: t.primitives.space.lg }}>
          <Feedback message={save.error?.message ?? ''} error />
          <Button
            label={item ? 'Replace song' : 'Add song'}
            pending={save.isPending}
            disabled={!selected}
            onPress={() => save.mutate()}
          />
        </View>
      }
    >
      <form.Field name="query">
        {(field) => (
          <View style={{ flex: 1, gap: t.primitives.space.lg }}>
            <FormTextField
              field={field}
              label="Search music"
              placeholder="Song or artist"
              maxLength={100}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!save.isPending}
            />
            <SongResults
              query={field.state.value}
              selected={selected?.id ?? null}
              disabled={save.isPending}
              onSelect={setSelected}
            />
          </View>
        )}
      </form.Field>
      <Text variant="caption" tone="secondary">
        {selected
          ? `Selected: ${selected.title} · ${selected.artist}`
          : 'Choose one song'}
        {'\n'}Previews provided courtesy of iTunes
      </Text>
    </Screen>
  );
}
function SongResults({
  query,
  selected,
  disabled,
  onSelect,
}: {
  query: string;
  selected: string | null;
  disabled: boolean;
  onSelect: (song: CatalogSong) => void;
}) {
  const t = useTheme(),
    [search, setSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);
  const songs = useQuery({
    queryKey: ['song-search', search],
    enabled: search.length >= 2,
    queryFn: async ({ signal }) =>
      catalogSongSchema
        .array()
        .parse(
          await apiRequest(
            `/api/v1/music/search?q=${encodeURIComponent(search)}`,
            { signal },
          ),
        ),
    staleTime: 60000,
  });
  if (search.length < 2)
    return <Text tone="secondary">Find a song for this memory.</Text>;
  if (songs.isPending) return <LoadingIndicator label="Searching songs…" />;
  if (songs.isError)
    return (
      <Stack>
        <Feedback error message={songs.error.message} />
        <Button
          label="Try again"
          variant="secondary"
          onPress={() => void songs.refetch()}
        />
      </Stack>
    );
  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      data={songs.data}
      keyExtractor={(song) => song.id}
      contentContainerStyle={{ gap: t.primitives.space.md }}
      ListEmptyComponent={<Text tone="secondary">No songs found.</Text>}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="radio"
          accessibilityLabel={`Select ${item.title} by ${item.artist}`}
          accessibilityState={{
            checked: selected === item.id,
            disabled: disabled || !item.previewUrl,
          }}
          disabled={disabled || !item.previewUrl}
          onPress={() => onSelect(item)}
        >
          <Surface>
            <Stack gap="xs">
              <SongPreview song={item} compact minimal />
              {selected === item.id ? (
                <Text variant="caption">✓ Selected</Text>
              ) : null}
            </Stack>
          </Surface>
        </Pressable>
      )}
    />
  );
}
