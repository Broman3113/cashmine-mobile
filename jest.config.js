// Tests run once per platform: web (react-native-web + jsdom), iOS and Android.
//   x.test.tsx          all platforms
//   x.web.test.tsx      web only (DOM: @testing-library/react)
//   x.native.test.tsx   iOS and Android only (@testing-library/react-native)
const { getAndroidPreset, getIOSPreset, getWebPreset } = require('jest-expo/config/getPlatformPreset');

function project(preset, { ignore, setupFiles = [] }) {
  // These options are only valid at the root config; jest warns if a project sets them.
  const { passWithNoTests, watchPlugins, ...projectPreset } = preset;
  return {
    ...projectPreset,
    testPathIgnorePatterns: [...preset.testPathIgnorePatterns, ignore],
    moduleNameMapper: { ...preset.moduleNameMapper, '^@/(.*)$': '<rootDir>/src/$1' },
    setupFilesAfterEnv: [...(preset.setupFilesAfterEnv ?? []), ...setupFiles],
  };
}

module.exports = {
  passWithNoTests: true,
  projects: [
    project(getWebPreset(), { ignore: '\\.native\\.test\\.', setupFiles: ['<rootDir>/jest.setup.web.ts'] }),
    project(getIOSPreset(), { ignore: '\\.web\\.test\\.' }),
    project(getAndroidPreset(), { ignore: '\\.web\\.test\\.' }),
  ],
};
