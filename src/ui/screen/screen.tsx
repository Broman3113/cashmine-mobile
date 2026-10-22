import { useState, type ReactNode } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/theme/spacing';
import { useTheme } from '@/theme/use-theme';

/** Content column width: phone-first, and readable when the web app is opened on a desktop. */
export const MAX_CONTENT_WIDTH = 560;

/** Space kept between the keyboard (or the footer above it) and the focused input. */
const FOCUSED_INPUT_GAP = spacing.lg;

export type ScreenProps = {
  children: ReactNode;
  /** Set to false when the content scrolls itself (FlatList); nested scroll views break virtualization. */
  scroll?: boolean;
  /** Pull-to-refresh. Works on iOS/Android; browsers have their own reload. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Pinned below the content and lifted above the keyboard. For the screen's main action. */
  footer?: ReactNode;
};

/**
 * Container for one screen's content: background, safe areas, scrolling, keyboard, max width.
 * Navigation chrome (header, tabs) and providers belong in _layout.tsx, not here.
 *
 * Keyboard (react-native-keyboard-controller, needs KeyboardProvider in the root layout):
 * the focused input is scrolled into view on iOS and Android alike. On web the library is a no-op
 * and the browser scrolls the focused input itself.
 */
export function Screen({ children, scroll = true, onRefresh, refreshing = false, footer }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [footerHeight, setFooterHeight] = useState(0);

  // The bottom safe area (home indicator) goes under whatever is lowest: the footer or the content.
  const contentBottom = spacing.content + (footer ? 0 : insets.bottom);

  // Scroll areas span the full width (scrollbar at the window edge, mouse wheel works over the side margins);
  // only the content inside them is capped at MAX_CONTENT_WIDTH.
  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {scroll ? (
        <KeyboardAwareScrollView
          testID="screen-scroll"
          style={styles.fill}
          contentContainerStyle={[styles.column, styles.content, { paddingBottom: contentBottom }]}
          // The footer rides on top of the keyboard, so the focused input must clear it too.
          bottomOffset={FOCUSED_INPUT_GAP + footerHeight}
          // Taps on buttons work while the keyboard is open; dragging the content hides the keyboard.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.brand}
                colors={[colors.brand]}
              />
            ) : undefined
          }
        >
          {children}
        </KeyboardAwareScrollView>
      ) : (
        <View style={[styles.fill, styles.column]}>{children}</View>
      )}

      {footer ? (
        // While the keyboard is open the home indicator is hidden under it, so drop that extra space.
        <KeyboardStickyView offset={{ opened: insets.bottom }}>
          <View
            style={[styles.footerBar, { backgroundColor: colors.background, borderTopColor: colors.borderDefault }]}
            onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
          >
            <View
              testID="screen-footer"
              style={[styles.column, styles.footer, { paddingBottom: spacing.content + insets.bottom }]}
            >
              {footer}
            </View>
          </View>
        </KeyboardStickyView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  column: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  content: { padding: spacing.content, gap: spacing.lg },
  footerBar: { borderTopWidth: 1 },
  footer: { paddingHorizontal: spacing.content, paddingTop: spacing.md, gap: spacing.md },
});
