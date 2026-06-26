const path = require('path');
const fs = require('fs');

module.exports = function aboutBruno({ version }) {
  const currentYear = new Date().getFullYear();

  // Try to load the Pakpost logo as a base64 data URL so it can be embedded
  // in the about window without needing an external file load.
  let logoDataUrl = '';
  try {
    const logoPath = path.join(__dirname, '../../assets/images/logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (err) {
    // Logo is optional; fallback to nothing if it cannot be loaded.
  }

  const logoHtml = logoDataUrl
    ? `<img class="logo" src="${logoDataUrl}" width="80" height="80" alt="Pakpost logo" />`
    : `<div class="logo-placeholder">P</div>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=yes">
        <title>About Pakpost</title>
        <style>
            * {
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                text-align: center;
                margin: 0;
                padding: 24px;
                background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
                color: #1f2937;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
            }
            .logo {
                width: 80px;
                height: 80px;
                border-radius: 16px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                object-fit: contain;
            }
            .logo-placeholder {
                width: 80px;
                height: 80px;
                border-radius: 16px;
                background: #F4AA41;
                color: #fff;
                font-size: 36px;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }
            .title {
                font-size: 22px;
                margin-top: 16px;
                margin-bottom: 4px;
                font-weight: 700;
                color: #111827;
            }
            .version {
                font-size: 13px;
                color: #6b7280;
                font-weight: 500;
                margin-bottom: 12px;
            }
            .description {
                font-size: 12px;
                color: #4b5563;
                line-height: 1.5;
                max-width: 280px;
                margin: 0 auto 16px;
            }
            .divider {
                width: 40px;
                height: 2px;
                background: #e5e7eb;
                border-radius: 1px;
                margin: 8px auto;
            }
            .footer {
                font-size: 11px;
                color: #9ca3af;
                margin-top: 8px;
            }
        </style>
    </head>
    <body>
        ${logoHtml}
        <h2 class="title">Pakpost</h2>
        <div class="version">Version ${version}</div>
        <div class="divider"></div>
        <div class="description">
            A desktop API client for macOS, Windows, and Linux.<br>
            Based on <strong>Bruno</strong> — rebranded for Pakpost.
        </div>
        <footer class="footer">
            © ${currentYear} Pakpost
        </footer>
    </body>
    </html>
  `;
};
