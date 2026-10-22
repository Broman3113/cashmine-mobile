import { clearToken, getToken, getTokenState, rejectToken, setToken, subscribeToToken } from './token-store';

afterEach(() => clearToken());

describe('token store', () => {
  it('trims the token and treats a blank one as none', () => {
    setToken('  abc  ');
    expect(getToken()).toBe('abc');
    setToken('   ');
    expect(getToken()).toBeNull();
  });

  it('notifies subscribers on every change until they unsubscribe', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToToken(listener);
    setToken('abc');
    clearToken();
    unsubscribe();
    setToken('def');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('rejects only the token that got the 401', () => {
    setToken('new');
    rejectToken('old');
    expect(getTokenState()).toEqual({ token: 'new', isRejected: false });
    rejectToken('new');
    expect(getTokenState()).toEqual({ token: null, isRejected: true });
  });

  it('clears the rejected flag when a new token is set', () => {
    setToken('abc');
    rejectToken('abc');
    setToken('def');
    expect(getTokenState()).toEqual({ token: 'def', isRejected: false });
  });
});
