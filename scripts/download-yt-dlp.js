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

const request = https.get(url, (response) => {
  if (response.statusCode !== 200) {
    file.close();
    fs.unlinkSync(targetPath);
    console.error('[postinstall] Failed to download yt-dlp. Status:', response.statusCode);
    process.exit(1);
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
  file.close();
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
  console.error('[postinstall] yt-dlp download error:', error.message);
  process.exit(1);
});
