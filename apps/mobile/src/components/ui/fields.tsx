import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../../theme/theme-provider';
import { Stack } from './layout';
import { Text } from './text';
import { IconButton } from './button';
export function FormError({ message }: { message?: string }) {
  return message ? (
    <Text
      tone="danger"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {message}
    </Text>
  ) : null;
}
export function Field({
  label,
  hint,
  error,
  children,
  quiet = false,
}: PropsWithChildren<{
  label: string;
  hint?: string;
  error?: string;
  quiet?: boolean;
}>) {
  return (
    <Stack gap="sm">
      <Text
        variant={quiet ? 'caption' : 'label'}
        tone={quiet ? 'secondary' : 'primary'}
      >
        {label}
      </Text>
      {children}
      {error ? (
        <FormError message={error} />
      ) : hint ? (
        <Text variant="caption" tone="secondary">
          {hint}
        </Text>
      ) : null}
    </Stack>
  );
}
export type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
  variant?: 'default' | 'quiet';
};
export function TextField({
  label,
  hint,
  error,
  trailing,
  style,
  onFocus,
  onBlur,
  editable = true,
  variant = 'default',
  ...props
}: TextFieldProps) {
  const t = useTheme(),
    [focused, setFocused] = useState(false);
  return (
    <Field label={label} hint={hint} error={error} quiet={variant === 'quiet'}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor:
            variant === 'quiet' ? 'transparent' : t.semantic.surface,
          borderRadius:
            variant === 'quiet'
              ? t.primitives.space.none
              : t.component.field.radius,
          borderWidth: variant === 'quiet' ? 0 : t.primitives.border.focus,
          borderBottomWidth:
            variant === 'quiet'
              ? t.primitives.border.hairline
              : t.primitives.border.focus,
          borderColor: error
            ? t.semantic.danger
            : focused
              ? t.semantic.focus
              : variant === 'quiet'
                ? t.semantic.border
                : t.semantic.controlBorder,
          opacity: editable ? 1 : t.primitives.opacity.disabled,
        }}
      >
        <TextInput
          {...props}
          editable={editable}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={t.semantic.textSecondary}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            {
              flex: 1,
              minWidth: 0,
              minHeight: t.component.field.minHeight,
              padding:
                variant === 'quiet'
                  ? t.primitives.space.none
                  : t.component.field.padding,
              paddingVertical:
                variant === 'quiet'
                  ? t.primitives.space.sm
                  : t.component.field.padding,
              color: t.semantic.textPrimary,
              ...t.primitives.type[variant === 'quiet' ? 'title' : 'body'],
              textAlignVertical: props.multiline ? 'top' : 'center',
            },
            style,
          ]}
        />
        {trailing}
      </View>
    </Field>
  );
}
export function PasswordField(
  props: Omit<TextFieldProps, 'secureTextEntry' | 'trailing'>,
) {
  const [revealed, setRevealed] = useState(false);
  return (
    <TextField
      {...props}
      secureTextEntry={!revealed}
      trailing={
        <IconButton
          label={revealed ? 'Hide password' : 'Show password'}
          icon={revealed ? 'eye-off' : 'eye'}
          disabled={props.editable === false}
          onPress={() => setRevealed((value) => !value)}
        />
      }
    />
  );
}
