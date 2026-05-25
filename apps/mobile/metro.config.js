const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo support
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Block pnpm tmp dirs
const { blockList } = config.resolver;
config.resolver.blockList = Array.isArray(blockList)
  ? [...blockList, /\/node_modules\/.*_tmp_/]
  : blockList
    ? [blockList, /\/node_modules\/.*_tmp_/]
    : [/\/node_modules\/.*_tmp_/];

// NativeWind CSS support
const { withNativeWind } = require("nativewind/metro");
module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16,
});
