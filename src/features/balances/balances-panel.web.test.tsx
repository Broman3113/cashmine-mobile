import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApiError, request } from '@/api';

import { BalancesPanel } from './balances-panel';

const secondsAgo = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString();

const balances = (items: unknown[], asOf = secondsAgo(12)) => ({ asOf, items });

const usdt = {
  asset: 'USDT',
  decimals: 6,
  available: '820.413207',
  pending: '50.12',
  claiming: '0',
  usdPrice: '1.0002',
};
const eth = { asset: 'ETH', decimals: 8, available: '0', pending: '0.1', claiming: '0.25', usdPrice: '3012.45' };

// jsdom has no fetch: stand in for request() with the same outcomes (client.test.ts covers the real one).
jest.mock('@/api', () => ({ ...jest.requireActual('@/api'), request: jest.fn() }));
const mockedRequest = jest.mocked(request);

function respondWith(...responses: { status: number; body: unknown }[]) {
  for (const { status, body } of responses) {
    mockedRequest.mockImplementationOnce(async (_path, { schema }) => {
      if (status >= 400) throw new ApiError('http', 'Request failed', status);
      const parsed = schema.safeParse(body);
      if (!parsed.success) throw new ApiError('parse', parsed.error.message, status);
      return parsed.data;
    });
  }
}

function renderPanel() {
  const onClaim = jest.fn();
  // No automatic retries or polling in tests: each response is consumed on purpose.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchInterval: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <BalancesPanel onClaim={onClaim} />
    </QueryClientProvider>,
  );
  return { onClaim };
}

afterEach(() => mockedRequest.mockReset());

describe('BalancesPanel (web)', () => {
  it('shows each asset, both USD figures (rounded down) and the snapshot age', async () => {
    respondWith({ status: 200, body: balances([usdt, eth]) });
    renderPanel();

    expect(await screen.findByText('$820.57')).toBeInTheDocument(); // available only: 820.5772896414
    // USDT 870.7073136414 + ETH 0.35 × 3012.45 = 1054.3575 → 1925.0648136414
    expect(screen.getByText(/Total incl. pending & claiming: \$1,925.06/)).toBeInTheDocument();
    expect(screen.getByText('820.413207 USDT')).toBeInTheDocument();
    expect(screen.getByText('0.25 ETH')).toBeInTheDocument();
    expect(screen.getByText('Updated 12s ago')).toBeInTheDocument();
  });

  it('opens a claim for the chosen asset and blocks claiming an empty balance', async () => {
    respondWith({ status: 200, body: balances([usdt, eth]) });
    const { onClaim } = renderPanel();

    await userEvent.click(await screen.findByRole('button', { name: 'Claim USDT' }));
    expect(onClaim).toHaveBeenCalledWith('USDT');
    expect(screen.getByRole('button', { name: 'Claim ETH' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows the error and loads the balances on retry', async () => {
    respondWith(
      { status: 503, body: { error: { code: 'SERVER', message: 'Temporary error' } } },
      { status: 200, body: balances([usdt]) },
    );
    renderPanel();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load balances. Server error.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('820.413207 USDT')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('says so when there are no balances yet', async () => {
    respondWith({ status: 200, body: balances([]) });
    renderPanel();
    expect(await screen.findByText('No payback balances yet.')).toBeInTheDocument();
    expect(screen.getAllByText('$0.00')).toHaveLength(1);
  });

  it('flags a snapshot older than a minute', async () => {
    respondWith({ status: 200, body: balances([usdt], secondsAgo(125)) });
    renderPanel();
    expect(await screen.findByText(/Updated 2 min ago. Balances may be out of date./)).toBeInTheDocument();
  });

  it('treats a response with a number amount as an error, not as data', async () => {
    respondWith({ status: 200, body: balances([{ ...usdt, available: 820.41 }]) });
    renderPanel();
    expect(await screen.findByRole('alert')).toHaveTextContent('Unexpected response from the server.');
  });
});
