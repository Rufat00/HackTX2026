import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  ScrollView,
  View,
  type ScrollViewInstance,
} from 'react-native';
import type { MemoryBoard } from '@afterglow/contracts/memories';
import { Button, Feedback, Stack, Text } from '../../components/ui';
import { useTheme } from '../../theme/theme-provider';
import { MemoryPhoto } from './memory-photo';
import { createPhotoHalos } from './ambient-field';
import { MusicPlaybackProvider, SongPreview } from './music-playback';

export function MemoryCanvas({ board }: { board: MemoryBoard }) {
  return (
    <MusicPlaybackProvider
      allowedKeys={board.items
        .filter((item) => item.kind === 'SONG')
        .map(
          (item) =>
            `${item.id}:${item.song?.id ?? ''}:${item.song?.previewUrl ?? ''}`,
        )}
    >
      <Canvas board={board} />
    </MusicPlaybackProvider>
  );
}
function Canvas({ board }: { board: MemoryBoard }) {
  const t = useTheme();
  const [viewport, setViewport] = useState({ width: 1, height: 1 });
  const size = Math.max(1, Math.min(viewport.width, viewport.height));
  const scrollX = useRef(new Animated.Value(0)).current,
    scrollY = useRef(new Animated.Value(0)).current;
  const horizontal = useRef<ScrollViewInstance>(null),
    vertical = useRef<ScrollViewInstance>(null);
  const frames = board.preview?.frames ?? [],
    sections = board.preview?.sections ?? [];
  const worldWidth = Math.max(
    size,
    ...frames.map((frame) => frame.x + frame.width),
    ...sections.map((section) => section.x + section.width),
  );
  const worldHeight = Math.max(
    size,
    ...frames.map((frame) => frame.y + frame.height),
    ...sections.map((section) => section.y + section.height),
  );
  const maxX = Math.max(0, worldWidth - size),
    maxY = Math.max(0, worldHeight - size);
  useEffect(() => {
    if (size <= 1) return;
    const center = sections[0];
    const entry = center
      ? (frames.find((frame) => frame.id === center.songItemId) ??
        frames.find((frame) =>
          board.items.some(
            (item) =>
              item.id === frame.id &&
              item.contributorId === center.contributorId,
          ),
        ))
      : frames[0];
    const first = entry
      ? { x: entry.x + entry.width / 2, y: entry.y + entry.height / 2 }
      : { x: size / 2, y: size / 2 };
    const x = Math.min(maxX, Math.max(0, first.x - size / 2)),
      y = Math.min(maxY, Math.max(0, first.y - size / 2));
    scrollX.setValue(x);
    scrollY.setValue(y);
    horizontal.current?.scrollTo({ x, animated: false });
    vertical.current?.scrollTo({ y, animated: false });
    // Recenter only for a new composition or viewport, never on query refresh.
  }, [board.preview?.id, size]);
  const edgeOpacity = (axis: Animated.Value, maximum: number, far: boolean) =>
    maximum <= 1
      ? 0
      : axis.interpolate({
          inputRange: far
            ? [Math.max(0, maximum - 20), maximum]
            : [0, Math.min(20, maximum)],
          outputRange: far ? [1, 0] : [0, 1],
          extrapolate: 'clamp',
        });
  const fog = [
    {
      key: 'left',
      opacity: edgeOpacity(scrollX, maxX, false),
      style: { left: 0, top: 0, bottom: 0, width: t.component.memory.fogWidth },
      direction: 'right',
    },
    {
      key: 'right',
      opacity: edgeOpacity(scrollX, maxX, true),
      style: {
        right: 0,
        top: 0,
        bottom: 0,
        width: t.component.memory.fogWidth,
      },
      direction: 'left',
    },
    {
      key: 'top',
      opacity: edgeOpacity(scrollY, maxY, false),
      style: { left: 0, right: 0, top: 0, height: t.component.memory.fogWidth },
      direction: 'bottom',
    },
    {
      key: 'bottom',
      opacity: edgeOpacity(scrollY, maxY, true),
      style: {
        left: 0,
        right: 0,
        bottom: 0,
        height: t.component.memory.fogWidth,
      },
      direction: 'top',
    },
  ];
  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      onLayout={(event) => setViewport(event.nativeEvent.layout)}
    >
      <View
        style={{
          width: size,
          height: size,
          overflow: 'hidden',
          backgroundColor: t.semantic.background,
        }}
      >
        <Animated.ScrollView
          ref={horizontal}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true },
          )}
          contentContainerStyle={{ width: worldWidth }}
        >
          <Animated.ScrollView
            ref={vertical}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={{ width: worldWidth }}
            contentContainerStyle={{ height: worldHeight, width: worldWidth }}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true },
            )}
          >
            {createPhotoHalos(board.items, frames).map((halo) => (
              <View
                pointerEvents="none"
                accessible={false}
                key={`color-${halo.id}`}
                style={{
                  position: 'absolute',
                  left: halo.left,
                  top: halo.top,
                  width: halo.size,
                  height: halo.size,
                  backgroundImage: halo.backgroundImage,
                }}
              />
            ))}
            {sections.map((section) => (
              <View
                key={section.contributorId}
                style={{
                  position: 'absolute',
                  left: section.x,
                  top: section.y - t.primitives.space.section,
                  width: section.width,
                }}
              >
                <Text variant="heading">{section.contributorName}</Text>
              </View>
            ))}
            {frames.map((frame) => {
              const item = board.items.find((entry) => entry.id === frame.id);
              if (!item) return null;
              return (
                <View
                  key={item.id}
                  style={{
                    position: 'absolute',
                    left: frame.x,
                    top: frame.y,
                    width: frame.width,
                    height: frame.height,
                    borderRadius: t.component.memory.imageRadius,
                    overflow: 'hidden',
                    backgroundColor:
                      item.kind === 'PHOTO'
                        ? 'transparent'
                        : t.component.memory.storySurface,
                  }}
                >
                  <ScrollView
                    nestedScrollEnabled
                    contentContainerStyle={{
                      gap:
                        item.kind === 'SONG'
                          ? t.primitives.space.sm
                          : t.primitives.space.none,
                      padding:
                        item.kind === 'SONG'
                          ? t.primitives.space.lg
                          : t.primitives.space.none,
                    }}
                  >
                    {item.assetId ? (
                      <MemoryPhoto
                        boardId={board.id}
                        assetId={item.assetId}
                        publicRead={!board.canContribute}
                        style={{
                          width: '100%',
                          height: Math.max(
                            132,
                            Math.min(
                              380,
                              (frame.width * (item.height ?? 1)) /
                                (item.width ?? 1),
                            ),
                          ),
                        }}
                      />
                    ) : null}
                    {item.kind === 'SONG' ? (
                      item.song ? (
                        <Stack gap="sm">
                          <Text variant="caption" tone="secondary">
                            {item.contributorName}
                          </Text>
                          <SongPreview
                            song={item.song}
                            compact
                            playbackKey={`${item.id}:${item.song.id}:${item.song.previewUrl ?? ''}`}
                          />
                        </Stack>
                      ) : (
                        <SongLinkCard title={item.text} url={item.songUrl} />
                      )
                    ) : item.text ? (
                      <Text
                        style={
                          item.kind === 'PHOTO'
                            ? {
                                padding: t.primitives.space.none,
                                backgroundColor:
                                  t.component.memory.storySurface,
                              }
                            : undefined
                        }
                      >
                        {item.text}
                      </Text>
                    ) : null}
                  </ScrollView>
                </View>
              );
            })}
          </Animated.ScrollView>
        </Animated.ScrollView>
        {fog.map((edge) => (
          <Animated.View
            key={edge.key}
            pointerEvents="none"
            accessible={false}
            style={{
              position: 'absolute',
              ...edge.style,
              opacity: edge.opacity,
              backgroundImage: `linear-gradient(to ${edge.direction}, ${t.component.memory.fogColor}, transparent)`,
            }}
          />
        ))}
      </View>
    </View>
  );
}
function SongLinkCard({ title, url }: { title: string; url: string | null }) {
  const [error, setError] = useState('');
  return (
    <Stack>
      <Text variant="heading">{title}</Text>
      <Text variant="caption" tone="secondary">
        No preview available
      </Text>
      {url ? (
        <Button
          label="Open song"
          icon="external-link"
          variant="secondary"
          onPress={() => {
            void Linking.openURL(url).catch(() =>
              setError('Could not open this song.'),
            );
          }}
        />
      ) : null}
      <Feedback message={error} error />
    </Stack>
  );
}
