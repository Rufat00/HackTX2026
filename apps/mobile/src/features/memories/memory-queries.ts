import { useQuery, useQueryClient } from '@tanstack/react-query';
import { boardSchema } from '@afterglow/contracts/memories';
import { authClient } from '../../lib/auth-client';
import { apiRequest, ApiFailure } from '../../lib/api-client';

export function useMemory(id: string) {
  const session = authClient.useSession();
  return useQuery({
    queryKey: ['memory', session.data?.user.id, id],
    enabled: !!id && !!session.data,
    queryFn: async ({ signal }) => {
      try {
        return boardSchema.parse(
          await apiRequest(`/api/v1/boards/${id}`, { signal }),
        );
      } catch (error) {
        if (
          error instanceof ApiFailure &&
          error.detail.code === 'unauthenticated'
        )
          await authClient.getSession({ query: { disableCookieCache: true } });
        throw error;
      }
    },
    staleTime: 0,
    refetchInterval: 15000,
  });
}
export function useRefreshMemories() {
  const client = useQueryClient();
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['memory'] }),
      client.invalidateQueries({ queryKey: ['memories'] }),
    ]);
  };
}
export function newMemoryId() {
  // An idempotency identifier, never an authentication or sharing capability.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (character) => {
      const value = Math.floor(Math.random() * 16);
      return (character === 'x' ? value : (value & 3) | 8).toString(16);
    },
  );
}
