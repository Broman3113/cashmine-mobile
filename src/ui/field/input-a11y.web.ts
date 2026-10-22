import type { TextInputProps } from 'react-native';

import type { InputA11y } from './input-a11y';

// Web: link the input to its hint/error element, like <input aria-describedby="...">.
// react-native-web forwards these attributes to the DOM; React Native's types do not declare them.
export function getInputA11yProps({ messageId, message, isInvalid }: InputA11y): TextInputProps {
  return {
    'aria-describedby': message ? messageId : undefined,
    'aria-invalid': isInvalid,
  } as TextInputProps;
}
