import { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '../../theme/theme-provider';
import { useForm } from '@tanstack/react-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { fetch as expoFetch } from 'expo/fetch';
import { readUploadImage } from '../../lib/upload-image';
import { clientHeaders } from '../../lib/client-headers';
import { readApiResponse } from '../../lib/api-response';
import { getProfileImage } from '../../lib/profile-image';
import {
  profileSchema,
  updateProfileSchema,
  uploadIntentResponseSchema,
  type Profile,
} from '@afterglow/contracts/schemas';
import { authClient, apiURL } from '../../lib/auth-client';
import {
  apiRequest,
  ApiFailure,
  resetPrivateRequests,
} from '../../lib/api-client';
import {
  Screen,
  Text,
  FormTextField,
  Button,
  Feedback,
  LoadingIndicator,
  IconButton,
  Surface,
  Stack,
} from '../../components/ui';
import { ProfileHeader } from '../../components/widgets';
export function ProfileScreen() {
  const session = authClient.useSession();
  if (session.isPending)
    return (
      <Screen header={<ProfileNavigation />}>
        <LoadingIndicator label="Restoring your session…" />
      </Screen>
    );
  if (session.error)
    return (
      <Screen header={<ProfileNavigation />}>
        <Feedback error message="Could not restore your session." />
        <Button label="Try again" onPress={() => void session.refetch()} />
      </Screen>
    );
  if (!session.data) return <Redirect href="/" />;
  return (
    <ProfileContent key={session.data.user.id} userId={session.data.user.id} />
  );
}
function ProfileContent({ userId }: { userId: string }) {
  const client = useQueryClient(),
    [message, setMessage] = useState(''),
    [imageFailed, setImageFailed] = useState(false),
    [loggingOut, setLoggingOut] = useState(false);
  const profile = useQuery({
    queryKey: ['profile', userId],
    queryFn: async ({ signal }) =>
      profileSchema.parse(await apiRequest('/api/v1/me', { signal })),
  });
  useEffect(() => {
    if (
      profile.error instanceof ApiFailure &&
      profile.error.detail.code === 'unauthenticated'
    ) {
      client.clear();
      void authClient.getSession({ query: { disableCookieCache: true } });
    }
  }, [profile.error, client]);
  const access = useQuery({
    queryKey: ['profile-image', userId, profile.data?.profileImageAssetId],
    enabled: !!profile.data?.profileImageAssetId,
    queryFn: () => getProfileImage(profile.data!.profileImageAssetId!),
    staleTime: 180000,
    refetchInterval: 240000,
  });
  useEffect(() => setImageFailed(false), [access.data?.url]);
  const upload = useMutation({
    mutationFn: async () => {
      const selected = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (selected.canceled) return null;
      const image = selected.assets[0]!;
      const { body, mime, byteSize } = await readUploadImage(image.uri);
      setMessage('Uploading photo…');
      const intent = uploadIntentResponseSchema.parse(
        await apiRequest('/api/v1/uploads', {
          method: 'POST',
          body: JSON.stringify({ mime, byteSize }),
        }),
      );
      const response = await expoFetch(
        `${apiURL}/api/v1/assets/${intent.assetId}/source`,
        {
          method: 'POST',
          headers: {
            ...intent.requiredHeaders,
            Cookie: (await authClient.getCookie()) ?? '',
            ...clientHeaders,
          },
          body,
        },
      );
      await readApiResponse(response);
      setMessage('Checking and saving photo…');
      return profileSchema.parse(
        await apiRequest(`/api/v1/assets/${intent.assetId}/complete`, {
          method: 'POST',
          body: '{}',
        }),
      );
    },
    onSuccess: (value) => {
      if (value) {
        client.setQueryData(['profile', userId], value);
        setMessage('Photo saved.');
      } else setMessage('');
    },
    onError: (error) => setMessage(error.message),
  });
  async function logout() {
    setLoggingOut(true);
    setMessage('');
    resetPrivateRequests();
    try {
      await client.cancelQueries();
      const result = await authClient.signOut({
        fetchOptions: { headers: clientHeaders },
      });
      if (result.error) throw new Error('Could not sign out. Try again.');
      client.clear();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not sign out. Try again.',
      );
    } finally {
      setLoggingOut(false);
    }
  }
  if (profile.isPending)
    return (
      <Screen header={<ProfileNavigation />}>
        <LoadingIndicator label="Loading your profile…" />
      </Screen>
    );
  if (profile.isError)
    return (
      <Screen header={<ProfileNavigation />}>
        <Feedback error message={profile.error.message} />
        <Button label="Try again" onPress={() => void profile.refetch()} />
        <Button
          label="Sign out"
          pending={loggingOut}
          onPress={() => void logout()}
        />
      </Screen>
    );
  const value = profile.data;
  return (
    <Screen header={<ProfileNavigation />}>
      <ProfileHeader
        name={`${value.firstName} ${value.lastName}`}
        username={value.username}
        source={
          access.data && !imageFailed
            ? { uri: access.data.url, headers: access.data.headers }
            : undefined
        }
        onImageError={() => setImageFailed(true)}
      />
      {(imageFailed || access.isError) && (
        <Button
          label="Reload photo"
          onPress={() => {
            setImageFailed(false);
            void access.refetch();
          }}
        />
      )}
      <Button
        label={
          value.profileImageAssetId ? 'Replace photo' : 'Add optional photo'
        }
        variant="secondary"
        icon="camera"
        pending={upload.isPending}
        disabled={loggingOut}
        onPress={() => {
          setMessage('');
          upload.mutate();
        }}
      />
      <Surface padding="xl">
        <Stack gap="xl">
          <Text variant="heading">A little about you</Text>
          <ProfileEditor
            profile={value}
            disabled={upload.isPending || loggingOut}
          />
        </Stack>
      </Surface>
      <Feedback message={message} error={upload.isError} />
      <Button
        label="Sign out"
        variant="ghost"
        pending={loggingOut}
        disabled={upload.isPending}
        onPress={() => void logout()}
      />
    </Screen>
  );
}
function ProfileEditor({
  profile,
  disabled,
}: {
  profile: Profile;
  disabled: boolean;
}) {
  const client = useQueryClient(),
    [message, setMessage] = useState('');
  const form = useForm({
    defaultValues: { firstName: profile.firstName, lastName: profile.lastName },
    validators: { onSubmit: updateProfileSchema },
    onSubmit: async ({ value, formApi }) => {
      setMessage('');
      try {
        const saved = profileSchema.parse(
          await apiRequest('/api/v1/me', {
            method: 'PATCH',
            body: JSON.stringify(value),
          }),
        );
        client.setQueryData(['profile', profile.id], saved);
        formApi.reset({ firstName: saved.firstName, lastName: saved.lastName });
        setMessage('Profile saved.');
      } catch (error) {
        if (error instanceof ApiFailure && error.detail.fieldErrors) {
          formApi.setErrorMap({
            onSubmit: {
              fields: Object.fromEntries(
                Object.entries(error.detail.fieldErrors).map(
                  ([key, messages]) => [key, messages.join('. ')],
                ),
              ),
            },
          });
        }
        setMessage(
          error instanceof Error ? error.message : 'Could not save. Try again.',
        );
      }
    },
  });
  return (
    <>
      {(['firstName', 'lastName'] as const).map((name) => (
        <form.Field key={name} name={name}>
          {(field) => (
            <FormTextField
              field={field}
              label={name === 'firstName' ? 'First name' : 'Last name'}
              autoCapitalize="words"
              textContentType={
                name === 'firstName' ? 'givenName' : 'familyName'
              }
            />
          )}
        </form.Field>
      ))}
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(pending) => (
          <Button
            label="Save profile"
            pending={pending}
            disabled={disabled}
            onPress={() => void form.handleSubmit()}
          />
        )}
      </form.Subscribe>
      <Feedback message={message} />
    </>
  );
}

function ProfileNavigation() {
  const t = useTheme(),
    router = useRouter();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: t.primitives.space.lg,
      }}
    >
      <IconButton
        icon="arrow-left"
        label="Back to home"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace('/home')
        }
      />
      <Text variant="heading">Your profile</Text>
      <View style={{ width: t.primitives.control.touch }} />
    </View>
  );
}
