import { useDeferredValue, useState } from 'react';
import { Alert, Linking, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { personSchema } from '@afterglow/contracts/memories';
import { apiRequest } from '../../lib/api-client';
import { apiURL } from '../../lib/auth-client';
import {
  Button,
  Chip,
  Feedback,
  FormTextField,
  LoadingIndicator,
  Screen,
  Stack,
  Surface,
  Text,
} from '../../components/ui';
import { MemoryHeader } from './memory-header';
import { useMemory, useRefreshMemories } from './memory-queries';

type Person = { id: string; name: string; username: string };
export function ShareMemoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    memory = useMemory(id),
    refresh = useRefreshMemories();
  const [selected, setSelected] = useState<Person[]>([]),
    [notice, setNotice] = useState(''),
    [failed, setFailed] = useState(false);
  const form = useForm({ defaultValues: { query: '' } });
  const invite = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/v1/boards/${id}/contributors`, {
        method: 'POST',
        body: JSON.stringify({ userIds: selected.map((person) => person.id) }),
      });
      await refresh();
      setSelected([]);
      setFailed(false);
      setNotice('Invited.');
    },
    onError: (error) => {
      setFailed(true);
      setNotice(error.message);
    },
  });
  const publish = useMutation({
    mutationFn: async (visibility: 'PRIVATE' | 'PUBLIC') => {
      if (visibility === 'PRIVATE' && memory.data!.visibility === 'PUBLIC') {
        await apiRequest(`/api/v1/boards/${id}/unpublish`, {
          method: 'POST',
          body: '{}',
        });
      } else
        await apiRequest(`/api/v1/boards/${id}/publish`, {
          method: 'POST',
          body: JSON.stringify({
            layoutId: memory.data!.preview!.id,
            visibility,
          }),
        });
      await refresh();
      setFailed(false);
      setNotice(
        visibility === 'PUBLIC' ? 'Posted publicly.' : 'Memory is private.',
      );
    },
    onError: (error) => {
      setFailed(true);
      setNotice(error.message);
    },
  });
  if (memory.isPending)
    return (
      <Screen header={<MemoryHeader title="Share your memory" />}>
        <LoadingIndicator label="Opening sharing options…" />
      </Screen>
    );
  if (memory.isError)
    return (
      <Screen header={<MemoryHeader title="Share your memory" />}>
        <Feedback error message={memory.error.message} />
        <Button label="Try again" onPress={() => void memory.refetch()} />
      </Screen>
    );
  const board = memory.data,
    busy = publish.isPending || invite.isPending,
    publicUrl = `${apiURL}/m/${id}`;
  if (!board.canPublish)
    return (
      <Screen header={<MemoryHeader title="Share your memory" />}>
        <Text>Only the owner can change who sees this memory.</Text>
      </Screen>
    );
  return (
    <Screen header={<MemoryHeader title="Share your memory" />}>
      <Text variant="title">{board.title}</Text>
      <Surface padding="xl">
        <Stack gap="lg">
          <Text variant="title">Pass it along</Text>
          <Text tone="secondary">Invite people to add to this memory.</Text>
          <form.Field name="query">
            {(field) => (
              <Stack gap="lg">
                <FormTextField
                  field={field}
                  kind="username"
                  label="Username"
                  placeholder="Search usernames"
                  maxLength={24}
                  editable={!busy}
                />
                <PeopleResults
                  query={field.state.value}
                  existingIds={board.members.map((member) => member.id)}
                  selected={selected}
                  disabled={busy}
                  onSelect={(person) =>
                    setSelected((people) =>
                      people.some((entry) => entry.id === person.id)
                        ? people.filter((entry) => entry.id !== person.id)
                        : [...people, person],
                    )
                  }
                />
              </Stack>
            )}
          </form.Field>
          {selected.map((person) => (
            <Chip
              key={person.id}
              label={`${person.name} · @${person.username}`}
              selected
              disabled={busy}
              onPress={() =>
                setSelected((people) =>
                  people.filter((entry) => entry.id !== person.id),
                )
              }
            />
          ))}
          <Button
            label="Invite to contribute"
            icon="users"
            pending={invite.isPending}
            disabled={busy || !selected.length}
            onPress={() => invite.mutate()}
          />
          <Text variant="caption" tone="secondary">
            Already here:{' '}
            {board.members.map((member) => member.name).join(', ')}
          </Text>
        </Stack>
      </Surface>
      <Surface padding="xl">
        <Stack gap="lg">
          <Text variant="title">Post your memory</Text>
          <Text tone="secondary">Anyone can view a public post.</Text>
          {!board.preview ? (
            <Feedback message="Compose your memory before posting." />
          ) : null}
          <Button
            label="Post publicly"
            icon="globe"
            pending={publish.isPending}
            disabled={busy || !board.preview}
            onPress={() =>
              Alert.alert(
                'Post this memory publicly?',
                'Anyone can view these photos, stories, songs, and contributors’ names.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Post publicly',
                    onPress: () => publish.mutate('PUBLIC'),
                  },
                ],
              )
            }
          />
          <Button
            label={
              board.visibility === 'PUBLIC' ? 'Make private' : 'Keep private'
            }
            variant="secondary"
            disabled={busy || (!board.preview && board.visibility !== 'PUBLIC')}
            onPress={() => publish.mutate('PRIVATE')}
          />
        </Stack>
      </Surface>
      <Feedback message={notice} error={failed} />
      {board.visibility === 'PUBLIC' && board.publishedLayoutId ? (
        <Stack gap="sm">
          <Button
            label="Share public link"
            disabled={busy}
            icon="share"
            onPress={() => {
              void Share.share({
                message: `${board.title}\n${publicUrl}`,
              }).catch(() => {
                setFailed(true);
                setNotice('Could not open sharing. Try again.');
              });
            }}
          />
          <Button
            label="Open public page"
            disabled={busy}
            variant="ghost"
            icon="external-link"
            onPress={() => {
              void Linking.openURL(publicUrl).catch(() => {
                setFailed(true);
                setNotice('Could not open the public page. Try again.');
              });
            }}
          />
        </Stack>
      ) : null}
    </Screen>
  );
}
function PeopleResults({
  query,
  existingIds,
  selected,
  disabled,
  onSelect,
}: {
  query: string;
  existingIds: string[];
  selected: Person[];
  disabled: boolean;
  onSelect: (person: Person) => void;
}) {
  const search = useDeferredValue(query.trim());
  const people = useQuery({
    queryKey: ['memory-people', search],
    enabled: /^[A-Za-z0-9_]{2,24}$/.test(search),
    queryFn: async ({ signal }) =>
      personSchema
        .array()
        .parse(
          await apiRequest(
            `/api/v1/people?query=${encodeURIComponent(search)}`,
            { signal },
          ),
        ),
  });
  if (search.length < 2) return null;
  if (people.isFetching) return <LoadingIndicator label="Finding people…" />;
  if (people.isError)
    return (
      <Stack gap="sm">
        <Feedback error message="Could not search people." />
        <Button
          label="Retry search"
          variant="secondary"
          onPress={() => void people.refetch()}
        />
      </Stack>
    );
  const choices =
    people.data?.filter((person) => !existingIds.includes(person.id)) ?? [];
  return (
    <Stack gap="sm">
      {choices.length ? (
        choices.map((person) => (
          <Chip
            key={person.id}
            label={`${person.name} · @${person.username}`}
            selected={selected.some((entry) => entry.id === person.id)}
            disabled={
              disabled ||
              (!selected.some((entry) => entry.id === person.id) &&
                selected.length + existingIds.length >= 8)
            }
            onPress={() => onSelect(person)}
          />
        ))
      ) : (
        <Text variant="caption" tone="secondary">
          No new people found. Try their username.
        </Text>
      )}
    </Stack>
  );
}
