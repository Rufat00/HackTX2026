import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { AuthFrame } from './auth-frame';
import { Redirect } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@afterglow/contracts/errors';
import { registerSchema, loginSchema } from '@afterglow/contracts/schemas';
import { resetPrivateRequests } from '../../lib/api-client';
import { authClient } from '../../lib/auth-client';
import { clientHeaders } from '../../lib/client-headers';
import {
  Screen,
  Text,
  FormTextField,
  Button,
  Feedback,
  LoadingIndicator,
} from '../../components/ui';
export function AuthScreen() {
  const session = authClient.useSession(),
    [signup, setSignup] = useState(false),
    [message, setMessage] = useState(''),
    [step, setStep] = useState<'name' | 'account'>('name');
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: { username: '', password: '', firstName: '', lastName: '' },
    validators: {
      onSubmit: ({ value }) => {
        const checked = (signup ? registerSchema : loginSchema).safeParse(
          signup
            ? value
            : { username: value.username, password: value.password },
        );
        return checked.success
          ? undefined
          : {
              fields: Object.fromEntries(
                checked.error.issues.map((i) => [i.path[0], i.message]),
              ),
            };
      },
    },
    onSubmit: async ({ value, formApi }) => {
      setMessage('');
      resetPrivateRequests();
      await queryClient.cancelQueries();
      queryClient.clear();
      try {
        if (signup) {
          const body = registerSchema.parse(value);
          const response = await authClient.$fetch('/register', {
            method: 'POST',
            body,
            headers: clientHeaders,
          });
          if (response.error) {
            const failure = response.error as unknown as Partial<ApiError>;
            if (failure.error?.fieldErrors)
              formApi.setErrorMap({
                onSubmit: {
                  fields: Object.fromEntries(
                    Object.entries(failure.error.fieldErrors).map(
                      ([key, messages]) => [key, messages.join('. ')],
                    ),
                  ),
                },
              });
            setMessage(
              failure.error?.message ??
                'Account could not be created. Try another username or retry.',
            );
            return;
          }
        } else {
          const result = await authClient.signIn.username(
            loginSchema.parse({
              username: value.username,
              password: value.password,
            }),
            { headers: clientHeaders },
          );
          if (result.error) {
            setMessage('Username or password is incorrect. You can retry.');
            return;
          }
        }
        await authClient.getSession({ query: { disableCookieCache: true } });
        formApi.reset();
      } catch {
        setMessage('Could not connect. Your entries are preserved; try again.');
      }
    },
  });
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (form.state.isSubmitting) return true;
        if (!signup) return false;
        setMessage('');
        form.setErrorMap({ onSubmit: undefined });
        if (step === 'account') setStep('name');
        else setSignup(false);
        return true;
      },
    );
    return () => subscription.remove();
  }, [signup, step, form]);
  if (session.isPending)
    return (
      <Screen>
        <LoadingIndicator label="Restoring your session…" />
      </Screen>
    );
  if (session.error)
    return (
      <Screen>
        <Text variant="display">Connect to Afterglow</Text>
        <Feedback error message="Could not check your session." />
        <Button label="Try again" onPress={() => void session.refetch()} />
      </Screen>
    );
  if (session.data) return <Redirect href="/home" />;
  const namesStep = signup && step === 'name';
  const names = namesStep
    ? (['firstName', 'lastName'] as const)
    : (['username', 'password'] as const);
  function nextStep() {
    const checked = registerSchema
      .pick({ firstName: true, lastName: true })
      .safeParse(form.state.values);
    if (!checked.success) {
      form.setErrorMap({
        onSubmit: {
          fields: Object.fromEntries(
            checked.error.issues.map((issue) => [issue.path[0], issue.message]),
          ),
        },
      });
      return;
    }
    form.setErrorMap({ onSubmit: undefined });
    setStep('account');
  }
  return (
    <form.Subscribe selector={(s) => s.isSubmitting}>
      {(pending) => (
        <AuthFrame
          title={signup ? (namesStep ? 'Your name' : 'Your account') : 'Log in'}
          onBack={
            signup
              ? () => {
                  if (pending) return;
                  setMessage('');
                  form.setErrorMap({ onSubmit: undefined });
                  if (step === 'account') setStep('name');
                  else setSignup(false);
                }
              : undefined
          }
          backDisabled={pending}
          footer={
            <>
              <Button
                label={
                  namesStep ? 'Continue' : signup ? 'Create account' : 'Log in'
                }
                icon="arrow-right"
                pending={pending}
                onPress={() =>
                  namesStep ? nextStep() : void form.handleSubmit()
                }
              />
              <Button
                label={
                  signup
                    ? 'Already here? Log in'
                    : 'New here? Create an account'
                }
                variant="ghost"
                disabled={pending}
                onPress={() => {
                  setSignup((value) => !value);
                  setStep('name');
                  setMessage('');
                  form.setErrorMap({ onSubmit: undefined });
                }}
              />
            </>
          }
        >
          {names.map((name, index) => (
            <form.Field key={name} name={name}>
              {(field) => (
                <FormTextField
                  field={field}
                  variant="quiet"
                  editable={!pending}
                  kind={
                    name === 'password'
                      ? 'password'
                      : name === 'username'
                        ? 'username'
                        : 'name'
                  }
                  label={
                    {
                      username: 'Username',
                      password: 'Password',
                      firstName: 'First name',
                      lastName: 'Last name',
                    }[name]
                  }
                  placeholder={
                    {
                      username: 'Your username',
                      password: signup
                        ? 'At least 12 characters'
                        : 'Your password',
                      firstName: 'First name',
                      lastName: 'Last name',
                    }[name]
                  }
                  textContentType={
                    name === 'password'
                      ? signup
                        ? 'newPassword'
                        : 'password'
                      : name === 'username'
                        ? 'username'
                        : name === 'firstName'
                          ? 'givenName'
                          : 'familyName'
                  }
                  autoComplete={
                    name === 'password'
                      ? signup
                        ? 'new-password'
                        : 'current-password'
                      : name === 'username'
                        ? 'username'
                        : name === 'firstName'
                          ? 'given-name'
                          : 'family-name'
                  }
                  returnKeyType={
                    index === names.length - 1
                      ? namesStep
                        ? 'next'
                        : 'go'
                      : 'next'
                  }
                  onSubmitEditing={
                    index === names.length - 1
                      ? () => {
                          if (!pending) {
                            if (namesStep) nextStep();
                            else void form.handleSubmit();
                          }
                        }
                      : undefined
                  }
                />
              )}
            </form.Field>
          ))}
          <Feedback message={message} error />
        </AuthFrame>
      )}
    </form.Subscribe>
  );
}
