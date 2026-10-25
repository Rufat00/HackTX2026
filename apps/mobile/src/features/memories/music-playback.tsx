import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, Image, Linking, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import type { CatalogSong } from '@afterglow/contracts/music';
import { Feedback, IconButton, Stack, Text } from '../../components/ui';
import { useTheme } from '../../theme/theme-provider';

const PlaybackContext = createContext<{
  activeId: string | null;
  playing: boolean;
  loading: boolean;
  currentTime: number;
  duration: number;
  error: string;
  toggle: (song: CatalogSong, key: string) => void;
} | null>(null);
export function MusicPlaybackProvider({
  children,
  allowedKeys,
}: PropsWithChildren<{ allowedKeys?: string[] }>) {
  const player = useAudioPlayer(null, {
    updateInterval: 500,
    downloadFirst: false,
  });
  const status = useAudioPlayerStatus(player);
  const [activeId, setActiveId] = useState<string | null>(null),
    [error, setError] = useState('');
  useFocusEffect(
    useCallback(
      () => () => {
        try {
          player.pause();
        } catch {
          /* The hook may already have released this player. */
        }
      },
      [player],
    ),
  );
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active') player.pause();
    });
    return () => listener.remove();
  }, [player]);
  useEffect(() => {
    if (!activeId || status.isLoaded) return;
    const timer = setTimeout(() => {
      player.pause();
      setError('Preview unavailable. Try again.');
    }, 12000);
    return () => clearTimeout(timer);
  }, [activeId, status.isLoaded, player]);
  useEffect(() => {
    if (activeId && allowedKeys && !allowedKeys.includes(activeId)) {
      player.pause();
      player.replace(null);
      setActiveId(null);
      setError('');
    }
  }, [activeId, allowedKeys, player]);
  async function toggle(song: CatalogSong, key: string) {
    if (!song.previewUrl) return;
    setError('');
    try {
      if (activeId === key && status.playing) {
        player.pause();
        return;
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      });
      if (activeId !== key || status.error || error) {
        player.pause();
        player.replace({ uri: song.previewUrl });
        setActiveId(key);
      } else if (
        status.didJustFinish ||
        (status.duration > 0 && status.currentTime >= status.duration - 0.1)
      )
        await player.seekTo(0);
      player.play();
    } catch {
      setError('Could not play this preview. Try again.');
    }
  }
  return (
    <PlaybackContext.Provider
      value={{
        activeId,
        playing: status.playing,
        loading:
          !!activeId &&
          (!status.isLoaded || status.isBuffering) &&
          !error &&
          !status.error,
        currentTime: status.currentTime,
        duration: status.duration,
        error:
          error ||
          (status.error ? 'Preview unavailable. Try another song.' : ''),
        toggle: (song, key) => void toggle(song, key),
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
}
export function SongPreview({
  song,
  compact = false,
  minimal = false,
  playbackKey,
}: {
  song: CatalogSong;
  compact?: boolean;
  minimal?: boolean;
  playbackKey?: string;
}) {
  const playback = useContext(PlaybackContext),
    t = useTheme(),
    [linkError, setLinkError] = useState('');
  if (!playback) return null;
  const key = playbackKey ?? song.id;
  const active = playback.activeId === key;
  return (
    <Stack gap="sm">
      <View
        style={{
          flexDirection: 'row',
          gap: t.primitives.space.md,
          alignItems: 'center',
        }}
      >
        {song.artworkUrl ? (
          <Image
            source={{ uri: song.artworkUrl }}
            accessibilityLabel={`${song.title} artwork`}
            style={{
              width: compact
                ? t.primitives.control.regular
                : t.component.memory.songArtworkSize,
              height: compact
                ? t.primitives.control.regular
                : t.component.memory.songArtworkSize,
              borderRadius: t.primitives.radius.small,
            }}
          />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text variant={compact ? 'label' : 'heading'}>{song.title}</Text>
          <Text variant="caption" tone="secondary">
            {song.artist}
          </Text>
        </View>
        {song.previewUrl ? (
          <IconButton
            label={
              active && playback.playing
                ? `Pause ${song.title}`
                : `Play preview of ${song.title}`
            }
            icon={active && playback.playing ? 'pause' : 'play'}
            variant="primary"
            disabled={active && playback.loading}
            onPress={() => playback.toggle(song, key)}
          />
        ) : null}
      </View>
      {!minimal || active || !song.previewUrl ? (
        <Text variant="caption" tone="secondary">
          {!song.previewUrl
            ? 'No preview available'
            : active && playback.loading
              ? 'Loading preview…'
              : active
                ? `${Math.floor(playback.currentTime)} / ${Math.floor(playback.duration)}s · Preview`
                : 'Preview'}
        </Text>
      ) : null}
      {active ? <Feedback error message={playback.error} /> : null}
      <Text
        variant="caption"
        tone="secondary"
        accessibilityRole="link"
        onPress={() => {
          setLinkError('');
          void Linking.openURL(song.storeUrl).catch(() =>
            setLinkError('Could not open Apple Music. Try again.'),
          );
        }}
      >
        Apple Music ↗
      </Text>
      <Feedback error message={linkError} />
      {!minimal ? (
        <Text variant="caption" tone="secondary">
          Preview provided courtesy of iTunes
        </Text>
      ) : null}
    </Stack>
  );
}
