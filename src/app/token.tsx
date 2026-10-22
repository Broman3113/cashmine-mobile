import { setToken, useTokenState } from '@/api';
import { TokenForm } from '@/features/token';
import { Screen } from '@/ui/screen';

export default function TokenScreen() {
  const { isRejected } = useTokenState();

  return (
    <Screen>
      <TokenForm isRejected={isRejected} onSubmit={setToken} />
    </Screen>
  );
}
