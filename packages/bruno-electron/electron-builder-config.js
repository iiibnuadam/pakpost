const { getWhiteLabel, writeRuntimeConfig } = require('./white-label.config');

// Resolve branding from env vars and persist it so the packaged app uses the
// same values at runtime even when the build env vars are not present.
const wl = getWhiteLabel();
writeRuntimeConfig(wl);

// macOS signing & notarization
// Apple wajibkan app yang di-download dari internet harus signed + notarized
// supaya Gatekeeper tidak menampilkan "damaged" atau meminta xattr.
// Build lokal tetap unsigned jika env var ini tidak diset.
const appleIdentity = process.env.APPLE_IDENTITY;
const hasAppleCredentials = Boolean(process.env.APPLE_ID && process.env.APPLE_ID_PASSWORD);
const shouldSignAndNotarize = Boolean(appleIdentity && hasAppleCredentials);

const config = {
  appId: wl.appId,
  productName: wl.productName,
  copyright: `Copyright © ${new Date().getFullYear()} ${wl.copyrightOwner}`,
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
    icon: wl.iconMac,
    hardenedRuntime: shouldSignAndNotarize,
    identity: appleIdentity || null,
    entitlements: 'resources/entitlements.mac.plist',
    entitlementsInherit: 'resources/entitlements.mac.plist',
    notarize: false,
    gatekeeperAssess: shouldSignAndNotarize,
    protocols: [
      {
        name: wl.productName,
        schemes: [
          wl.protocol
        ]
      }
    ]
  },
  linux: {
    artifactName: '${productName}_${version}_${arch}_${os}.${ext}',
    icon: wl.iconLinux,
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
        name: wl.productName,
        schemes: [wl.protocol]
      }
    ],
    category: 'Development',
    desktop: {
      MimeType: `x-scheme-handler/${wl.protocol};`
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
    icon: wl.iconWin,
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'arm64']
      }
    ],
    sign: null,
    publisherName: wl.publisherName
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

module.exports = config;
