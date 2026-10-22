import { focusManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

import { listenToAppFocus } from './app-focus';

it('marks queries unfocused in the background and focused again when the app becomes active', () => {
  let emit: (state: AppStateStatus) => void = () => {};
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    emit = listener as (state: AppStateStatus) => void;
    return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
  });

  listenToAppFocus();

  emit('background');
  expect(focusManager.isFocused()).toBe(false);
  emit('active');
  expect(focusManager.isFocused()).toBe(true);
});
