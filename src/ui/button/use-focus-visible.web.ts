import { useState } from 'react';

// Web: show the focus ring only for keyboard focus, like CSS `:focus-visible`.
// A mouse or touch press also focuses the button, and a ring after every click looks broken.
let lastInputWasKeyboard = false;

if (typeof document !== 'undefined') {
  // Registered once per page for the app's lifetime, so there is nothing to clean up.
  document.addEventListener(
    'keydown',
    (event) => {
      if (!event.metaKey && !event.altKey && !event.ctrlKey) lastInputWasKeyboard = true;
    },
    true,
  );
  document.addEventListener('pointerdown', () => (lastInputWasKeyboard = false), true);
}

export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  return {
    isFocusVisible,
    onFocus: () => setIsFocusVisible(lastInputWasKeyboard),
    onBlur: () => setIsFocusVisible(false),
  };
}
