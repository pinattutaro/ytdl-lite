const axios = require('axios');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const ytDlpPath = require('yt-dlp-static');

const execFileAsync = promisify(execFile);

const apikey = process.env.YOUTUBE_API_KEY;

const getVideoDetails = async (ytid) => {
    if (!apikey) {
        throw new Error('YOUTUBE_API_KEY is not set');
    }

	let url = 'https://www.googleapis.com/youtube/v3/videos';
	url += '?part=snippet'; // レスポンスに含める情報を指定
	url += '&id=' + ytid; // 取得する動画IDを指定
	url += '&key=' + apikey; // APIキーを指定
    console.log(`Fetching YouTube details for id=${ytid}`);

	try {
		const response = await axios.get(url);
        const firstItem = response?.data?.items?.[0];
        if (!firstItem) {
            throw new Error('Video details not found');
        }

        return firstItem;
	} catch (error) {
		console.error('Error fetching video details:', error);
        throw error;
	}
}

const pickBestMuxedFormat = (formats) => {
    if (!Array.isArray(formats)) {
        return null;
    }

    return formats
        .filter((f) => f && f.url && f.vcodec && f.acodec && f.vcodec !== 'none' && f.acodec !== 'none')
        .sort((a, b) => {
            const bHeight = Number(b.height || 0);
            const aHeight = Number(a.height || 0);
            if (bHeight !== aHeight) {
                return bHeight - aHeight;
            }

            return Number(b.tbr || 0) - Number(a.tbr || 0);
        })[0] || null;
};

const getStreamUrlByYtDlp = async (vid) => {
    const watchUrl = `https://www.youtube.com/watch?v=${vid}`;
    const args = [
        '--dump-single-json',
        '--no-warnings',
        '--no-playlist',
        watchUrl
    ];

    const { stdout } = await execFileAsync(ytDlpPath, args, {
        maxBuffer: 10 * 1024 * 1024
    });

    const parsed = JSON.parse(stdout);
    const best = pickBestMuxedFormat(parsed.formats);
    if (!best || !best.url) {
        throw new Error('No suitable format found');
    }

    return best.url;
};

const getStream = async (vid) => {
    try {
        const info = await getVideoDetails(vid);
        const snippet = info.snippet;
        console.log("Getting stream URL for:", snippet.title);

        const streamUrl = await getStreamUrlByYtDlp(vid);

        const title = `${snippet.channelTitle}-${snippet.title}`.replace(/\s/g,"").replace(/[\\/:*?"<>|\0]/g, '');

        return {
            title: title,
            thumbnail: snippet.thumbnails.high.url,
            url: streamUrl
        };
    } catch (err) {
        console.error('Error fetching stream URL:', err);
        return {
            title: 'Error',
            thumbnail: '',
            url: '',
            error: String(err && err.message ? err.message : err)
        };
    }
}

module.exports = {
    getStream
};