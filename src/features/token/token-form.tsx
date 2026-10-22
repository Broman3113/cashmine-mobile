import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/spacing';
import { Button } from '@/ui/button';
import { Field } from '@/ui/field';
import { Text } from '@/ui/text';

type TokenFormProps = {
  /** The API rejected the previous token (401): wrong or expired. */
  isRejected: boolean;
  onSubmit: (token: string) => void;
};

export function TokenForm({ isRejected, onSubmit }: TokenFormProps) {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string>();

  const handleSubmit = () => {
    const trimmed = token.trim();
    if (!trimmed) {
      setError('Paste your API token');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <View style={styles.form}>
      <Text variant="title">Enter your API token</Text>
      <Text tone="secondary">Paste the token from your task email. It is kept in this browser only.</Text>

      {isRejected ? (
        <Text tone="negative" role="alert">
          That token was rejected or has expired. Enter a valid one.
        </Text>
      ) : null}

      <Field
        label="API token"
        value={token}
        error={error}
        onChangeText={(value) => {
          setToken(value);
          setError(undefined);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />

      <Button title="Continue" isFullWidth onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
});
