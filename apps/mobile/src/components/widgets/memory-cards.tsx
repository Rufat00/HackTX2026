import {
  useEffect,
  useState,
  type RefObject,
  type PropsWithChildren,
} from 'react';
import {
  Image,
  ScrollView,
  View,
  type ViewInstance,
  type ImageSourcePropType,
} from 'react-native';
import { useTheme } from '../../theme/theme-provider';
import { Badge, Button, Card, LoadingIndicator, Stack, Text } from '../ui';
import { UserSummary } from './identity';
type MemoryProps = { uploader: string; tags?: string[] };
function Tags({ tags = [] }: { tags?: string[] }) {
  return tags.length ? (
    <Text variant="caption" tone="secondary">
      Explicitly tagged: {tags.join(', ')}
    </Text>
  ) : null;
}
export function PhotoMemoryCard({
  uploader,
  caption,
  source,
  tags,
  imageState = 'ready',
  onRetry,
}: {
  caption: string;
  source?: ImageSourcePropType;
  imageState?: 'loading' | 'ready' | 'error';
  onRetry?: () => void;
} & MemoryProps) {
  const t = useTheme(),
    [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [source]);
  return (
    <Card spatial>
      <View
        style={{
          minHeight: t.primitives.layout.mediaMinHeight,
          backgroundColor: t.semantic.surfaceMuted,
          borderRadius: t.primitives.radius.memory,
          overflow: 'hidden',
          justifyContent: 'center',
          padding: t.primitives.space.sm,
        }}
      >
        {imageState === 'loading' ? (
          <LoadingIndicator label="Loading photo…" />
        ) : source && imageState === 'ready' && !failed ? (
          <Image
            source={source}
            accessibilityLabel={caption || 'Memory photo'}
            onError={() => setFailed(true)}
            style={{
              width: '100%',
              aspectRatio: t.primitives.layout.mediaAspectRatio,
            }}
          />
        ) : (
          <Stack>
            <Text align="center" tone="secondary">
              {failed || imageState === 'error'
                ? 'Photo unavailable'
                : 'No photo attached'}
            </Text>
            {onRetry ? (
              <Button
                variant="secondary"
                label="Retry photo"
                onPress={() => {
                  setFailed(false);
                  onRetry();
                }}
              />
            ) : null}
          </Stack>
        )}
      </View>
      <Text>{caption}</Text>
      <UserSummary name={uploader} detail="Uploaded by" />
      <Tags tags={tags} />
    </Card>
  );
}
export function StoryMemoryCard({
  uploader,
  text,
  tags,
  onOpen,
  onOpenRef,
}: MemoryProps & {
  text: string;
  onOpen?: () => void;
  onOpenRef?: RefObject<ViewInstance | null>;
}) {
  return (
    <Card spatial>
      <Text>{text}</Text>
      <UserSummary name={uploader} detail="Written by" />
      <Tags tags={tags} />
      {onOpen ? (
        <Button
          variant="secondary"
          label="Read story"
          ref={onOpenRef}
          onPress={onOpen}
        />
      ) : null}
    </Card>
  );
}
export function SharedMomentBadge({
  evidence,
  explanation,
}: {
  evidence: 'tagged' | 'reviewed' | 'suggested';
  explanation?: string;
}) {
  return (
    <Stack gap="xs">
      <Badge
        tone={evidence === 'suggested' ? 'suggestion' : 'neutral'}
        label={
          {
            tagged: 'Explicitly tagged',
            reviewed: 'Reviewed connection',
            suggested: 'AI suggestion',
          }[evidence]
        }
      />
      {explanation ? (
        <Text variant="caption" tone="secondary">
          {explanation}
        </Text>
      ) : null}
    </Stack>
  );
}
export function MemoryBoardPreview({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  const t = useTheme();
  return (
    <Stack>
      <Text variant="heading">{title}</Text>
      <Text variant="caption" tone="secondary">
        Static layout example · scroll horizontally to inspect cards
      </Text>
      <ScrollView
        horizontal
        contentContainerStyle={{
          gap: t.component.memory.gutter,
          paddingVertical: t.primitives.space.sm,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            gap: t.component.memory.gutter,
            alignItems: 'flex-start',
          }}
        >
          {children}
        </View>
      </ScrollView>
    </Stack>
  );
}
