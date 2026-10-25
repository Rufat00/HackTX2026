import {
  useEffect,
  useRef,
  type PropsWithChildren,
  type RefObject,
} from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  View,
  type ViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAccessibilityPreferences,
  useTheme,
} from '../../theme/theme-provider';
import { Text } from './text';
import { Button, IconButton } from './button';
import { Stack } from './layout';
type FocusRef = RefObject<ViewInstance | null>;
type OverlayProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
  returnFocusRef?: FocusRef;
  dialog?: boolean;
  pending?: boolean;
}>;
function focus(ref: FocusRef) {
  if (ref.current)
    AccessibilityInfo.sendAccessibilityEvent(ref.current, 'focus');
}
function Overlay({
  visible,
  title,
  onClose,
  returnFocusRef,
  children,
  dialog = false,
  pending = false,
}: OverlayProps) {
  const t = useTheme(),
    { reducedMotion } = useAccessibilityPreferences(),
    heading = useRef<ViewInstance>(null),
    wasVisible = useRef(false);
  useEffect(() => {
    const closing = wasVisible.current && !visible;
    wasVisible.current = visible;
    if (closing && Platform.OS !== 'ios' && returnFocusRef) {
      const timer = setTimeout(() => focus(returnFocusRef), 0);
      return () => clearTimeout(timer);
    }
  }, [visible, returnFocusRef]);
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={() => {
        if (!pending) onClose();
      }}
      onShow={() => focus(heading)}
      onDismiss={() => {
        if (returnFocusRef) focus(returnFocusRef);
      }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: t.semantic.overlay }}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: dialog ? 'center' : 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            accessibilityViewIsModal
            importantForAccessibility="yes"
            style={{
              maxHeight: '100%',
              width: '100%',
              maxWidth: dialog
                ? t.primitives.layout.dialogMaxWidth
                : t.primitives.layout.sheetMaxWidth,
              alignSelf: 'center',
              backgroundColor: t.semantic.surface,
              padding: t.component.sheet.padding,
              borderRadius: t.component.sheet.radius,
              gap: t.primitives.space.lg,
            }}
          >
            <View
              ref={heading}
              accessible
              accessibilityRole="header"
              accessibilityLabel={title}
            >
              <Text variant="title">{title}</Text>
            </View>
            {!dialog ? (
              <IconButton
                label="Close sheet"
                icon="x"
                disabled={pending}
                onPress={onClose}
              />
            ) : null}
            <ScrollView
              style={{ flexShrink: 1 }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: t.primitives.space.lg }}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
export function Sheet(props: Omit<OverlayProps, 'dialog' | 'pending'>) {
  return <Overlay {...props} />;
}
export function ConfirmDialog({
  message,
  confirmLabel,
  onConfirm,
  pending = false,
  ...props
}: Omit<OverlayProps, 'children' | 'dialog'> & {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <Overlay {...props} dialog pending={pending}>
      <Stack>
        <Text>{message}</Text>
        <Button
          label={confirmLabel}
          variant="danger"
          pending={pending}
          onPress={onConfirm}
        />
        <Button
          label="Cancel"
          variant="secondary"
          disabled={pending}
          onPress={props.onClose}
        />
      </Stack>
    </Overlay>
  );
}
