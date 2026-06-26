require('dotenv').config({ path: process.env.DOTENV_PATH });

// macOS signing & notarization — hanya aktif kalau credential Apple diset.
const appleIdentity = process.env.APPLE_IDENTITY;
const shouldSignAndNotarize = Boolean(
  appleIdentity && process.env.APPLE_ID && process.env.APPLE_ID_PASSWORD
);

// Auto-update feed — baca dari env saat build.
const updateProvider = process.env.UPDATE_PROVIDER;
const updateOwner = process.env.UPDATE_OWNER;
const updateRepo = process.env.UPDATE_REPO;
const updateChannel = process.env.UPDATE_CHANNEL || 'latest';
const updateUrl = process.env.UPDATE_URL;

const config = {
  appId: 'com.pakpost.app',
  productName: 'Pakpost',
  electronVersion: '37.6.1',
  directories: {
    buildResources: 'resources',
    output: 'out'
  },
  extraResources: [
    {
      from: 'resources/data/sample-collection.json',
      to: 'data/sample-collection.json'
    }
  ],
  files: ['**/*'],
  mac: {
    artifactName: '${productName}_${version}_${arch}_${os}.${ext}',
    category: 'public.app-category.developer-tools',
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'resources/icons/mac/icon.icns',
    hardenedRuntime: shouldSignAndNotarize,
    identity: appleIdentity || null,
    entitlements: 'resources/entitlements.mac.plist',
    entitlementsInherit: 'resources/entitlements.mac.plist',
    notarize: false,
    gatekeeperAssess: shouldSignAndNotarize,
    protocols: [
      {
        name: 'Pakpost',
        schemes: [
          'pakpost'
        ]
      }
    ]
  },
  linux: {
    artifactName: '${productName}_${version}_${arch}_${os}.${ext}',
    icon: 'resources/icons/png',
    target: [
      {
        target: 'AppImage',
        arch: ['x64', 'arm64']
      },
      {
        target: 'deb',
        arch: ['x64', 'arm64']
      },
      {
        target: 'rpm',
        arch: ['x64', 'arm64']
      }
    ],
    protocols: [
      {
        name: 'Pakpost',
        schemes: ['pakpost']
      }
    ],
    category: 'Development',
    desktop: {
      MimeType: 'x-scheme-handler/pakpost;'
    }
  },
  deb: {
    // Docs: https://www.electron.build/configuration/linux#debian-package-options
    depends: [
      'libgtk-3-0',
      'libnotify4',
      'libnss3',
      'libxss1',
      'libxtst6',
      'xdg-utils',
      'libatspi2.0-0',
      'libuuid1',
      'libsecret-1-0',
      'libasound2' // #1036
    ]
  },
  win: {
    artifactName: '${productName}_${version}_${arch}_win.${ext}',
    icon: 'resources/icons/win/icon.ico',
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'arm64']
      }
    ],
    sign: null,
    publisherName: 'Pakpost'
  },
  nsis: {
    include: 'resources/installer.nsh',
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  }
};

if (shouldSignAndNotarize) {
  config.afterSign = 'notarize.js';
}

if (updateProvider) {
  const publishConfig = {
    provider: updateProvider,
    channel: updateChannel
  };

  if (updateProvider === 'github') {
    publishConfig.owner = updateOwner;
    publishConfig.repo = updateRepo;
  } else if (updateProvider === 'generic') {
    publishConfig.url = updateUrl;
  }

  config.publish = publishConfig;
}

module.exports = config;
