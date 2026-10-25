import { useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { apiRequest } from '../../lib/api-client';
import { readApiResponse } from '../../lib/api-response';
import { clientHeaders } from '../../lib/client-headers';
import { readUploadImage } from '../../lib/upload-image';
import { fetch as expoFetch } from 'expo/fetch';
import { authClient, apiURL } from '../../lib/auth-client';
import {
  Button,
  Feedback,
  IconButton,
  LoadingIndicator,
  Screen,
  Stack,
  Surface,
  Text,
} from '../../components/ui';
import { useTheme } from '../../theme/theme-provider';
import { MemoryHeader } from './memory-header';
import { MemoryPhoto } from './memory-photo';
import { newMemoryId, useMemory, useRefreshMemories } from './memory-queries';

export function CollectMemoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    router = useRouter(),
    t = useTheme(),
    refresh = useRefreshMemories();
  const memory = useMemory(id),
    actor = authClient.useSession();
  const [notice, setNotice] = useState('');
  const photoJobs = useRef<
    {
      image: ImagePicker.ImagePickerAsset;
      assetId: string;
      itemId: string;
      uploaded: boolean;
      verified: boolean;
      saved: boolean;
    }[]
  >([]);
  const upload = useMutation({
    mutationFn: async () => {
      if (!photoJobs.current.length) {
        const selected = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.9,
          preferredAssetRepresentationMode:
            ImagePicker.UIImagePickerPreferredAssetRepresentationMode
              .Compatible,
          allowsMultipleSelection: true,
          selectionLimit: Math.max(1, 30 - (memory.data?.items.length ?? 0)),
        });
        if (selected.canceled) return;
        photoJobs.current = selected.assets.map((image) => ({
          image,
          assetId: newMemoryId(),
          itemId: newMemoryId(),
          uploaded: false,
          verified: false,
          saved: false,
        }));
      }
      for (const [index, job] of photoJobs.current.entries()) {
        if (job.saved) continue;
        const { image, assetId } = job;
        setNotice(
          `Uploading photo ${index + 1} of ${photoJobs.current.length}…`,
        );
        const { body, mime, byteSize } = await readUploadImage(image.uri);
        await apiRequest(`/api/v1/boards/${id}/uploads`, {
          method: 'POST',
          body: JSON.stringify({ id: assetId, mime, byteSize }),
        });
        if (!job.uploaded) {
          const response = await expoFetch(
            `${apiURL}/api/v1/boards/${id}/assets/${assetId}/source`,
            {
              method: 'POST',
              headers: {
                'Content-Type': mime,
                Cookie: (await authClient.getCookie()) ?? '',
                ...clientHeaders,
              },
              body,
            },
          );
          await readApiResponse(response);
          job.uploaded = true;
        }
        setNotice(
          `Checking photo ${index + 1} of ${photoJobs.current.length}…`,
        );
        if (!job.verified) {
          await apiRequest(`/api/v1/boards/${id}/assets/${assetId}/complete`, {
            method: 'POST',
            body: '{}',
          });
          job.verified = true;
        }
        await apiRequest(`/api/v1/boards/${id}/items`, {
          method: 'POST',
          body: JSON.stringify({
            id: job.itemId,
            kind: 'PHOTO',
            assetId,
            text: '',
            songUrl: null,
          }),
        });
        job.saved = true;
        await refresh();
      }
      photoJobs.current = [];
      setNotice('Photos saved.');
    },
    onError: (error) => setNotice(error.message),
  });
  const compose = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/v1/boards/${id}/compose`, {
        method: 'POST',
        body: JSON.stringify({ contentRevision: memory.data!.contentRevision }),
      });
      await refresh();
      router.push({ pathname: '/memory/[id]/preview', params: { id } });
    },
    onError: (error) => setNotice(error.message),
  });
  const remove = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest(`/api/v1/boards/${id}/items/${itemId}`, {
        method: 'DELETE',
      });
      await refresh();
    },
    onError: (error) => setNotice(error.message),
  });
  const busy = upload.isPending || compose.isPending || remove.isPending;
  if (memory.isPending)
    return (
      <Screen header={<MemoryHeader title="Your memory" />}>
        <LoadingIndicator label="Opening your draft…" />
      </Screen>
    );
  if (memory.isError)
    return (
      <Screen header={<MemoryHeader title="Your memory" />}>
        <Feedback message={memory.error.message} error />
        <Button label="Try again" onPress={() => void memory.refetch()} />
      </Screen>
    );
  const board = memory.data;
  const ownSong = board.items.find(
    (item) =>
      item.kind === 'SONG' && item.contributorId === actor.data?.user.id,
  );
  return (
    <Screen
      header={
        <MemoryHeader
          title={board.canContribute ? 'Collect a moment' : 'Shared memory'}
        />
      }
      contentStyle={{ gap: t.primitives.space.xl }}
    >
      <Stack gap="sm">
        <Text variant="display">{board.title}</Text>
        <Text tone="secondary">
          {board.eventDate ? `${board.eventDate} · ` : ''}
          {board.items.length} / 30 items ·{' '}
          {board.publishedLayoutId
            ? board.pendingChanges
              ? 'Changes pending'
              : 'Published'
            : 'Saved draft'}
        </Text>
      </Stack>
      {board.canContribute ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: t.primitives.space.sm,
          }}
        >
          <Button
            label={upload.isError ? 'Retry photos' : 'Photos'}
            icon="image"
            variant="secondary"
            disabled={busy || board.items.length >= 30}
            pending={upload.isPending}
            onPress={() => {
              setNotice('');
              upload.mutate();
            }}
          />
          <Button
            label="Write"
            icon="edit-3"
            variant="secondary"
            disabled={busy || board.items.length >= 30}
            onPress={() =>
              router.push({
                pathname: '/memory/[id]/write',
                params: { id, kind: 'STORY' },
              })
            }
          />
          <Button
            label={ownSong ? 'Replace song' : 'Song'}
            icon="music"
            variant="secondary"
            disabled={busy || (board.items.length >= 30 && !ownSong)}
            onPress={() =>
              router.push({
                pathname: '/memory/[id]/write',
                params: { id, kind: 'SONG' },
              })
            }
          />
        </View>
      ) : null}
      {!board.items.length ? (
        <Surface padding="xl">
          <Stack gap="lg">
            <Text tone="secondary">Add a photo, story, or song.</Text>
          </Stack>
        </Surface>
      ) : null}
      {board.items.map((item) => (
        <Surface key={item.id} padding="lg">
          <Stack gap="md">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.kind.toLowerCase()}: ${item.text || 'Photo'}`}
              disabled={
                !board.canContribute ||
                busy ||
                (!board.canPublish &&
                  item.contributorId !== actor.data?.user.id)
              }
              onPress={() =>
                router.push({
                  pathname: '/memory/[id]/write',
                  params: { id, itemId: item.id },
                })
              }
            >
              <Stack gap="md">
                {item.assetId ? (
                  <MemoryPhoto
                    boardId={id}
                    assetId={item.assetId}
                    publicRead={!board.canContribute}
                    style={{
                      width: '100%',
                      aspectRatio: t.primitives.layout.mediaAspectRatio,
                      borderRadius: t.primitives.radius.memory,
                    }}
                  />
                ) : null}
                <Text variant={item.kind === 'SONG' ? 'heading' : 'body'}>
                  {item.text || 'Add a backstory…'}
                </Text>
              </Stack>
            </Pressable>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: t.primitives.space.sm,
              }}
            >
              <Text variant="caption" tone="secondary">
                Added by {item.contributorName}
              </Text>
              {board.canContribute &&
              (board.canPublish ||
                item.contributorId === actor.data?.user.id) ? (
                <IconButton
                  icon="trash-2"
                  label="Remove item"
                  disabled={busy}
                  onPress={() =>
                    Alert.alert(
                      'Remove this item?',
                      'It will also disappear from any published version.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => remove.mutate(item.id),
                        },
                      ],
                    )
                  }
                />
              ) : null}
            </View>
          </Stack>
        </Surface>
      ))}
      {upload.isError ? (
        <Button
          label="Choose different photos"
          variant="ghost"
          disabled={busy}
          onPress={() => {
            photoJobs.current = [];
            upload.reset();
            setNotice('');
            upload.mutate();
          }}
        />
      ) : null}
      <Feedback
        message={notice}
        error={upload.isError || compose.isError || remove.isError}
      />
      {compose.isPending ? <LoadingIndicator label="Composing…" /> : null}
      {board.canPublish ? (
        <Button
          label="Compose memory"
          icon="arrow-right"
          pending={compose.isPending}
          disabled={busy || !board.items.length}
          onPress={() => {
            setNotice('');
            compose.mutate();
          }}
        />
      ) : board.canContribute ? (
        <Text tone="secondary">Saved. Waiting for the owner to publish.</Text>
      ) : null}
      {board.preview ? (
        <Button
          label="View composition"
          variant="secondary"
          disabled={busy}
          onPress={() =>
            router.push({ pathname: '/memory/[id]/preview', params: { id } })
          }
        />
      ) : null}
      {board.canPublish ? (
        <Button
          label="Invite people to add"
          variant="ghost"
          disabled={busy}
          onPress={() =>
            router.push({ pathname: '/memory/[id]/share', params: { id } })
          }
        />
      ) : null}
    </Screen>
  );
}
