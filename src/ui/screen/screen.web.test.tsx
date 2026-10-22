import { render, screen } from '@testing-library/react';

import { Text } from '@/ui/text';

import { MAX_CONTENT_WIDTH, Screen } from './screen';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
// The real web fallback works in browsers but crashes in jsdom (Reanimated worklets need a UI runtime).
jest.mock('react-native-keyboard-controller', () => require('react-native-keyboard-controller/jest'));

describe('Screen (web)', () => {
  it('renders the content and the footer', () => {
    render(
      <Screen footer={<Text>Pay</Text>}>
        <Text>Content</Text>
      </Screen>,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Pay')).toBeInTheDocument();
  });

  it('caps the content width but lets the scroll area span the window', () => {
    render(
      <Screen>
        <Text>Content</Text>
      </Screen>,
    );
    const scrollArea = screen.getByTestId('screen-scroll');
    const content = scrollArea.firstElementChild!;
    expect(content).toHaveStyle({ maxWidth: `${MAX_CONTENT_WIDTH}px` });
    expect(scrollArea).not.toHaveStyle({ maxWidth: `${MAX_CONTENT_WIDTH}px` });
  });
});
