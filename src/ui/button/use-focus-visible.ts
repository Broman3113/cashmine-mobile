// Native: touch screens have no keyboard focus ring. The web version lives in use-focus-visible.web.ts.
export function useFocusVisible() {
  return {
    isFocusVisible: false,
    onFocus: () => {},
    onBlur: () => {},
  };
}
