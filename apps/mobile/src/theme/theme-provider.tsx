import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { AccessibilityInfo } from 'react-native';
import { lightTheme } from './tokens.generated';
export interface SemanticTheme {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  accent: string;
  onAccent: string;
  selected: string;
  onSelected: string;
  border: string;
  controlBorder: string;
  focus: string;
  danger: string;
  dangerSurface: string;
  success: string;
  successSurface: string;
  suggestion: string;
  suggestionSurface: string;
  overlay: string;
}
export interface Theme {
  scheme: string;
  primitives: typeof lightTheme.primitives;
  semantic: SemanticTheme;
  component: typeof lightTheme.component;
}
const ThemeContext = createContext<{
  theme: Theme;
  reducedMotion: boolean;
  previewTextScale: number;
}>({
  theme: lightTheme,
  reducedMotion: true,
  previewTextScale: 1,
});
export function ThemeProvider({
  children,
  previewTextScale = 1,
  appearance = 'light',
}: PropsWithChildren<{
  previewTextScale?: number;
  appearance?: 'light' | 'editor' | 'memory';
}>) {
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReducedMotion(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return (
    <ThemeContext.Provider
      value={{
        theme:
          appearance !== 'light'
            ? {
                ...lightTheme,
                semantic: {
                  ...lightTheme.semantic,
                  background: lightTheme.component.editor.background,
                  surface: lightTheme.component.editor.surface,
                  surfaceMuted: lightTheme.component.editor.surface,
                  surfaceElevated: lightTheme.component.editor.surface,
                  textPrimary: lightTheme.component.editor.text,
                  textSecondary: lightTheme.component.editor.secondary,
                  danger: lightTheme.primitives.color.red50,
                  border: lightTheme.component.editor.border,
                  controlBorder: lightTheme.component.editor.border,
                  accent: lightTheme.component.editor.text,
                  onAccent: lightTheme.component.editor.background,
                },
              }
            : lightTheme,
        reducedMotion,
        previewTextScale,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  return useContext(ThemeContext).theme;
}
export function useAccessibilityPreferences() {
  const { reducedMotion, previewTextScale } = useContext(ThemeContext);
  return { reducedMotion, previewTextScale };
}
