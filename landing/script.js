const REPO = 'iiibnuadam/pakpost';
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases/latest`;
const RELEASES_PAGE = `https://github.com/${REPO}/releases`;

const PLATFORM_PATTERNS = {
  macIntel: { label: 'macOS Intel', ext: '.dmg', arch: 'x64_mac' },
  macSilicon: { label: 'macOS Apple Silicon', ext: '.dmg', arch: 'arm64_mac' },
  windows: { label: 'Windows', ext: '.exe', arch: 'x64_win' },
  linux: { label: 'Linux', ext: '.AppImage', arch: 'x64_linux' }
};

function getUserPlatform() {
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();

  if (platform.includes('mac') || platform.includes('darwin')) {
    // Apple Silicon detection is best effort via user agent.
    if (userAgent.includes('arm') || userAgent.includes('apple silicon')) {
      return 'macSilicon';
    }
    return 'macIntel';
  }

  if (platform.includes('win') || userAgent.includes('windows')) {
    return 'windows';
  }

  if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'linux';
  }

  return null;
}

function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function simpleMarkdownToHtml(text) {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^#{1,3}\s+(.*)$/gm, '<h3>$1</h3>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\*\s+(.*)$/gm, '<li>$1</li>')
    .replace(/(-\s+.*\n?)+/g, (match) => `<ul>${match.replace(/^-\s+(.*)$/gm, '<li>$1</li>')}</ul>`)
    .replace(/(\*\s+.*\n?)+/g, (match) => `<ul>${match.replace(/^\*\s+(.*)$/gm, '<li>$1</li>')}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function renderPrimaryDownload(asset, platformKey) {
  const platform = PLATFORM_PATTERNS[platformKey];
  const container = document.getElementById('primary-download');

  container.innerHTML = `
    <a href="${asset.browser_download_url}" class="button">
      Download Pakpost untuk ${platform.label}
      <small>${asset.name}</small>
    </a>
    <p class="release-date" style="margin-top: 12px;">
      Atau pilih versi untuk platform lain di bawah.
    </p>
  `;
}

function renderPlatforms(assets, primaryKey) {
  const container = document.getElementById('platforms');
  container.innerHTML = '';

  Object.entries(PLATFORM_PATTERNS).forEach(([key, info]) => {
    if (key === primaryKey) return;

    const asset = assets.find((a) =>
      a.name.includes(info.arch) && a.name.endsWith(info.ext)
    );

    if (!asset) return;

    const button = document.createElement('a');
    button.href = asset.browser_download_url;
    button.className = 'platform-button';
    button.innerHTML = `
      <span>${info.label}</span>
      <span class="ext">${info.ext}</span>
    `;
    container.appendChild(button);
  });

  // Always add a fallback link to the releases page.
  const fallback = document.createElement('a');
  fallback.href = RELEASES_PAGE;
  fallback.target = '_blank';
  fallback.rel = 'noopener noreferrer';
  fallback.className = 'platform-button';
  fallback.innerHTML = `<span>Lihat Semua Rilis</span><span class="ext">GitHub</span>`;
  container.appendChild(fallback);
}

async function loadLatestRelease() {
  const loadingEl = document.getElementById('loading');
  const contentEl = document.getElementById('download-content');
  const errorEl = document.getElementById('error');

  try {
    const response = await fetch(RELEASES_API);

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const release = await response.json();
    const assets = release.assets || [];

    document.getElementById('version').textContent = release.tag_name;
    document.getElementById('release-date').textContent = `Dirilis pada ${formatDate(release.published_at)}`;

    const primaryKey = getUserPlatform();
    let primaryAsset = null;

    if (primaryKey) {
      const info = PLATFORM_PATTERNS[primaryKey];
      primaryAsset = assets.find((a) =>
        a.name.includes(info.arch) && a.name.endsWith(info.ext)
      );
    }

    if (primaryAsset) {
      renderPrimaryDownload(primaryAsset, primaryKey);
    } else {
      document.getElementById('primary-download').innerHTML = `
        <a href="${RELEASES_PAGE}" target="_blank" rel="noopener noreferrer" class="button">
          Download Pakpost
          <small>Lihat semua versi di GitHub Releases</small>
        </a>
      `;
    }

    renderPlatforms(assets, primaryKey);

    const notesHtml = simpleMarkdownToHtml(release.body);
    document.getElementById('release-notes').innerHTML = `
      <div class="release-notes-body"><p>${notesHtml}</p></div>
    `;

    loadingEl.classList.add('hidden');
    contentEl.classList.remove('hidden');
  } catch (error) {
    console.error('Failed to load latest release:', error);
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
  }
}

document.getElementById('year').textContent = new Date().getFullYear();
loadLatestRelease();
