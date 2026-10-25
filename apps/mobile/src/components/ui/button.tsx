import { forwardRef, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, type ViewInstance } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../../theme/theme-provider';
import { Text } from './text';
export type IconName = ComponentProps<typeof Feather>['name'];
export const Button = forwardRef<
  ViewInstance,
  {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    pending?: boolean;
    disabled?: boolean;
    icon?: IconName;
  }
>(function Button(
  {
    label,
    onPress,
    variant = 'primary',
    pending = false,
    disabled = false,
    icon,
  },
  ref,
) {
  const t = useTheme(),
    [focused, setFocused] = useState(false),
    blocked = disabled || pending,
    filled = variant === 'primary' || variant === 'danger',
    color = filled ? t.semantic.onAccent : t.semantic.textPrimary;
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy: pending }}
      disabled={blocked}
      onPress={() => {
        if (!blocked) onPress();
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => ({
        minHeight: t.component.button.minHeight,
        paddingHorizontal: t.component.button.paddingX,
        paddingVertical: t.component.button.paddingY,
        borderRadius: t.component.button.radius,
        backgroundColor:
          variant === 'danger'
            ? t.semantic.danger
            : variant === 'primary'
              ? t.semantic.accent
              : variant === 'secondary'
                ? t.semantic.surface
                : 'transparent',
        borderWidth: t.primitives.border.focus,
        borderColor: focused ? t.semantic.focus : 'transparent',
        opacity: blocked
          ? t.primitives.opacity.disabled
          : pressed
            ? t.primitives.opacity.pressed
            : 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.primitives.space.sm,
      })}
    >
      {pending ? (
        <ActivityIndicator color={color} />
      ) : icon ? (
        <Feather name={icon} size={t.primitives.icon.regular} color={color} />
      ) : null}
      <Text variant="label" style={{ color, textAlign: 'center' }}>
        {pending ? `${label}…` : label}
      </Text>
    </Pressable>
  );
});
export const IconButton = forwardRef<
  ViewInstance,
  {
    label: string;
    icon: IconName;
    onPress: () => void;
    disabled?: boolean;
    variant?: 'default' | 'primary';
  }
>(function IconButton(
  { label, icon, onPress, disabled = false, variant = 'default' },
  ref,
) {
  const t = useTheme(),
    [focused, setFocused] = useState(false);
  return (
    <Pressable
      ref={ref}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        if (!disabled) onPress();
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => ({
        minWidth: t.primitives.control.touch,
        minHeight: t.primitives.control.touch,
        padding: t.primitives.space.sm,
        borderRadius: t.primitives.radius.pill,
        borderWidth: t.primitives.border.focus,
        borderColor: focused ? t.semantic.focus : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
          variant === 'primary' ? t.semantic.accent : t.semantic.surface,
        opacity: disabled
          ? t.primitives.opacity.disabled
          : pressed
            ? t.primitives.opacity.pressed
            : 1,
      })}
    >
      <Feather
        accessible={false}
        name={icon}
        size={t.primitives.icon.regular}
        color={
          variant === 'primary' ? t.semantic.onAccent : t.semantic.textPrimary
        }
      />
    </Pressable>
  );
});
