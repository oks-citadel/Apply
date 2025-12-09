module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Commented out missing plugins - install if needed:
    // - babel-plugin-module-resolver
    // - react-native-reanimated
    // ['module-resolver',
    //   {
    //     root: ['./src'],
    //     extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
    //     alias: {
    //       '@': './src',
    //       '@components': './src/components',
    //       '@screens': './src/screens',
    //       '@navigation': './src/navigation',
    //       '@services': './src/services',
    //       '@store': './src/store',
    //       '@utils': './src/utils',
    //       '@types': './src/types',
    //       '@hooks': './src/hooks',
    //       '@theme': './src/theme',
    //     },
    //   },
    // ],
    // 'react-native-reanimated/plugin',
  ],
};
