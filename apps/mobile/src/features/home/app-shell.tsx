import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import { Redirect, Tabs, usePathname, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { profileSchema } from '@afterglow/contracts/schemas';
import { authClient } from '../../lib/auth-client';
import { apiRequest } from '../../lib/api-client';
import { getProfileImage } from '../../lib/profile-image';
import {
  Avatar,
  Button,
  Feedback,
  IconButton,
  LoadingIndicator,
  Screen,
  Text,
} from '../../components/ui';
import { useTheme } from '../../theme/theme-provider';
import { ShellSearchContext } from './shell-context';

export function AppShell() {
  const session = authClient.useSession();
  if (session.isPending)
    return (
      <Screen>
        <LoadingIndicator label="Opening Afterglow…" />
      </Screen>
    );
  if (session.error)
    return (
      <Screen>
        <Feedback message="Could not restore your session." error />
        <Button label="Try again" onPress={() => void session.refetch()} />
      </Screen>
    );
  if (!session.data) return <Redirect href="/" />;
  return (
    <SignedInShell
      key={session.data.user.id}
      userId={session.data.user.id}
      name={session.data.user.name}
    />
  );
}

function SignedInShell({ userId, name }: { userId: string; name: string }) {
  const t = useTheme(),
    router = useRouter(),
    pathname = usePathname();
  const friends = pathname === '/friends';
  const [search, setSearch] = useState({ home: '', friends: '' });
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const inputRef = useRef<TextInputInstance>(null);
  const query = friends ? search.friends : search.home;
  const profile = useQuery({
    queryKey: ['profile', userId],
    queryFn: async ({ signal }) =>
      profileSchema.parse(await apiRequest('/api/v1/me', { signal })),
  });
  const assetId = profile.data?.profileImageAssetId;
  const image = useQuery({
    queryKey: ['profile-image', userId, assetId],
    enabled: !!assetId,
    queryFn: () => getProfileImage(assetId!),
    staleTime: 180000,
    refetchInterval: 240000,
  });
  const displayName = profile.data
    ? `${profile.data.firstName} ${profile.data.lastName}`
    : name;
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: t.semantic.background }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: t.primitives.layout.contentMaxWidth,
          alignSelf: 'center',
          paddingHorizontal: t.primitives.space.lg,
          paddingVertical: t.primitives.space.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.primitives.space.md,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: t.primitives.control.regular,
            borderRadius: t.primitives.radius.pill,
            backgroundColor: t.semantic.surfaceMuted,
            paddingHorizontal: t.primitives.space.lg,
            gap: t.primitives.space.sm,
          }}
        >
          <Feather
            name="search"
            size={t.primitives.icon.regular}
            color={t.semantic.textSecondary}
            accessible={false}
          />
          <TextInput
            ref={inputRef}
            accessibilityLabel={
              friends ? 'Search shared memories' : 'Search memories'
            }
            placeholder={friends ? 'Search shared memories' : 'Search memories'}
            placeholderTextColor={t.semantic.textSecondary}
            value={query}
            onChangeText={(value) =>
              setSearch((previous) => ({
                ...previous,
                [friends ? 'friends' : 'home']: value,
              }))
            }
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: t.primitives.control.regular,
              color: t.semantic.textPrimary,
              ...t.primitives.type.body,
            }}
          />
          {query ? (
            <IconButton
              icon="x"
              label="Clear search"
              onPress={() => {
                setSearch((previous) => ({
                  ...previous,
                  [friends ? 'friends' : 'home']: '',
                }));
                inputRef.current?.focus();
              }}
            />
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => ({
            opacity: pressed ? t.primitives.opacity.pressed : 1,
          })}
        >
          <Avatar
            name={displayName}
            source={
              image.data
                ? { uri: image.data.url, headers: image.data.headers }
                : undefined
            }
          />
        </Pressable>
      </View>
      <ShellSearchContext.Provider value={query}>
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: t.semantic.background },
            tabBarHideOnKeyboard: true,
          }}
          tabBar={({ state, emitter, navigateToTab }) =>
            keyboardVisible ? null : (
              <SafeAreaView
                edges={['bottom']}
                style={{ backgroundColor: t.semantic.background }}
              >
                <View
                  accessibilityRole="tablist"
                  style={{
                    width: '100%',
                    maxWidth: t.component.navigation.barMaxWidth,
                    alignSelf: 'center',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    paddingVertical: t.primitives.space.sm,
                  }}
                >
                  {(['home', 'add', 'friends'] as const).map((item) => {
                    const selected = state.routes[state.index]?.name === item;
                    const isAdd = item === 'add';
                    return (
                      <Pressable
                        key={item}
                        accessibilityRole={isAdd ? 'button' : 'tab'}
                        accessibilityLabel={
                          isAdd
                            ? 'Create a memory'
                            : item === 'home'
                              ? 'Home'
                              : 'Friends'
                        }
                        accessibilityState={isAdd ? {} : { selected }}
                        onPress={() => {
                          Keyboard.dismiss();
                          if (isAdd) {
                            router.push('/create');
                            return;
                          }
                          const route = state.routes.find(
                            (entry) => entry.name === item,
                          );
                          if (!route) return;
                          const event = emitter.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                          });
                          if (!event.defaultPrevented && !selected)
                            navigateToTab(route.key);
                        }}
                        style={({ pressed }) => ({
                          minWidth: t.component.navigation.addSize,
                          minHeight: t.component.navigation.addSize,
                          padding: t.primitives.space.sm,
                          borderRadius: t.primitives.radius.pill,
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: t.primitives.space.xs,
                          backgroundColor: isAdd
                            ? t.semantic.accent
                            : selected
                              ? t.semantic.surface
                              : 'transparent',
                          opacity: pressed ? t.primitives.opacity.pressed : 1,
                        })}
                      >
                        <Feather
                          name={
                            isAdd ? 'plus' : item === 'home' ? 'home' : 'users'
                          }
                          size={
                            isAdd
                              ? t.primitives.icon.large
                              : t.primitives.icon.regular
                          }
                          color={
                            isAdd
                              ? t.semantic.onAccent
                              : selected
                                ? t.semantic.textPrimary
                                : t.semantic.textSecondary
                          }
                          accessible={false}
                        />
                        {!isAdd ? (
                          <Text
                            variant="caption"
                            tone={selected ? 'primary' : 'secondary'}
                          >
                            {item === 'home' ? 'Home' : 'Friends'}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </SafeAreaView>
            )
          }
        >
          <Tabs.Screen name="home" options={{ title: 'Home' }} />
          <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
        </Tabs>
      </ShellSearchContext.Provider>
    </SafeAreaView>
  );
}
