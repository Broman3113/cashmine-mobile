// DOM matchers (toHaveAttribute, toHaveStyle, ...) for web tests.
import '@testing-library/jest-dom';

// jsdom has no matchMedia; real browsers do. Reanimated (used by react-native-keyboard-controller)
// reads `prefers-reduced-motion` through it when imported.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
