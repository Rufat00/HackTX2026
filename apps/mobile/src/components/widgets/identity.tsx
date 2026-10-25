import type { ImageSourcePropType } from 'react-native';
import { Avatar, Inline, Stack, Text } from '../ui';
export function UserSummary({
  name,
  detail,
  source,
}: {
  name: string;
  detail?: string;
  source?: ImageSourcePropType;
}) {
  return (
    <Inline>
      <Avatar name={name} source={source} />
      <Stack gap="xs">
        <Text variant="label">{name}</Text>
        {detail ? (
          <Text variant="caption" tone="secondary">
            {detail}
          </Text>
        ) : null}
      </Stack>
    </Inline>
  );
}
export function ProfileHeader({
  name,
  username,
  source,
  onImageError,
}: {
  name: string;
  username: string;
  source?: ImageSourcePropType;
  onImageError?: () => void;
}) {
  return (
    <Stack align="center">
      <Avatar name={name} source={source} size="lg" onError={onImageError} />
      <Text variant="display" align="center">
        {name}
      </Text>
      <Text tone="secondary" align="center">
        @{username}
      </Text>
    </Stack>
  );
}
