import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/theme/spacing';
import { Text } from '@/ui/text';

import { Screen, type ScreenProps } from './screen';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
// Official mock: KeyboardAwareScrollView renders as ScrollView, KeyboardStickyView as View.
jest.mock('react-native-keyboard-controller', () => require('react-native-keyboard-controller/jest'));

const HOME_INDICATOR = 34; // iPhone bottom inset

beforeEach(() => {
  jest.mocked(useSafeAreaInsets).mockReturnValue({ top: 47, bottom: HOME_INDICATOR, left: 0, right: 0 });
});

async function renderScreen(props: Partial<ScreenProps> = {}) {
  await render(
    <Screen {...props}>
      <Text>Content</Text>
    </Screen>,
  );
}

const contentPaddingBottom = () =>
  StyleSheet.flatten(screen.getByTestId('screen-scroll').props.contentContainerStyle).paddingBottom;

describe('Screen (native)', () => {
  it('scrolls its content by default and keeps taps working with the keyboard open', async () => {
    await renderScreen();
    expect(screen.getByText('Content')).toBeTruthy();
    expect(screen.getByTestId('screen-scroll').props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('does not add a scroll view when the content scrolls itself', async () => {
    await renderScreen({ scroll: false });
    expect(screen.getByText('Content')).toBeTruthy();
    expect(screen.queryByTestId('screen-scroll')).toBeNull();
  });

  describe('bottom safe area', () => {
    it('goes under the content when there is no footer', async () => {
      await renderScreen();
      expect(contentPaddingBottom()).toBe(spacing.content + HOME_INDICATOR);
    });

    it('goes under the footer, not twice', async () => {
      await renderScreen({ footer: <Text>Pay</Text> });
      expect(screen.getByText('Pay')).toBeTruthy();
      expect(contentPaddingBottom()).toBe(spacing.content);
      const footer = StyleSheet.flatten(screen.getByTestId('screen-footer').props.style);
      expect(footer.paddingBottom).toBe(spacing.content + HOME_INDICATOR);
    });
  });

  describe('keyboard', () => {
    it('keeps a gap between the keyboard and the focused input', async () => {
      await renderScreen();
      expect(screen.getByTestId('screen-scroll').props.bottomOffset).toBe(spacing.lg);
    });

    it('also clears the footer that rides on top of the keyboard', async () => {
      await renderScreen({ footer: <Text>Pay</Text> });
      const footerBar = screen.getByTestId('screen-footer').parent!;
      await fireEvent(footerBar, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 375, height: 88 } } });
      expect(screen.getByTestId('screen-scroll').props.bottomOffset).toBe(spacing.lg + 88);
    });
  });

  describe('pull to refresh', () => {
    it('is off without onRefresh', async () => {
      await renderScreen();
      expect(screen.getByTestId('screen-scroll').props.refreshControl).toBeUndefined();
    });

    it('calls onRefresh and shows the refreshing state', async () => {
      const onRefresh = jest.fn();
      await renderScreen({ onRefresh, refreshing: true });
      const refreshControl = screen.getByTestId('screen-scroll').props.refreshControl;
      expect(refreshControl.props.refreshing).toBe(true);
      refreshControl.props.onRefresh();
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });
});
