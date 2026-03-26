const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

const isLinux = process.platform === 'linux';

if (!isLinux) {
  console.log('[postinstall] Skip yt-dlp download on non-linux platform:', process.platform);
  process.exit(0);
}

const targetDir = path.join(__dirname, '..', 'bin');
const targetPath = path.join(targetDir, 'yt-dlp');
const url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';

fs.mkdirSync(targetDir, { recursive: true });

const file = fs.createWriteStream(targetPath);

const cleanupAndExit = (message) => {
  file.close(() => {
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
    console.error(message);
    process.exit(1);
  });
};

const download = (downloadUrl, redirectCount = 0) => {
  if (redirectCount > 5) {
    cleanupAndExit('[postinstall] Too many redirects while downloading yt-dlp');
    return;
  }

  const request = https.get(downloadUrl, (response) => {
    const statusCode = response.statusCode || 0;
    const location = response.headers.location;

    if ([301, 302, 303, 307, 308].includes(statusCode) && location) {
      const nextUrl = new URL(location, downloadUrl).toString();
      response.resume();
      download(nextUrl, redirectCount + 1);
      return;
    }

    if (statusCode !== 200) {
      response.resume();
      cleanupAndExit(`[postinstall] Failed to download yt-dlp. Status: ${statusCode}`);
      return;
    }

    response.pipe(file);
    file.on('finish', () => {
      file.close(() => {
        fs.chmodSync(targetPath, 0o755);
        console.log('[postinstall] Downloaded yt-dlp to', targetPath);
      });
    });
  });

  request.on('error', (error) => {
    cleanupAndExit(`[postinstall] yt-dlp download error: ${error.message}`);
  });
};

download(url);
