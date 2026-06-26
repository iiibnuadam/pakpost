const REPO = 'iiibnuadam/pakpost';
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases/latest`;
const TAGS_API = `https://api.github.com/repos/${REPO}/tags`;
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

function renderNoAssets(tagName) {
  const loadingEl = document.getElementById('loading');
  const contentEl = document.getElementById('download-content');

  document.getElementById('version').textContent = tagName;
  document.getElementById('release-date').textContent = 'Installer sedang diproses atau belum tersedia.';

  document.getElementById('primary-download').innerHTML = `
    <a href="${RELEASES_PAGE}" target="_blank" rel="noopener noreferrer" class="button">
      Cek GitHub Releases
      <small>Asset installer sedang diupload</small>
    </a>
  `;

  const platformsContainer = document.getElementById('platforms');
  platformsContainer.innerHTML = '';

  const fallback = document.createElement('a');
  fallback.href = RELEASES_PAGE;
  fallback.target = '_blank';
  fallback.rel = 'noopener noreferrer';
  fallback.className = 'platform-button';
  fallback.innerHTML = `<span>Lihat Semua Rilis</span><span class="ext">GitHub</span>`;
  platformsContainer.appendChild(fallback);

  document.getElementById('release-notes').innerHTML = `
    <div class="release-notes-body">
      <p>Tag <strong>${tagName}</strong> sudah dibuat, tapi asset installer belum tersedia di GitHub Releases.</p>
      <p>Hal ini biasanya terjadi karena workflow release masih berjalan atau mengalami kegagalan. Cek halaman GitHub Releases untuk informasi terbaru.</p>
    </div>
  `;

  loadingEl.classList.add('hidden');
  contentEl.classList.remove('hidden');
}

async function loadLatestRelease() {
  const loadingEl = document.getElementById('loading');
  const contentEl = document.getElementById('download-content');
  const errorEl = document.getElementById('error');

  try {
    const response = await fetch(RELEASES_API);

    if (response.status === 404) {
      // No GitHub Release exists yet. Try to fetch the latest tag instead.
      const tagsResponse = await fetch(TAGS_API);

      if (tagsResponse.ok) {
        const tags = await tagsResponse.json();
        if (tags.length > 0) {
          renderNoAssets(tags[0].name);
          return;
        }
      }

      throw new Error('No releases or tags found');
    }

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const release = await response.json();
    const assets = release.assets || [];

    // If the release exists but has no downloadable assets, show the no-assets state.
    if (assets.length === 0) {
      renderNoAssets(release.tag_name);
      return;
    }

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
