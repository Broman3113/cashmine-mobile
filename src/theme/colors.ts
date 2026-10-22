// Color palette taken from cashmine.io (its `--cm-*` CSS variables).

const light = {
  background: '#f5f2ee',
  surfaceCard: '#ffffff',
  surfaceField: '#efebe6',
  textPrimary: '#211d19',
  textSecondary: '#625b54',
  textTertiary: '#686159',
  textDisabled: '#80776f',
  textAccent: '#a94708',
  textPositive: '#21764b',
  textNegative: '#b83b38',
  borderDefault: '#d8d0c7',
  borderAccent: '#a94708',
  borderError: '#b83b38',
  brand: '#f58a3a',
  brandHover: '#ffa15a',
  brandActive: '#dc7224',
  brandDisabled: '#f4d5bd',
  onBrand: '#211d19',
  secondaryBg: '#e7e1da',
  secondaryBgHover: '#dcd4ca',
  secondaryFg: '#211d19',
};

export type Colors = typeof light;

const dark: Colors = {
  background: '#0d0c0b',
  surfaceCard: '#161412',
  surfaceField: '#1b1815',
  textPrimary: '#f5f2ee',
  textSecondary: '#c0b8b0',
  textTertiary: '#969089',
  textDisabled: '#776f67',
  textAccent: '#f58a3a',
  textPositive: '#47c98b',
  textNegative: '#ef6b68',
  borderDefault: '#ffffff13',
  borderAccent: '#f58a3a',
  borderError: '#ef6b68',
  brand: '#f58a3a',
  brandHover: '#ffa15a',
  brandActive: '#dc7224',
  brandDisabled: '#6f3a16',
  onBrand: '#211d19',
  secondaryBg: '#211d19',
  secondaryBgHover: '#2b251f',
  secondaryFg: '#f5f2ee',
};

export const colors = { light, dark };

export type ColorScheme = keyof typeof colors;
