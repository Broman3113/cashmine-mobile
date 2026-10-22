import type { TextInputProps } from 'react-native';

export type InputA11y = { messageId: string; message?: string; isInvalid: boolean };

// iOS/Android have no aria-describedby: screen readers read the hint after the label instead.
// The web version lives in input-a11y.web.ts.
export function getInputA11yProps({ message, isInvalid }: InputA11y): TextInputProps {
  return { accessibilityHint: message && isInvalid ? `Error: ${message}` : message };
}
