import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { boardListSchema } from '@afterglow/contracts/memories';
import {
  Button,
  Feedback,
  LoadingIndicator,
  Stack,
  Surface,
  Text,
} from '../../components/ui';
import { useTheme } from '../../theme/theme-provider';
import { useShellSearch } from './shell-context';
import { authClient } from '../../lib/auth-client';
import { apiRequest } from '../../lib/api-client';

export function HomeScreen({ friends = false }: { friends?: boolean }) {
  const t = useTheme(),
    query = useShellSearch().trim(),
    router = useRouter(),
    session = authClient.useSession();
  const feed = useInfiniteQuery({
    queryKey: ['memories', session.data?.user.id, query, friends],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) =>
      boardListSchema.parse(
        await apiRequest(
          `/api/v1/boards?scope=${friends ? 'shared' : 'all'}&limit=20&query=${encodeURIComponent(query)}${pageParam ? `&cursor=${pageParam}` : ''}`,
          { signal },
        ),
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: !!session.data,
    refetchInterval: 20000,
  });
  const entries =
    feed.data?.pages
      .flatMap((page) => page.items)
      .filter(
        (board) => !friends || (board.isMember && board.contributorCount > 1),
      ) ?? [];
  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      refreshing={feed.isRefetching && !feed.isFetchingNextPage}
      onRefresh={() => void feed.refetch()}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{
        flexGrow: 1,
        width: '100%',
        maxWidth: t.primitives.layout.contentMaxWidth,
        alignSelf: 'center',
        padding: t.primitives.space.lg,
        gap: t.primitives.space.lg,
      }}
      ListHeaderComponent={
        <View style={{ paddingBottom: t.primitives.space.xl }}>
          <Stack gap="sm">
            <Text variant="display">
              {friends ? 'Friends' : 'Your memories'}
            </Text>
            <Text tone="secondary">
              {friends
                ? 'Memories you’re making together.'
                : 'Your drafts, shared moments, and public posts.'}
            </Text>
          </Stack>
        </View>
      }
      ListEmptyComponent={
        feed.isPending ? (
          <LoadingIndicator label="Finding your memories…" />
        ) : feed.isError ? (
          <Stack gap="lg">
            <Feedback message={feed.error.message} error />
            <Button label="Try again" onPress={() => void feed.refetch()} />
          </Stack>
        ) : (
          <Surface padding="xl">
            <Stack gap="lg">
              <Text variant="title">
                {query
                  ? 'No memories found.'
                  : friends
                    ? 'Better, together.'
                    : 'The good stuff stays.'}
              </Text>
              <Text tone="secondary">
                {query
                  ? 'Try another name or load more below.'
                  : friends
                    ? 'Memories you’re invited to, and ones you invite people into, will appear here.'
                    : 'Start with a photo, a story, or the song that takes you back.'}
              </Text>
              {!friends && !query ? (
                <Button
                  label="Create a memory"
                  icon="plus"
                  onPress={() => router.push('/create')}
                />
              ) : null}
            </Stack>
          </Surface>
        )
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.title}, ${item.published ? (item.visibility === 'PUBLIC' ? 'public post' : 'shared memory') : 'saved draft'}`}
          onPress={() =>
            router.push({
              pathname: item.isMember ? '/memory/[id]' : '/memory/[id]/preview',
              params: { id: item.id },
            })
          }
        >
          <Surface padding="xl">
            <Stack gap="sm">
              <Text variant="title">{item.title}</Text>
              <Text tone="secondary">{item.ownerName}</Text>
              <Text variant="caption" tone="secondary">
                {item.published
                  ? item.visibility === 'PUBLIC'
                    ? 'Public memory'
                    : 'Shared privately'
                  : 'Draft saved'}{' '}
                · {item.contributorCount}{' '}
                {item.contributorCount === 1 ? 'contributor' : 'contributors'}
              </Text>
            </Stack>
          </Surface>
        </Pressable>
      )}
      ListFooterComponent={
        <Stack gap="lg">
          {feed.isFetchNextPageError ? (
            <Feedback
              message="Could not load more memories. Try again."
              error
            />
          ) : null}
          {feed.hasNextPage ? (
            <Button
              label="Load more"
              variant="ghost"
              pending={feed.isFetchingNextPage}
              onPress={() => void feed.fetchNextPage()}
            />
          ) : null}
        </Stack>
      }
    />
  );
}
