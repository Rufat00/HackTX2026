// Host-level checks exercise real component contracts. Native layout/focus still require devices.
import { createElement, type ReactNode } from 'react';
import { createRequire } from 'node:module';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const captured = vi.hoisted(() => ({
  modals: [] as { onRequestClose: () => void; animationType: string }[],
  presses: [] as { onPress?: () => void; disabled?: boolean }[],
  inputs: [] as Record<string, unknown>[],
}));
vi.mock('react-native', async () => {
  const React = await import('react');
  const host =
    (tag: string) =>
    ({ children }: { children?: ReactNode }) =>
      React.createElement(tag, null, children);
  return {
    Platform: {
      OS: 'android',
      select: (options: Record<string, unknown>) =>
        options.android ?? options.default,
    },
    Modal: ({
      children,
      ...props
    }: {
      children?: ReactNode;
      onRequestClose: () => void;
      animationType: string;
    }) => {
      captured.modals.push(props);
      return React.createElement('dialog', null, children);
    },
    ScrollView: host('article'),
    KeyboardAvoidingView: host('main'),
    Text: host('span'),
    View: host('section'),
    ActivityIndicator: host('progress'),
    Pressable: ({
      children,
      ...props
    }: {
      children?: ReactNode;
      onPress?: () => void;
      disabled?: boolean;
      accessibilityState?: unknown;
    }) => {
      captured.presses.push(props);
      return React.createElement(
        'button',
        {
          disabled: props.disabled,
          'data-state': JSON.stringify(props.accessibilityState),
        },
        children,
      );
    },
    TextInput: (props: Record<string, unknown>) => {
      captured.inputs.push(props);
      return React.createElement('input', {
        'aria-label': props.accessibilityLabel as string,
      });
    },
  };
});
vi.mock('react-native-safe-area-context', async () => {
  const React = await import('react');
  return {
    SafeAreaView: ({ children }: { children?: ReactNode }) =>
      React.createElement('main', null, children),
  };
});
vi.mock('@expo/vector-icons/Feather', async () => {
  const React = await import('react');
  return { default: () => React.createElement('i') };
});
import { Button } from './button';
import { FormTextField } from './form-field';
import { PasswordField } from './fields';
import { Chip } from './selection';
import { ConfirmDialog, Sheet } from './overlays';
import { SharedMomentBadge } from '../widgets/memory-cards';
const { renderToStaticMarkup } = createRequire(import.meta.url)(
  'react-dom/server',
) as { renderToStaticMarkup: (node: ReactNode) => string };
beforeEach(() => {
  captured.modals = [];
  captured.presses = [];
  captured.inputs = [];
});
describe('native component contracts through inert hosts', () => {
  it.each([{ pending: true }, { disabled: true }])(
    'prevents duplicate/disabled writes for %j',
    (props) => {
      const onPress = vi.fn();
      const html = renderToStaticMarkup(
        createElement(Button, { label: 'Save', onPress, ...props }),
      );
      expect(html).toContain('disabled');
      captured.presses[0]!.onPress!();
      expect(onPress).not.toHaveBeenCalled();
    },
  );
  it('invokes an enabled action once', () => {
    const onPress = vi.fn();
    renderToStaticMarkup(createElement(Button, { label: 'Save', onPress }));
    captured.presses[0]!.onPress!();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('defaults password entry to secure and provides a reveal action', () => {
    renderToStaticMarkup(
      createElement(PasswordField, {
        label: 'Password',
        textContentType: 'newPassword',
      }),
    );
    expect(captured.inputs[0]).toMatchObject({
      secureTextEntry: true,
      textContentType: 'newPassword',
      accessibilityLabel: 'Password',
    });
    expect(captured.presses).toHaveLength(1);
  });
  it('preserves input and field errors through the shared adapter', () => {
    const change = vi.fn(),
      blur = vi.fn();
    const html = renderToStaticMarkup(
      createElement(FormTextField, {
        label: 'Username',
        kind: 'username',
        field: {
          state: {
            value: 'Sofía',
            meta: { errors: [{ message: 'Already taken' }] },
          },
          handleChange: change,
          handleBlur: blur,
        },
      }),
    );
    expect(captured.inputs[0]).toMatchObject({
      value: 'Sofía',
      autoCapitalize: 'none',
      autoCorrect: false,
    });
    expect(html).toContain('Already taken');
    (captured.inputs[0]!.onChangeText as (value: string) => void)('new-name');
    expect(change).toHaveBeenCalledWith('new-name');
  });
  it('exposes selected checks independently of color', () => {
    const html = renderToStaticMarkup(
      createElement(Chip, {
        label: 'Amara',
        selected: true,
        onPress: () => {},
      }),
    );
    expect(html).toContain('✓');
    expect(html).toContain('&quot;checked&quot;:true');
  });
  it('keeps reviewed tags and AI suggestions distinct', () => {
    const suggested = renderToStaticMarkup(
      createElement(SharedMomentBadge, {
        evidence: 'suggested',
        explanation: 'Unreviewed semantic relation',
      }),
    );
    const tagged = renderToStaticMarkup(
      createElement(SharedMomentBadge, { evidence: 'tagged' }),
    );
    expect(suggested).toContain('AI suggestion');
    expect(suggested).not.toContain('Explicitly tagged');
    expect(tagged).toContain('Explicitly tagged');
    expect(tagged).not.toContain('AI suggestion');
  });
});

it('allows native Back on sheets and uses a reduced-motion-safe default', () => {
  const onClose = vi.fn();
  renderToStaticMarkup(
    createElement(Sheet, { visible: true, title: 'Detail', onClose }, 'Body'),
  );
  expect(captured.modals[0]!.animationType).toBe('none');
  captured.modals[0]!.onRequestClose();
  expect(onClose).toHaveBeenCalledTimes(1);
});
it('blocks native Back and destructive confirmation while pending', () => {
  const onClose = vi.fn(),
    onConfirm = vi.fn();
  renderToStaticMarkup(
    createElement(ConfirmDialog, {
      visible: true,
      title: 'Remove?',
      message: 'Local fixture',
      confirmLabel: 'Remove',
      pending: true,
      onClose,
      onConfirm,
    }),
  );
  captured.modals[0]!.onRequestClose();
  for (const button of captured.presses) button.onPress?.();
  expect(onClose).not.toHaveBeenCalled();
  expect(onConfirm).not.toHaveBeenCalled();
});
