require('dotenv').config({ path: process.env.DOTENV_PATH });

const fs = require('fs');
const path = require('path');

const pkg = require('./package.json');

const defaults = {
  productName: 'PAKPOS',
  appId: 'com.pakpos.app',
  protocol: 'pakpos',
  publisherName: 'PAKPOS',
  copyrightOwner: 'PAKPOS',
  githubUrl: 'https://github.com/usebruno/bruno/issues',
  description: pkg.description || 'PAKPOS API Client (based on Bruno)'
};

const defaultAssets = {
  iconMac: 'resources/icons/mac/icon.icns',
  iconWin: 'resources/icons/win/icon.ico',
  iconLinux: 'resources/icons/png',
  aboutIcon: 'src/about/256x256.png'
};

const runtimeConfigPath = path.join(__dirname, 'resources', 'white-label.json');

function resolveAsset(relativeOrAbsolute) {
  if (!relativeOrAbsolute) return undefined;
  if (path.isAbsolute(relativeOrAbsolute)) return relativeOrAbsolute;
  return path.resolve(__dirname, relativeOrAbsolute);
}

function makeRelativeToRoot(absolutePath) {
  if (!absolutePath) return absolutePath;
  if (absolutePath.startsWith(__dirname)) {
    return path.relative(__dirname, absolutePath);
  }
  return absolutePath;
}

function fromEnv() {
  const productName = (process.env.WHITELABEL_PRODUCT_NAME || defaults.productName).trim();

  const values = {
    productName,
    appId: (process.env.WHITELABEL_APP_ID || defaults.appId).trim(),
    protocol: (process.env.WHITELABEL_PROTOCOL || defaults.protocol).trim(),
    publisherName: (process.env.WHITELABEL_PUBLISHER || defaults.publisherName).trim(),
    copyrightOwner: (
      process.env.WHITELABEL_COPYRIGHT_OWNER
      || process.env.WHITELABEL_PUBLISHER
      || defaults.copyrightOwner
    ).trim(),
    githubUrl: (process.env.WHITELABEL_GITHUB_URL || defaults.githubUrl).trim(),
    description: (process.env.WHITELABEL_DESCRIPTION || defaults.description).trim()
  };

  // Explicit asset env vars so they are easy to discover:
  values.iconMac = resolveAsset(process.env.WHITELABEL_ICON_MAC || defaultAssets.iconMac);
  values.iconWin = resolveAsset(process.env.WHITELABEL_ICON_WIN || defaultAssets.iconWin);
  values.iconLinux = resolveAsset(process.env.WHITELABEL_ICON_LINUX || defaultAssets.iconLinux);
  values.aboutIcon = resolveAsset(process.env.WHITELABEL_ABOUT_ICON || defaultAssets.aboutIcon);

  return values;
}

function writeRuntimeConfig(values = fromEnv()) {
  // Persist a portable JSON file. Paths that live inside this package are
  // stored relative so the generated file is relocatable and diff-friendly.
  const serializable = {
    productName: values.productName,
    appId: values.appId,
    protocol: values.protocol,
    publisherName: values.publisherName,
    copyrightOwner: values.copyrightOwner,
    githubUrl: values.githubUrl,
    description: values.description,
    iconMac: makeRelativeToRoot(values.iconMac),
    iconWin: makeRelativeToRoot(values.iconWin),
    iconLinux: makeRelativeToRoot(values.iconLinux),
    aboutIcon: makeRelativeToRoot(values.aboutIcon)
  };

  fs.writeFileSync(runtimeConfigPath, JSON.stringify(serializable, null, 2));
}

function readRuntimeConfig() {
  if (!fs.existsSync(runtimeConfigPath)) {
    return {};
  }

  try {
    const raw = JSON.parse(fs.readFileSync(runtimeConfigPath, 'utf8'));
    const assetKeys = ['iconMac', 'iconWin', 'iconLinux', 'aboutIcon'];
    const resolved = {};
    for (const key of Object.keys(raw)) {
      // Hanya path asset yang perlu di-resolve ke absolute.
      // Field teks seperti productName/appId/protocol harus tetap apa adanya.
      resolved[key]
        = typeof raw[key] === 'string' && assetKeys.includes(key)
          ? resolveAsset(raw[key])
          : raw[key];
    }
    return resolved;
  } catch (err) {
    console.warn('[white-label] failed to read runtime config:', err.message);
    return {};
  }
}

function getWhiteLabel() {
  // Runtime config (written at build time) wins over env vars so a packaged
  // build keeps the exact branding it was built with, even when the env vars
  // are not present on the end user's machine.
  return { ...fromEnv(), ...readRuntimeConfig() };
}

module.exports = {
  defaults,
  fromEnv,
  getWhiteLabel,
  writeRuntimeConfig,
  runtimeConfigPath
};
