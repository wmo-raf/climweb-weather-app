const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { assetExts, sourceExts } = config.resolver;

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.transformer.minifierPath = 'metro-minify-terser';

config.transformer.minifierConfig = {
  compress: {
    drop_console: true,
  },
};

config.resolver.assetExts = assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...sourceExts, 'svg'];

module.exports = config;
