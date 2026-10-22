import { readStoredToken, writeStoredToken } from './token-storage';

afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});

describe('token storage (web)', () => {
  it('keeps the token in localStorage and removes it', () => {
    writeStoredToken('abc');
    expect(readStoredToken()).toBe('abc');
    writeStoredToken(null);
    expect(readStoredToken()).toBeNull();
  });

  it('works without storage when the browser blocks it', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    expect(() => writeStoredToken('abc')).not.toThrow();
    expect(readStoredToken()).toBeNull();
  });
});
