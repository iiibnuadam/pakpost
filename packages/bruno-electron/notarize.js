require('dotenv').config({ path: process.env.DOTENV_PATH });
const fs = require('fs');
const path = require('path');
const electron_notarize = require('electron-notarize');

const notarize = async function (params) {
  if (process.platform !== 'darwin') {
    return;
  }

  const appId = 'com.pakpost.app';
  const ascProvider = process.env.APPLE_ASC_PROVIDER;
  const teamId = process.env.APPLE_TEAM_ID;

  let appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`);
  if (!fs.existsSync(appPath)) {
    console.error(`Cannot find application at: ${appPath}`);
    return;
  }

  console.log(`Notarizing ${appId} found at ${appPath} using Apple ID ${process.env.APPLE_ID}`);

  try {
    const notarizeOptions = {
      appBundleId: appId,
      appPath: appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD
    };

    // Apple sudah deprecated altool; notarytool adalah metode modern.
    if (teamId) {
      notarizeOptions.tool = 'notarytool';
      notarizeOptions.teamId = teamId;
    } else if (ascProvider) {
      notarizeOptions.ascProvider = ascProvider;
    }

    await electron_notarize.notarize(notarizeOptions);
  } catch (error) {
    console.error(error);
    throw error;
  }

  console.log(`Done notarizing ${appId}`);
};

module.exports = notarize;
