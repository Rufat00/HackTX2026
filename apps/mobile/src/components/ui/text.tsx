import { Text as NativeText, type TextProps } from 'react-native';
import {
  useTheme,
  useAccessibilityPreferences,
  type Theme,
} from '../../theme/theme-provider';
export function Text({
  variant = 'body',
  tone = 'primary',
  align = 'left',
  style,
  ...props
}: TextProps & {
  variant?: keyof Theme['primitives']['type'];
  tone?: 'primary' | 'secondary' | 'danger' | 'success' | 'inverse';
  align?: 'left' | 'center' | 'right';
}) {
  const t = useTheme(),
    { previewTextScale } = useAccessibilityPreferences(),
    type = t.primitives.type[variant];
  const color = {
    primary: t.semantic.textPrimary,
    secondary: t.semantic.textSecondary,
    danger: t.semantic.danger,
    success: t.semantic.success,
    inverse: t.semantic.onAccent,
  }[tone];
  return (
    <NativeText
      accessibilityRole={
        ['display', 'title', 'heading'].includes(variant) ? 'header' : undefined
      }
      {...props}
      allowFontScaling
      style={[
        {
          ...type,
          fontSize: type.fontSize * previewTextScale,
          lineHeight: type.lineHeight * previewTextScale,
          color,
          textAlign: align,
          flexShrink: 1,
        },
        style,
      ]}
    />
  );
}
