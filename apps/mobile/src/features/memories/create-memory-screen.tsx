import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import { createBoardSchema } from '@afterglow/contracts/memories';
import { apiRequest } from '../../lib/api-client';
import { Button, Feedback, FormTextField, Screen } from '../../components/ui';
import { useTheme } from '../../theme/theme-provider';
import { MemoryHeader } from './memory-header';
import { newMemoryId, useRefreshMemories } from './memory-queries';

export function CreateMemoryScreen() {
  const router = useRouter(),
    t = useTheme(),
    refresh = useRefreshMemories(),
    id = useRef(newMemoryId());
  const [error, setError] = useState('');
  const form = useForm({
    defaultValues: { title: '', eventDate: '' },
    validators: {
      onSubmit: ({ value }) => {
        const checked = createBoardSchema.safeParse({
          id: id.current,
          title: value.title.trim() || 'Untitled memory',
          eventDate: value.eventDate.trim() || null,
        });
        return checked.success
          ? undefined
          : {
              fields: Object.fromEntries(
                checked.error.issues.map((issue) => [
                  issue.path[0],
                  issue.message,
                ]),
              ),
            };
      },
    },
    onSubmit: async ({ value }) => {
      setError('');
      try {
        const input = createBoardSchema.parse({
          id: id.current,
          title: value.title.trim() || 'Untitled memory',
          eventDate: value.eventDate.trim() || null,
        });
        await apiRequest('/api/v1/boards', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        await refresh();
        router.replace({
          pathname: '/memory/[id]',
          params: { id: id.current },
        });
      } catch (failure) {
        setError(
          failure instanceof Error
            ? failure.message
            : 'Could not save your draft. Try again.',
        );
      }
    },
  });
  return (
    <Screen
      header={<MemoryHeader title="New memory" />}
      contentStyle={{
        flexGrow: 1,
        padding: t.primitives.space.xl,
        gap: t.primitives.space.xxl,
      }}
    >
      <form.Field name="title">
        {(field) => (
          <FormTextField
            field={field}
            variant="quiet"
            label="Title · optional"
            placeholder="That weekend together"
            maxLength={80}
          />
        )}
      </form.Field>
      <form.Field name="eventDate">
        {(field) => (
          <FormTextField
            field={field}
            variant="quiet"
            label="Date · optional"
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
          />
        )}
      </form.Field>
      <Feedback message={error} error />
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(pending) => (
          <Button
            label="Continue"
            icon="arrow-right"
            pending={pending}
            onPress={() => void form.handleSubmit()}
          />
        )}
      </form.Subscribe>
    </Screen>
  );
}
