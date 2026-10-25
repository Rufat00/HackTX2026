import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import {
  addContributionSchema,
  type MemoryBoard,
  type MemoryItem,
} from '@afterglow/contracts/memories';
import { apiRequest } from '../../lib/api-client';
import {
  Button,
  Feedback,
  FormTextField,
  IconButton,
  LoadingIndicator,
  Screen,
  Stack,
  Surface,
  Text,
} from '../../components/ui';
import { ThemeProvider, useTheme } from '../../theme/theme-provider';
import { useMemoryStatusBar } from './use-memory-status-bar';
import { MemoryHeader } from './memory-header';
import { MemoryPhoto } from './memory-photo';
import { authClient } from '../../lib/auth-client';
import { SongPicker } from './song-picker';
import { newMemoryId, useMemory, useRefreshMemories } from './memory-queries';

export function WriteMemoryScreen() {
  useMemoryStatusBar();
  return (
    <ThemeProvider appearance="editor">
      <WriteMemory />
    </ThemeProvider>
  );
}
function WriteMemory() {
  const { id, itemId, kind } = useLocalSearchParams<{
    id: string;
    itemId?: string;
    kind?: string;
  }>();
  const memory = useMemory(id);
  const actor = authClient.useSession();
  if (memory.isPending)
    return (
      <Screen>
        <LoadingIndicator label="Opening your story…" />
      </Screen>
    );
  if (memory.isError)
    return (
      <Screen header={<MemoryHeader title="Backstory" />}>
        <Feedback message={memory.error.message} error />
        <Button label="Try again" onPress={() => void memory.refetch()} />
      </Screen>
    );
  const item = memory.data.items.find((entry) => entry.id === itemId);
  if (!memory.data.canContribute || (itemId && !item))
    return (
      <Screen header={<MemoryHeader title="Backstory" />}>
        <Feedback message="This item is no longer available to edit." />
      </Screen>
    );
  if ((item?.kind ?? kind) === 'SONG')
    return (
      <SongPicker
        board={memory.data}
        item={
          item ??
          memory.data.items.find(
            (entry) =>
              entry.kind === 'SONG' &&
              entry.contributorId === actor.data?.user.id,
          )
        }
      />
    );
  return (
    <WritingForm
      key={itemId ?? 'new'}
      board={memory.data}
      item={item}
      kind="STORY"
    />
  );
}
function WritingForm({
  board,
  item,
  kind,
}: {
  board: MemoryBoard;
  item?: MemoryItem;
  kind: 'STORY';
}) {
  const t = useTheme(),
    router = useRouter(),
    refresh = useRefreshMemories(),
    itemId = useRef(item?.id ?? newMemoryId());
  const revision = useRef(board.contentRevision);
  const [error, setError] = useState('');
  const form = useForm({
    defaultValues: { text: item?.text ?? '' },
    validators: {
      onSubmit: ({ value }) => {
        const checked = addContributionSchema.safeParse({
          id: itemId.current,
          kind: item?.kind ?? kind,
          text: value.text,
          assetId: item?.assetId ?? null,
          songUrl: null,
        });
        return checked.success
          ? undefined
          : {
              fields: Object.fromEntries(
                checked.error.issues.map((issue) => [
                  issue.path[0],
                  issue.message,
                ]),
              ),
            };
      },
    },
    onSubmit: async ({ value }) => {
      setError('');
      try {
        const body = addContributionSchema.parse({
          id: itemId.current,
          kind: item?.kind ?? kind,
          text: value.text,
          assetId: item?.assetId ?? null,
          songUrl: null,
        });
        await apiRequest(
          `/api/v1/boards/${board.id}/items${item ? `/${item.id}` : ''}`,
          {
            method: item ? 'PATCH' : 'POST',
            body: JSON.stringify(
              item ? { contentRevision: revision.current, item: body } : body,
            ),
          },
        );
        await refresh();
        if (router.canGoBack()) router.back();
        else
          router.replace({
            pathname: '/memory/[id]',
            params: { id: board.id },
          });
      } catch (failure) {
        setError(
          failure instanceof Error
            ? failure.message
            : 'Could not save. Your words are kept here; try again.',
        );
      }
    },
  });
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(pending) => (
        <Screen
          header={
            <MemoryHeader
              title="Backstory"
              trailing={
                <IconButton
                  label="Save"
                  icon="check"
                  variant="primary"
                  disabled={pending}
                  onPress={() => void form.handleSubmit()}
                />
              }
            />
          }
          contentStyle={{ flexGrow: 1, gap: t.primitives.space.xl }}
        >
          {item?.assetId ? (
            <View
              style={{
                width: t.component.editor.photoSize,
                alignSelf: 'center',
              }}
            >
              <MemoryPhoto
                boardId={board.id}
                assetId={item.assetId}
                style={{
                  width: '100%',
                  height: t.component.editor.photoSize,
                  borderRadius: t.primitives.radius.sheet,
                }}
              />
            </View>
          ) : null}
          <Surface padding="xl">
            <Stack gap="xl">
              <Text variant="quote" tone="secondary" accessible={false}>
                “
              </Text>
              <form.Field name="text">
                {(field) => (
                  <FormTextField
                    field={field}
                    variant="quiet"
                    label={
                      item?.kind === 'PHOTO'
                        ? 'The story behind the photo'
                        : 'Your story'
                    }
                    placeholder={'Made this with my friends…'}
                    multiline
                    autoFocus
                    autoCapitalize="sentences"
                    editable={!pending}
                    maxLength={600}
                    textContentType="none"
                    style={{
                      ...t.primitives.type.body,
                      minHeight: t.component.editor.writingMinHeight,
                    }}
                  />
                )}
              </form.Field>
              <Text variant="caption" tone="secondary">
                {board.eventDate ? `${board.eventDate} · ` : ''}
                <form.Subscribe selector={(state) => state.values.text.length}>
                  {(length) => `${length} / 600`}
                </form.Subscribe>
              </Text>
            </Stack>
          </Surface>
          <Feedback message={error} error />
          <Button
            label="Save"
            pending={pending}
            onPress={() => void form.handleSubmit()}
          />
        </Screen>
      )}
    </form.Subscribe>
  );
}
