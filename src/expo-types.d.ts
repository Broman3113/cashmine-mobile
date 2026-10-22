// Expo's global types (process.env for EXPO_PUBLIC_* variables, Metro require, etc.).
// Expo generates expo-env.d.ts with this line, but that file is git-ignored and only appears after
// `expo start`, so a fresh clone or CI would fail the typecheck without this committed copy.
/// <reference types="expo/types" />
