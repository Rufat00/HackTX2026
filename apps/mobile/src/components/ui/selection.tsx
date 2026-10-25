import { useState } from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '../../theme/theme-provider';
import { Inline } from './layout';
import { Text } from './text';
export function Chip({
  label,
  selected = false,
  disabled = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={() => {
        if (!disabled) onPress();
      }}
      style={({ pressed }) => ({
        minHeight: t.component.chip.minHeight,
        paddingHorizontal: t.component.chip.paddingX,
        paddingVertical: t.primitives.space.md,
        borderRadius: t.component.chip.radius,
        backgroundColor: selected ? t.semantic.selected : t.semantic.surface,
        borderWidth: t.primitives.border.focus,
        borderColor: focused ? t.semantic.focus : t.semantic.border,
        justifyContent: 'center',
        opacity: disabled
          ? t.primitives.opacity.disabled
          : pressed
            ? t.primitives.opacity.pressed
            : 1,
      })}
    >
      <Text variant="label" tone={selected ? 'inverse' : 'primary'}>
        {selected ? '✓ ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}
export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTheme();
  const [focused, setFocused] = useState<string | null>(null);
  return (
    <Inline>
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: option.value === value }}
          onFocus={() => setFocused(option.value)}
          onBlur={() => setFocused(null)}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => ({
            borderWidth: t.primitives.border.focus,
            borderColor:
              focused === option.value ? t.semantic.focus : t.semantic.border,
            minHeight: t.primitives.control.touch,
            padding: t.primitives.space.md,
            borderRadius: t.primitives.radius.pill,
            backgroundColor:
              option.value === value ? t.semantic.selected : t.semantic.surface,
            opacity: pressed ? t.primitives.opacity.pressed : 1,
          })}
        >
          <Text
            variant="label"
            tone={option.value === value ? 'inverse' : 'primary'}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </Inline>
  );
}
