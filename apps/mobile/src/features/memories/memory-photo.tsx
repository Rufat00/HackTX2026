import { useState } from 'react';
import { Image, View, type ImageStyle, type StyleProp } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { authClient, apiURL } from '../../lib/auth-client';
import { clientHeaders } from '../../lib/client-headers';
import { Button, LoadingIndicator } from '../../components/ui';

export function MemoryPhoto({
  boardId,
  assetId,
  publicRead = false,
  style,
}: {
  boardId: string;
  assetId: string;
  publicRead?: boolean;
  style?: StyleProp<ImageStyle>;
}) {
  const session = authClient.useSession(),
    [failed, setFailed] = useState(false);
  const source = useQuery({
    queryKey: [
      'memory-photo',
      session.data?.user.id,
      boardId,
      assetId,
      publicRead,
    ],
    queryFn: async () => ({
      uri: `${apiURL}/api/${publicRead ? 'public' : 'v1'}/boards/${boardId}/media/${assetId}`,
      headers: publicRead
        ? clientHeaders
        : {
            Cookie: (await authClient.getCookie()) ?? '',
            ...clientHeaders,
          },
    }),
    staleTime: 180000,
  });
  if (failed || source.isError)
    return (
      <View style={style}>
        <Button
          label="Reload photo"
          variant="secondary"
          onPress={() => {
            setFailed(false);
            void source.refetch();
          }}
        />
      </View>
    );
  if (!source.data)
    return (
      <View style={style}>
        <LoadingIndicator label="Loading photo…" />
      </View>
    );
  return (
    <Image
      source={source.data}
      accessibilityLabel="Memory photo"
      style={style}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}
